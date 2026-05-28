import { useState, useCallback, useRef } from 'react';
import { ConversationMessage } from '@/lib/types';

interface UseConversationOptions {
  scenario: string;
  productName: string;
  initialGreeting: string;
}

export function useConversation(options: UseConversationOptions) {
  const [conversation, setConversation] = useState<ConversationMessage[]>([
    {
      id: `msg-${Date.now()}`,
      role: 'customer',
      content: options.initialGreeting,
      timestamp: new Date(),
      audioUrl: '',
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnScore, setTurnScore] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');
  const [turnScores, setTurnScores] = useState<number[]>([]);
  const lastSpokenMessageIdRef = useRef<string>('');

  const calculateFinalSessionScore = useCallback((scores: number[]): number => {
    if (scores.length === 0) return 0;
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    return Math.round(average);
  }, []);

  const sendMessage = useCallback(
    async (userMessage: string) => {
      if (!userMessage.trim()) return;

      setError(null);
      setIsLoading(true);

      try {
        // Add user message to conversation
        const newUserMessage: ConversationMessage = {
          id: `msg-${Date.now()}-${Math.random()}`,
          role: 'trainee',
          content: userMessage,
          timestamp: new Date(),
        };
        setConversation((prev) => [...prev, newUserMessage]);

        // Get AI response
        const response = await fetch('/api/sales-simulator/customer-response', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scenario: options.scenario,
            productName: options.productName,
            conversationHistory: [...conversation, newUserMessage],
            traineMessage: userMessage,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to get AI response');
        }

        const data = await response.json();
        const aiResponseText = data.response || '';
        const score = data.score || data.convictionDelta || 50;
        const feedbackText = data.feedback || 'Keep going!';

        // Update turn score and turn scores array
        setTurnScore(score);
        setFeedback(feedbackText);
        const newTurnScores = [...turnScores, score];
        setTurnScores(newTurnScores);

        // Add AI message to conversation
        const newAIMessage: ConversationMessage = {
          id: `msg-${Date.now()}-${Math.random()}`,
          role: 'customer',
          content: aiResponseText,
          timestamp: new Date(),
          audioUrl: '',
        };

        setConversation((prev) => [...prev, newAIMessage]);
        
        // Store message ID for speech tracking
        lastSpokenMessageIdRef.current = newAIMessage.id;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMsg);
        console.error('[v0] Conversation error:', errorMsg);
      } finally {
        setIsLoading(false);
      }
    },
    [conversation, options.scenario, options.productName, turnScores]
  );

  const finalSessionScore = calculateFinalSessionScore(turnScores);

  return {
    conversation,
    isLoading,
    error,
    sendMessage,
    setConversation,
    turnScore,
    feedback,
    turnScores,
    finalSessionScore,
    lastSpokenMessageIdRef,
  };
}
