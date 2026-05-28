'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Send } from 'lucide-react';
import { SpeechToTextConverter } from '@/lib/speech-utils';

interface SpeechRecorderProps {
  onTranscriptSubmit: (transcript: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function SpeechRecorder({ onTranscriptSubmit, isLoading = false, disabled = false }: SpeechRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [showPermissionRequest, setShowPermissionRequest] = useState(false);
  const converterRef = useRef<SpeechToTextConverter | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      converterRef.current = new SpeechToTextConverter();
      setIsSupported(converterRef.current.isSupported());
    }
  }, []);

  const startRecording = async () => {
    if (!converterRef.current || !converterRef.current.isSupported()) {
      setShowPermissionRequest(true);
      return;
    }

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      setIsRecording(true);
      setTranscript('');

      converterRef.current.startListening((result) => {
        setTranscript(result.transcript);
      });
    } catch (error) {
      console.error('[v0] Microphone access denied:', error);
      setShowPermissionRequest(true);
    }
  };

  const stopRecording = () => {
    if (!converterRef.current) return;

    const finalTranscript = converterRef.current.stopListening();
    setIsRecording(false);
    setTranscript(finalTranscript);
  };

  const handleSubmit = () => {
    if (transcript.trim()) {
      onTranscriptSubmit(transcript.trim());
      setTranscript('');
    }
  };

  const handleTypeInput = (text: string) => {
    setTranscript(text);
  };

  if (!isSupported) {
    return (
      <div className="space-y-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
        <p className="text-sm text-gray-600">
          Speech recognition is not available in your browser. Please use Chrome, Edge, or Safari for voice input.
        </p>
        <p className="text-sm text-gray-600">You can still type your response below:</p>
        <textarea
          value={transcript}
          onChange={(e) => handleTypeInput(e.target.value)}
          placeholder="Type what you want to say to the customer..."
          className="w-full h-20 p-3 border border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none resize-none"
          disabled={disabled || isLoading}
        />
        <Button
          onClick={handleSubmit}
          disabled={!transcript.trim() || disabled || isLoading}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white"
        >
          {isLoading ? 'Sending...' : 'Send Response'}
          <Send className="w-4 h-4 ml-2" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4 bg-white rounded-lg border border-gray-200">
      {showPermissionRequest && (
        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-900">
          Please allow microphone access to use voice input. Check your browser permissions.
        </div>
      )}

      <div className="relative">
        <textarea
          value={transcript}
          onChange={(e) => handleTypeInput(e.target.value)}
          placeholder={isRecording ? 'Listening... Speak now...' : 'Speak or type your response...'}
          className={`w-full h-20 p-3 border rounded-lg focus:border-orange-500 focus:outline-none resize-none transition-colors ${
            isRecording ? 'border-orange-500 bg-orange-50' : 'border-gray-300'
          } ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={disabled || isLoading}
        />

        {isRecording && (
          <div className="absolute right-3 top-3">
            <div className="flex items-center gap-2">
              <div className="animate-pulse w-2 h-2 bg-red-600 rounded-full" />
              <span className="text-xs font-medium text-red-600">Recording...</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={disabled || isLoading}
          variant={isRecording ? 'destructive' : 'outline'}
          className={`flex-1 ${
            isRecording
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-orange-100 hover:bg-orange-200 text-orange-700'
          }`}
        >
          {isRecording ? (
            <>
              <MicOff className="w-4 h-4 mr-2" />
              Stop Recording
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 mr-2" />
              Start Recording
            </>
          )}
        </Button>

        <Button
          onClick={handleSubmit}
          disabled={!transcript.trim() || disabled || isLoading}
          className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
        >
          {isLoading ? 'Sending...' : 'Send Response'}
          <Send className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {transcript && !isRecording && (
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs font-medium text-gray-600 mb-2">Current input:</p>
          <p className="text-sm text-gray-900">{transcript}</p>
        </div>
      )}
    </div>
  );
}
