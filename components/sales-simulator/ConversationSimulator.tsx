'use client';

import { useEffect, useRef, useState } from 'react';
import { ConversationMessage, CustomerScenario } from '@/lib/types';
import { SpeechRecorder } from './SpeechRecorder';
import { SalesMetricsTracker } from './SalesMetricsTracker';
import { MessageCircle } from 'lucide-react';
import { autoPlayAIMessage, stopCurrentAudio, markUserInteraction } from '@/lib/voice-utils';
import { CustomerAvatarCard } from './CustomerAvatarCard';

interface ConversationSimulatorProps {
  scenario: CustomerScenario;
  productName: string;
  initialMessage: string;
  onConversationUpdate: (messages: ConversationMessage[]) => void;
  onMetricsUpdate?: (metrics: any) => void;
  isLoading?: boolean;
}

export function ConversationSimulator({
  scenario,
  productName,
  initialMessage,
  onConversationUpdate,
  onMetricsUpdate,
  isLoading = false,
}: ConversationSimulatorProps) {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [turnScore, setTurnScore] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');
  const [turnScores, setTurnScores] = useState<number[]>([]);
  const [metrics, setMetrics] = useState({
    convictionRate: scenario === 'warm_lead' ? 40 : scenario === 'skeptical' ? 20 : 30,
    pitchQuality: 0,
    engagementScore: 0,
    turnsToClose: 0,
    keyObjectionsHandled: 0,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);
  const lastSpokenMessageIdRef = useRef<string>('');

  // Initialize with customer's opening message
  useEffect(() => {
    if (!hasInitialized.current) {
      const customerOpening: ConversationMessage = {
        id: `msg-${Date.now()}-${Math.random()}`,
        role: 'customer',
        content: initialMessage,
        timestamp: new Date(),
      };
      setMessages([customerOpening]);
      onConversationUpdate([customerOpening]);
      hasInitialized.current = true;

      // Note: Do NOT auto-play initial message
      // Wait for user interaction first
      console.log('[ConversationSimulator] Initialized with greeting, waiting for user interaction');
    }
  }, [initialMessage, onConversationUpdate]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      console.log('[ConversationSimulator] Cleaning up audio on unmount');
      stopCurrentAudio();
    };
  }, []);

  // Auto-play new AI messages with Gemini TTS
  useEffect(() => {
    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    
    // Only auto-play customer (AI) messages that haven't been played yet
    if (
      lastMessage.role === 'customer' &&
      lastMessage.id !== lastSpokenMessageIdRef.current &&
      lastMessage.content
    ) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        console.log('[ConversationSimulator] Auto-playing message:', lastMessage.id);
        setIsSpeaking(true);
        autoPlayAIMessage(lastMessage.content, 'vi-VN', (error) => {
          console.error('[ConversationSimulator] Auto-play failed:', error);
          setIsSpeaking(false);
        }).then((success) => {
          if (success) {
            lastSpokenMessageIdRef.current = lastMessage.id;
            console.log('[ConversationSimulator] Message auto-played:', lastMessage.id);
            // Simulate speaking duration
            const speakingDuration = Math.min(lastMessage.content.length * 50, 10000);
            setTimeout(() => {
              setIsSpeaking(false);
            }, speakingDuration);
          } else {
            setIsSpeaking(false);
          }
        });
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [messages]);

  const handleSendMessage = async (transcript: string) => {
    if (!transcript.trim()) return;

    // Mark user interaction
    markUserInteraction();

    // Add trainee's message
    const traineeMessage: ConversationMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      role: 'trainee',
      content: transcript,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, traineeMessage];
    setMessages(updatedMessages);
    setIsProcessing(true);

    try {
      // Send to API for customer response
      const response = await fetch('/api/sales-simulator/customer-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scenario,
          productName,
          conversationHistory: updatedMessages,
          traineMessage: transcript,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get customer response');
      }

      const data = await response.json();

      // Extract score and feedback
      const score = data.score || data.convictionDelta || 50;
      const feedbackText = data.feedback || 'Keep going!';

      // Update turn score and turn scores array
      setTurnScore(score);
      setFeedback(feedbackText);
      const newTurnScores = [...turnScores, score];
      setTurnScores(newTurnScores);

      // Add customer's response
      const customerResponse: ConversationMessage = {
        id: `msg-${Date.now()}-${Math.random()}`,
        role: 'customer',
        content: data.response,
        timestamp: new Date(),
      };

      const finalMessages = [...updatedMessages, customerResponse];
      setMessages(finalMessages);
      onConversationUpdate(finalMessages);

      // Update metrics based on response
      const newMetrics = {
        ...metrics,
        convictionRate: Math.min(100, metrics.convictionRate + (data.convictionDelta || 5)),
        turnsToClose: Math.floor((finalMessages.length - 1) / 2),
        engagementScore: calculateEngagementScore(finalMessages),
        turnScore: score,
        finalSessionScore: calculateFinalSessionScore(newTurnScores),
      };

      setMetrics(newMetrics);
      if (onMetricsUpdate) {
        onMetricsUpdate(newMetrics);
      }
    } catch (error) {
      console.error('[v0] Error getting customer response:', error);
      // Fallback: add a generic customer response
      const fallbackResponse: ConversationMessage = {
        id: `msg-${Date.now()}-${Math.random()}`,
        role: 'customer',
        content: "That's interesting. Can you tell me more about how this would specifically help our team?",
        timestamp: new Date(),
      };

      const finalMessages = [...updatedMessages, fallbackResponse];
      setMessages(finalMessages);
      onConversationUpdate(finalMessages);
    } finally {
      setIsProcessing(false);
    }
  };

  const calculateEngagementScore = (msgs: ConversationMessage[]): number => {
    if (msgs.length < 3) return 20;
    if (msgs.length < 6) return 40;
    if (msgs.length < 10) return 60;
    return Math.min(100, 80 + (msgs.length - 10) * 2);
  };

  const calculateFinalSessionScore = (scores: number[]): number => {
    if (scores.length === 0) return 0;
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    return Math.round(average);
  };

  const scenarioLabel = {
    skeptical: 'Skeptical Customer',
    warm_lead: 'Warm Lead',
    random: 'Random Customer',
  }[scenario];

  const finalSessionScore = calculateFinalSessionScore(turnScores);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8 min-h-0 h-full lg:h-auto bg-white/50 rounded-[2rem] p-4 lg:p-6 border border-gray-200 shadow-sm">
      {/* Main Conversation Area */}
      <div className="lg:col-span-3 min-h-0 flex flex-col bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden h-full lg:h-auto">
        {/* Header */}
        <div className="shrink-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white p-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-xl drop-shadow-sm">{scenarioLabel}</h2>
              <p className="text-sm text-orange-100 font-medium mt-1">Selling {productName}</p>
            </div>
          </div>
        </div>

        {/* Messages Container - Fixed: flex-1 overflow-y-auto min-h-0 prevents overlap */}
        <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-5 bg-gray-50/50">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'trainee' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                  message.role === 'trainee'
                    ? 'bg-orange-600 text-white rounded-br-none'
                    : 'bg-white text-gray-900 border border-gray-200 rounded-bl-none'
                }`}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
                <p
                  className={`text-xs mt-2 ${
                    message.role === 'trainee' ? 'opacity-75 text-white' : 'text-gray-500'
                  }`}
                >
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))}

          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-white text-gray-900 border border-gray-200 px-4 py-3 rounded-lg rounded-bl-none">
                <div className="flex gap-2">
                  <div className="animate-bounce w-2 h-2 bg-orange-600 rounded-full" />
                  <div className="animate-bounce w-2 h-2 bg-orange-600 rounded-full" style={{ animationDelay: '0.1s' }} />
                  <div className="animate-bounce w-2 h-2 bg-orange-600 rounded-full" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="shrink-0 p-6 border-t border-gray-200 bg-white">
          <SpeechRecorder onTranscriptSubmit={handleSendMessage} isLoading={isProcessing} disabled={isLoading} />
        </div>
      </div>

      {/* Metrics Sidebar */}
      <div className="lg:col-span-1 min-h-0 space-y-6 overflow-y-auto h-full lg:h-auto lg:pr-2 custom-scrollbar">
        {/* Customer Avatar */}
        <CustomerAvatarCard 
          isSpeaking={isSpeaking}
          stage={scenario === 'warm_lead' ? 'mid' : 'early'}
          customerName={scenarioLabel}
        />

        <SalesMetricsTracker 
          metrics={metrics} 
          scenario={scenario}
          turnScore={turnScore}
          finalSessionScore={finalSessionScore}
          feedback={feedback}
        />
      </div>
    </div>
  );
}
