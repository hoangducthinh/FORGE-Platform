'use client';

import { useCallback, useRef, useState } from 'react';
import { Mic, Square, Play, Trash2, Loader2 } from 'lucide-react';
import { requestMicrophoneAccess, createMediaRecorder, formatDuration, transcribeAudio } from '@/lib/voice-utils';

interface VoiceRecorderProps {
  onTranscriptionComplete: (transcription: string, audioBlob: Blob) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

export default function VoiceRecorder({ onTranscriptionComplete, onError, disabled = false }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [duration, setDuration] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(async () => {
    try {
      audioChunksRef.current = [];
      const stream = await requestMicrophoneAccess();
      streamRef.current = stream;

      const mediaRecorder = createMediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setDuration(recordingTime);

        // Auto-transcribe
        setIsTranscribing(true);
        try {
          const transcription = await transcribeAudio(audioBlob);
          onTranscriptionComplete(transcription, audioBlob);
        } catch (error) {
          onError?.('Failed to transcribe audio');
          console.error('Transcription error:', error);
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start recording';
      onError?.(message);
    }
  }, [onTranscriptionComplete, onError, recordingTime]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      // Stop all tracks
      streamRef.current?.getTracks().forEach((track) => track.stop());

      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
  }, [isRecording]);

  const deleteRecording = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl('');
    setDuration(0);
    setRecordingTime(0);
    audioChunksRef.current = [];
  }, [audioUrl]);

  return (
    <div className="w-full space-y-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <Mic className="h-4 w-4" />
        Voice Recording
      </div>

      {!audioUrl ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            {isRecording ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
                  <span className="text-sm font-mono text-red-600">{formatDuration(recordingTime)}</span>
                </div>
                <button
                  onClick={stopRecording}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
                  aria-label="Stop recording"
                >
                  <Square className="h-4 w-4" />
                  Stop Recording
                </button>
              </>
            ) : (
              <button
                onClick={startRecording}
                disabled={disabled}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                aria-label="Start recording"
              >
                <Mic className="h-4 w-4" />
                Start Recording
              </button>
            )}
          </div>
          {isTranscribing && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Transcribing your response...
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-white p-3">
            <div>
              <div className="text-sm font-medium text-gray-900">Recording captured</div>
              <div className="text-xs text-gray-500">{formatDuration(duration)}</div>
            </div>
            <button
              onClick={deleteRecording}
              className="inline-flex items-center gap-1 rounded px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Delete recording"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>

          <audio
            controls
            src={audioUrl}
            className="w-full rounded-lg bg-white"
            aria-label="Recorded audio playback"
          />

          {isTranscribing ? (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Transcribing...
            </div>
          ) : (
            <button
              onClick={startRecording}
              className="w-full rounded-lg bg-gray-100 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
              aria-label="Record again"
            >
              Record Again
            </button>
          )}
        </div>
      )}
    </div>
  );
}
