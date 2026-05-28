// Web Speech API utilities for speech-to-text conversion (browser-native)
// NOTE: Server-side transcription is now handled by Gemini API in /api/transcribe
export interface SpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
  confidence: number;
}

export interface SpeechErrorEvent {
  error: string;
}

export class SpeechToTextConverter {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;
  private transcript = '';
  private finalTranscript = '';

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.setupRecognition();
      }
    }
  }

  private setupRecognition() {
    if (!this.recognition) return;

    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onstart = () => {
      this.isListening = true;
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };

    this.recognition.onerror = (event: Event) => {
      const errorEvent = event as any;
      console.error('[v0] Speech recognition error:', errorEvent.error);
    };
  }

  startListening(onResult: (result: SpeechRecognitionResult) => void): void {
    if (!this.recognition) {
      console.error('[v0] Web Speech API not supported in this browser');
      return;
    }

    this.transcript = '';
    this.finalTranscript = '';
    this.isListening = true;

    this.recognition.onresult = (event: Event) => {
      const recognitionEvent = event as any;
      this.transcript = '';

      for (let i = recognitionEvent.resultIndex; i < recognitionEvent.results.length; i++) {
        const transcriptSegment = recognitionEvent.results[i][0].transcript;
        const isFinal = recognitionEvent.results[i].isFinal;
        const confidence = recognitionEvent.results[i][0].confidence;

        if (isFinal) {
          this.finalTranscript += transcriptSegment + ' ';
        } else {
          this.transcript += transcriptSegment;
        }

        onResult({
          transcript: (this.finalTranscript + this.transcript).trim(),
          isFinal,
          confidence,
        });
      }
    };

    try {
      this.recognition.start();
    } catch (error) {
      console.error('[v0] Error starting speech recognition:', error);
    }
  }

  stopListening(): string {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (error) {
        console.error('[v0] Error stopping speech recognition:', error);
      }
    }
    this.isListening = false;
    return this.finalTranscript.trim();
  }

  abortListening(): void {
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (error) {
        console.error('[v0] Error aborting speech recognition:', error);
      }
    }
    this.isListening = false;
    this.transcript = '';
    this.finalTranscript = '';
  }

  isSupported(): boolean {
    return this.recognition !== null;
  }

  getIsListening(): boolean {
    return this.isListening;
  }
}

// Client-side mock transcription fallback (for development or when Gemini API is unavailable)
export function mockTranscribe(audioLength: number): string {
  const mockTranscriptions = [
    'I think CloudSync Pro could really help our team collaborate better',
    'Can you tell me more about the security features and data protection',
    'What is the pricing structure and are there any setup or implementation costs',
    'How long does it typically take to integrate with our existing tools',
    'What kind of customer support do you provide during and after implementation',
    'Can you walk me through a real example of how a team like ours would use this',
    'What makes CloudSync Pro different from the other tools we could use',
    'Do you offer any training or onboarding assistance for our team',
  ];

  // Return a random mock transcription based on audio length
  const randomIndex = Math.floor(Math.random() * mockTranscriptions.length);
  return mockTranscriptions[randomIndex];
}
