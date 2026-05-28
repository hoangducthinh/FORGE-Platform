import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TextChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

export function TextChatInput({
  onSendMessage,
  isLoading,
  placeholder = 'Type your response...',
}: TextChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }, [message]);

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
    // Allow Enter with Shift for new line
  };

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <div className="flex gap-3">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          rows={1}
          aria-label="Message input field"
          aria-describedby="keyboard-hint"
          className="flex-1 resize-none rounded-lg border border-gray-300 p-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 disabled:bg-gray-100 disabled:text-gray-500"
        />
        <Button
          onClick={handleSend}
          disabled={isLoading || !message.trim()}
          size="sm"
          aria-label="Send message"
          title="Send message (Ctrl+Enter)"
          className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
        >
          <Send className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Send</span>
        </Button>
      </div>
      <p id="keyboard-hint" className="mt-2 text-xs text-gray-500">
        Press Ctrl+Enter (or Cmd+Enter on Mac) to send
      </p>
    </div>
  );
}
