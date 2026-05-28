'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { Message } from '@/lib/types';

export function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I\'m your FORGE AI Assistant. I can help you with course content, answer questions about lessons, and provide learning recommendations. What can I help you with today?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: String(Date.now()),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response with mock data
    setTimeout(() => {
      const mockResponses = [
        'That\'s a great question! Based on the course material, the key concept is understanding how systems work together. Would you like me to explain further?',
        'I can help with that! Consider reviewing the lesson on this topic. The main points are typically covered in the resources section.',
        'Great initiative! To succeed, focus on the core principles first, then practice with real-world scenarios. Need specific examples?',
        'This relates to our company values discussed in the onboarding module. Would you like me to link you to that lesson?',
        'Based on your progress, I recommend trying the advanced module next. You\'re doing well! Keep up the great work!',
      ];

      const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];

      const aiMessage: Message = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: randomResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1000);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-orange-600 to-red-600 rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-shadow"
        aria-label="Open AI chat"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-32px)] h-[600px] max-h-[80vh] bg-white rounded-lg shadow-xl flex flex-col border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-t-lg">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          <span className="font-semibold">FORGE AI Assistant</span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="hover:bg-white/20 p-1 rounded transition"
          aria-label="Close chat"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-4 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-orange-600 text-white rounded-br-none'
                  : 'bg-gray-100 text-gray-900 rounded-bl-none'
              }`}
            >
              <p className="text-sm">{message.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg rounded-bl-none">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask something..."
            className="flex-1 text-sm"
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            size="sm"
            disabled={isLoading || !input.trim()}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
