import { Mic, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ModeToggleProps {
  mode: 'voice' | 'text';
  onModeChange: (mode: 'voice' | 'text') => void;
}

export function ModeToggle({ mode, onModeChange }: ModeToggleProps) {
  return (
    <div className="border-b border-gray-200 bg-white px-4 py-2" role="region" aria-label="Interaction mode selector">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Interaction Mode</h3>
        <div className="flex gap-2" role="group" aria-label="Choose communication method">
          <Button
            onClick={() => onModeChange('voice')}
            variant={mode === 'voice' ? 'default' : 'outline'}
            size="sm"
            aria-pressed={mode === 'voice'}
            aria-label="Voice mode: speak with microphone"
            className={`gap-2 ${
              mode === 'voice'
                ? 'bg-orange-600 text-white hover:bg-orange-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Mic className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Voice</span>
          </Button>
          <Button
            onClick={() => onModeChange('text')}
            variant={mode === 'text' ? 'default' : 'outline'}
            size="sm"
            aria-pressed={mode === 'text'}
            aria-label="Text mode: type messages"
            className={`gap-2 ${
              mode === 'text'
                ? 'bg-orange-600 text-white hover:bg-orange-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <MessageSquare className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Text</span>
          </Button>
        </div>
      </div>
      <p className="mt-1 text-xs text-gray-600" role="status" aria-live="polite">
        {mode === 'voice'
          ? 'Use your microphone to speak with the AI customer'
          : 'Type your messages to practice sales conversation'}
      </p>
    </div>
  );
}
