'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2, VolumeX, AlertCircle, CheckCircle, UserCircle, MapPin, Building2, TrendingUp, ShieldCheck, ArrowRight, MessageCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
type DbSession = import('@/lib/supabase/database.types').Database['public']['Tables']['simulator_sessions']['Row'];

import { ModeToggle } from '@/components/sales-simulator/ModeToggle';
import { TextChatInput } from '@/components/sales-simulator/TextChatInput';
import { CustomerAvatarCard } from '@/components/sales-simulator/CustomerAvatarCard';
import {
  requestGeminiTTS,
  playGeneratedAudio,
  stopCurrentAudio,
  markUserInteraction,
  manualPlayAudio,
} from '@/lib/voice-utils';

interface ConversationMessage {
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
  id?: string;
  audioBase64?: string;
  mimeType?: string;
}

interface AISalesSimulatorProps {
  productName: string;
  productDescription: string;
  productPrice: string;
  scenarioDescription: string;
  keyFeatures?: string[];
  salesTips?: string[];
  openingMessage?: string;
  courseId: string;
  lessonId: string;
  onBack?: () => void;
  onLessonComplete?: () => void;
  simulationMode?: 'sales' | 'knowledge_check';
  simulatorConfig?: any;
}

export default function AISalesSimulator({
  productName,
  productDescription,
  productPrice,
  scenarioDescription,
  keyFeatures = [],
  salesTips = [],
  openingMessage,
  courseId,
  lessonId,
  onBack,
  onLessonComplete,
  simulationMode = 'sales',
  simulatorConfig,
}: AISalesSimulatorProps) {
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [salesScore, setSalesScore] = useState(50);
  const [feedback, setFeedback] = useState<string>('Hãy bắt đầu tư vấn để hệ thống AI phân tích và đánh giá kỹ năng của bạn.');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [mode, setMode] = useState<'voice' | 'text'>('voice');
  const [turnScores, setTurnScores] = useState<number[]>([]);
  const [currentStage, setCurrentStage] = useState('early');
  const [saleOutcome, setSaleOutcome] = useState<string | null>(null);
  const [isConversationComplete, setIsConversationComplete] = useState(false);
  const [closingOutcome, setClosingOutcome] = useState<'success' | 'failure' | null>(null);
  const [persona, setPersona] = useState<'skeptical' | 'warm_lead' | 'random'>('random');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [maxDurationSeconds, setMaxDurationSeconds] = useState(simulatorConfig?.sessionSettings?.estimatedMinutes ? simulatorConfig.sessionSettings.estimatedMinutes * 60 : 900);

  const [isInitializingHistory, setIsInitializingHistory] = useState(true);

  useEffect(() => {
    if (isConversationComplete && onLessonComplete) {
      onLessonComplete();
    }
  }, [isConversationComplete, onLessonComplete]);
  const supabase: any = createClient();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (sessionId && !isConversationComplete && !isInitializingHistory) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionId, isConversationComplete, isInitializingHistory]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };


  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRefRef = useRef<HTMLAudioElement | null>(null);
  const conversationEndRef = useRef<HTMLDivElement>(null);
  const lastSpokenMessageIdRef = useRef<string>('');

  useEffect(() => {
    const loadSession = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsInitializingHistory(false);
          return;
        }

        const { data: sessionData, error: sessionError } = await supabase
          .from('simulator_sessions')
          .select('*')
          .eq('user_id', user.id)
          .eq('lesson_id', lessonId)
          .eq('status', 'in_progress')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (sessionError && sessionError.code !== 'PGRST116') {
          console.error('Error fetching session:', sessionError);
        }

        if (sessionData) {
          setSessionId(sessionData.id);
          setSalesScore(sessionData.current_score);
          setCurrentStage(sessionData.current_stage);
          setElapsedSeconds(sessionData.elapsed_seconds || 0);
          setMaxDurationSeconds(sessionData.max_duration_seconds || maxDurationSeconds);
          setFeedback(sessionData.last_feedback || 'Hãy tiếp tục tư vấn.');

          const { data: messages, error: messagesError } = await supabase
            .from('simulator_messages')
            .select('*')
            .eq('session_id', sessionData.id)
            .order('created_at', { ascending: true });

          if (!messagesError && messages && messages.length > 0) {
            const mappedConversation: ConversationMessage[] = messages.map((m: any) => ({
              id: m.id,
              role: m.role === 'customer' || m.role === 'system' ? 'ai' : 'user',
              content: m.content,
              timestamp: new Date(m.created_at),
              audioBase64: m.audio_url || undefined,
            }));
            setConversation(mappedConversation);
          } else if (!messages || messages.length === 0) {
            initializeNewSession(sessionData.id);
          }
        } else {
          // Create new session
          const { data: newSession, error: createError } = await supabase
            .from('simulator_sessions')
            .insert({
              user_id: user.id,
              course_id: courseId,
              lesson_id: lessonId,
              status: 'in_progress',
              started_at: new Date().toISOString(),
              max_duration_seconds: maxDurationSeconds,
              current_stage: 'early',
              current_score: 50,
              session_avg: 50,
              turns_count: 0
            })
            .select()
            .single();

          if (newSession && !createError) {
            setSessionId(newSession.id);
            initializeNewSession(newSession.id);
          } else {
             console.error('Create session error:', createError);
             initializeNewSession(null);
          }
        }
      } catch (err) {
        console.error('Load session error:', err);
        initializeNewSession(null);
      } finally {
        setIsInitializingHistory(false);
      }
    };

    loadSession();
  }, [courseId, lessonId]);

  const initializeNewSession = (sid: string | null) => {
    const greeting = openingMessage || (simulationMode === 'knowledge_check' 
      ? 'Chào bạn, tôi sẽ kiểm tra nhanh kiến thức bất động sản cơ bản. Bạn có thể giải thích bất động sản là gì không?' 
      : `Chào bạn, tôi đang quan tâm đến ${productName}. Bạn có thể giới thiệu rõ hơn về dự án này không?`);
    const initialMsg: ConversationMessage = {
      role: 'ai',
      content: greeting,
      timestamp: new Date(),
      id: `msg-${Date.now()}`,
    };
    setConversation([initialMsg]);

    if (sid) {
      supabase.auth.getUser().then(({ data: { user } }: any) => {
        if (user) {
          supabase.from('simulator_messages').insert({
            session_id: sid,
            user_id: user.id,
            role: 'customer',
            content: greeting,
            stage: 'early'
          }).then(({ error }: any) => { if (error) console.warn(error); });
        }
      });
    }
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  // Auto-play new AI messages with TTS
  useEffect(() => {
    if (conversation.length === 0) return;

    const lastMessage = conversation[conversation.length - 1];

    if (
      lastMessage.role === 'ai' &&
      lastMessage.id !== lastSpokenMessageIdRef.current &&
      lastMessage.content &&
      !lastMessage.audioBase64
    ) {
      lastSpokenMessageIdRef.current = lastMessage.id || '';

      const processTTS = async () => {
        try {
          const ttsResult = await requestGeminiTTS(lastMessage.content, 'vi-VN');
          
          if (!ttsResult.error && ttsResult.audioBase64) {
            setConversation(prev => prev.map(msg => 
              msg.id === lastMessage.id 
                ? { ...msg, audioBase64: ttsResult.audioBase64, mimeType: ttsResult.mimeType || 'audio/mpeg' } 
                : msg
            ));

            setIsSpeaking(true);
            try {
              await playGeneratedAudio(ttsResult.audioBase64, ttsResult.mimeType || 'audio/mpeg', false);
            } catch (playErr) {
              console.warn('[AISalesSimulator] Auto-play blocked or failed', playErr);
            } finally {
              setIsSpeaking(false);
            }
          }
        } catch (err) {
          console.error('[AISalesSimulator] Failed to process TTS:', err);
          setIsSpeaking(false);
        }
      };

      processTTS();
    }
  }, [conversation]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      stopCurrentAudio();
    };
  }, []);

  const startRecording = async () => {
    markUserInteraction();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await handleAudioTranscription(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Unable to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleAudioTranscription = async (audioBlob: Blob) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Transcription failed');

      const data = await response.json();
      const userMessage = data.text;
      setTranscription(userMessage);

      const newUserMessage: ConversationMessage = {
        role: 'user',
        content: userMessage,
        timestamp: new Date(),
        id: `msg-${Date.now()}-${Math.random()}`,
      };
      setConversation((prev) => [...prev, newUserMessage]);

      await getAIResponse(userMessage);
    } catch (error) {
      console.error('Transcription error:', error);
      setErrorMessage('Không thể xử lý giọng nói. Vui lòng thử lại hoặc chuyển sang chế độ Text.');
      setMode('text');
    } finally {
      setIsLoading(false);
    }
  };

  const getAIResponse = async (userMessage: string) => {
    setIsLoading(true);
    try {
      const currentSessionScore = salesScore;

      // Save user message
      if (sessionId) {
        supabase.auth.getUser().then(({ data: { user } }: any) => {
          if (user) {
            supabase.from('simulator_messages').insert({
              session_id: sessionId,
              user_id: user.id,
              role: 'sales',
              content: userMessage
            }).then(({ error }: any) => { if (error) console.warn(error); });
          }
        });
      }

      const response = await fetch('/api/sales-simulator/customer-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          traineMessage: userMessage,
          productName,
          productDescription,
          productPrice,
          conversationHistory: conversation,
          turnCount: Math.floor((conversation.length + 1) / 2),
          sessionScore: currentSessionScore,
          scenario: persona,
          mode: simulationMode,
          simulatorConfig,
        }),
      });

      if (!response.ok) throw new Error('AI response failed');

      const data = await response.json();
      const aiMessage = data.customerReply || data.response;
      const scoreUpdate = data.score !== undefined ? data.score : (currentSessionScore + data.convictionDelta * 2);
      const feedbackText = data.feedback || 'Bạn đang làm rất tốt, hãy tiếp tục!';
      const stage = data.stage || 'early';
      const outcome = data.outcome || null;
      const isComplete = data.isConversationComplete || false;
      const responseSource = data.responseSource || 'unknown';

      console.log('\n=========================================');
      console.log('🤖 AI RESPONSE DEBUG INFO:');
      console.log('▶ customerReply:', aiMessage);
      console.log('▶ responseSource:', responseSource);
      console.log('▶ nextStage:', stage);
      console.log('▶ scoreDelta:', data.scoreDelta);
      console.log('▶ usedFallback:', responseSource !== 'gemini');
      console.log('=========================================\n');

      setSalesScore(scoreUpdate);
      setFeedback(feedbackText);
      setTurnScores((prev) => [...prev, scoreUpdate]);
      setCurrentStage(stage);

      if (sessionId) {
        supabase.auth.getUser().then(({ data: { user } }: any) => {
          if (user) {
            supabase.from('simulator_messages').insert({
              session_id: sessionId,
              user_id: user.id,
              role: 'customer',
              content: aiMessage,
              response_source: responseSource,
              score_delta: data.scoreDelta,
              stage: stage,
              turn_score: data.turnScore,
              topic_key: data.topicKey
            }).then(({ error }: any) => { if (error) console.warn(error); });

            const newTurnsCount = Math.floor((conversation.length + 2) / 2);
            supabase.from('simulator_sessions').update({
               current_score: scoreUpdate,
               current_stage: stage,
               session_avg: finalSessionScore,
               turns_count: newTurnsCount,
               last_feedback: feedbackText,
               elapsed_seconds: elapsedSeconds,
               updated_at: new Date().toISOString(),
               status: isComplete ? 'completed' : 'in_progress'
            }).eq('id', sessionId).then(({ error }: any) => { if (error) console.warn(error); });
          }
        });
      }

      if (isComplete && outcome) {
        setIsConversationComplete(true);
        setSaleOutcome(outcome);
        
        const history = JSON.parse(localStorage.getItem('forge-simulator-history') || '[]');
        history.push({
          date: new Date().toISOString(),
          score: scoreUpdate,
          outcome,
          persona,
          productName
        });
        localStorage.setItem('forge-simulator-history', JSON.stringify(history));
      }

      const newAIMessage: ConversationMessage = {
        role: 'ai',
        content: aiMessage,
        timestamp: new Date(),
        id: `msg-${Date.now()}-${Math.random()}`,
      };
      setConversation((prev) => [...prev, newAIMessage]);
      setTranscription('');
      setErrorMessage('');
    } catch (error) {
      console.error('AI response error:', error);
      setFeedback('AI đánh giá đang tạm lỗi, nhưng hội thoại vẫn tiếp tục.');
      setErrorMessage('Có lỗi xảy ra khi gọi AI. Hãy thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextMessage = async (textMessage: string) => {
    markUserInteraction();
    const newUserMessage: ConversationMessage = {
      role: 'user',
      content: textMessage,
      timestamp: new Date(),
      id: `msg-${Date.now()}-${Math.random()}`,
    };
    setConversation((prev) => [...prev, newUserMessage]);
    await getAIResponse(textMessage);
  };

  const handleManualAudioPlay = async (messageId: string, audioBase64: string, mimeType: string) => {
    try {
      markUserInteraction();
      setPlayingAudioId(messageId);
      await manualPlayAudio(audioBase64, mimeType);
    } catch (error) {
      console.error('[AISalesSimulator] Manual audio play failed:', error);
      setErrorMessage('Audio playback failed');
    } finally {
      setPlayingAudioId(null);
    }
  };

  const handleRestart = async () => {
    if (sessionId) {
      await supabase.from('simulator_sessions').update({ status: 'abandoned' }).eq('id', sessionId);
    }
    setSessionId(null);
    setSalesScore(50);
    setTurnScores([]);
    setCurrentStage('early');
    setSaleOutcome(null);
    setIsConversationComplete(false);
    setFeedback('Hãy bắt đầu tư vấn để hệ thống AI phân tích và đánh giá kỹ năng của bạn.');
    
    // Create new session
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: newSession } = await supabase.from('simulator_sessions').insert({
        user_id: user.id,
        course_id: courseId,
        lesson_id: lessonId,
        status: 'in_progress',
              started_at: new Date().toISOString(),
              max_duration_seconds: maxDurationSeconds,
        current_stage: 'early',
        current_score: 50,
        session_avg: 50,
        turns_count: 0
      }).select().single();
      
      if (newSession) {
        setSessionId(newSession.id);
        initializeNewSession(newSession.id);
      }
    }
  };

  const finalSessionScore =
    turnScores.length > 0
      ? Math.round(turnScores.reduce((sum, score) => sum + score, 0) / turnScores.length)
      : 50;

  if (isInitializingHistory) {
    return (
      <div className="flex items-center justify-center min-h-[600px] w-full text-gray-500">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p>Đang tải lịch sử hội thoại...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="contents">
      {/* 2 columns returned to the parent grid: Chat (left) + Info panel (middle) */}

        {/* ═══════════ LEFT COLUMN — Chat & Bottom Panels ═══════════ */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden" style={{ height: '75vh', minHeight: '600px' }}>

          {/* Chat Header */}
          <div className="shrink-0 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-4 flex flex-wrap justify-between items-center gap-3">
            <div className="flex items-center gap-3">
              {onBack && (
                <button 
                  onClick={onBack}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                  title="Quay lại danh sách bài học"
                >
                  <span className="text-lg leading-none mb-0.5">←</span>
                </button>
              )}
              
              <div>
                <h2 className="font-bold text-lg">{productName}</h2>
                <div className="flex gap-4 text-sm text-orange-100 mt-0.5">
                  <p>Stage: <span className="capitalize font-medium">{currentStage}</span></p>
                  <p>Lượt: <span className="font-medium">{Math.floor((conversation.length + 1) / 2)}</span> {simulatorConfig?.sessionSettings?.maxTurns ? `/ ${simulatorConfig.sessionSettings.maxTurns}` : ''}</p>
                  <p>Thời gian: <span className="font-medium">{formatTime(elapsedSeconds)} / {formatTime(maxDurationSeconds)}</span></p>
                  {isConversationComplete && <span className="ml-2 text-white">✓ Completed</span>}
                </div>
              </div>

            </div>
                          <button
                onClick={handleRestart}
                className="bg-black/20 hover:bg-black/30 px-3 py-2 rounded-xl backdrop-blur-sm border border-white/10 text-white text-sm font-medium transition-colors"
              >
                Bắt đầu lại
              </button>
            {/* Persona Selector */}
            <div className="flex items-center gap-2 bg-black/20 px-3 py-2 rounded-xl backdrop-blur-sm border border-white/10">
              <UserCircle className="w-4 h-4 text-white/90" />
              <select
                value={persona}
                onChange={(e) => setPersona(e.target.value as any)}
                disabled={conversation.length > 1}
                className="bg-transparent text-white text-sm font-medium border-none focus:ring-0 cursor-pointer disabled:opacity-50 appearance-none pr-2"
              >
                <option value="random" className="text-gray-900">{simulationMode === 'knowledge_check' ? 'AI Huấn luyện viên' : 'Random Customer'}</option>
                <option value="warm_lead" className="text-gray-900">{simulationMode === 'knowledge_check' ? 'Chuyên gia' : 'Warm Lead'}</option>
                <option value="skeptical" className="text-gray-900">{simulationMode === 'knowledge_check' ? 'Giám khảo khó tính' : 'Skeptical Buyer'}</option>
              </select>
            </div>
          </div>

          {/* Outcome Banner */}
          {isConversationComplete && saleOutcome && (
            <div className={`shrink-0 px-6 py-3 border-b border-gray-200 dark:border-slate-700 flex items-center gap-3 ${
              saleOutcome === 'buy' ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300' :
              saleOutcome === 'need_more_info' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300' :
              'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'
            }`}>
              {saleOutcome === 'buy' && <CheckCircle className="w-5 h-5 text-green-600" />}
              {saleOutcome === 'need_more_info' && <AlertCircle className="w-5 h-5 text-blue-600" />}
              <div>
                <p className="font-bold text-sm">Kết thúc hội thoại</p>
                <p className="text-xs opacity-80">
                  {saleOutcome === 'buy' && 'Khách hàng muốn mua! Chúc mừng bạn.'}
                  {saleOutcome === 'need_more_info' && 'Khách hàng cần thêm thông tin trước khi quyết định.'}
                  {saleOutcome === 'reject' && 'Khách hàng chưa sẵn sàng lúc này.'}
                </p>
              </div>
            </div>
          )}

          {/* ─── MESSAGES LIST (TOP AREA) ─── */}
          <div
            className="flex-1 overflow-y-auto px-6 py-6 space-y-6 bg-slate-50/60 dark:bg-slate-900/40 relative"
            style={{ minHeight: 0 }}
          >
            {/* Instruction watermark if empty */}
            {conversation.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40 flex-col gap-3">
                <Mic className="w-12 h-12 text-gray-400" />
                <p className="text-gray-500 font-medium">Lịch sử hội thoại sẽ hiển thị tại đây</p>
              </div>
            )}

            {conversation.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-5 py-3.5 shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-orange-500 text-white rounded-br-sm'
                      : 'bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 text-gray-800 dark:text-gray-200 rounded-bl-sm'
                  }`}
                >
                  <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                  <span className={`text-xs mt-2 block font-medium ${msg.role === 'user' ? 'text-orange-100' : 'text-gray-400 dark:text-gray-500'}`}>
                    {msg.role === 'user' ? 'Bạn' : 'AI Khách hàng'} • {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Audio replay button */}
                {msg.role === 'ai' && msg.id && (
                  msg.audioBase64 ? (
                    <button
                      onClick={() => handleManualAudioPlay(msg.id!, msg.audioBase64!, msg.mimeType || 'audio/mpeg')}
                      disabled={playingAudioId === msg.id}
                      className="flex items-center justify-center w-9 h-9 rounded-full bg-orange-100 dark:bg-orange-900/40 hover:bg-orange-200 dark:hover:bg-orange-900/60 disabled:opacity-50 transition-colors self-end mb-1 shrink-0 shadow-sm"
                    >
                      <Volume2 className={`w-4 h-4 text-orange-600 dark:text-orange-400 ${playingAudioId === msg.id ? 'animate-pulse' : ''}`} />
                    </button>
                  ) : (
                    <div
                      className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 dark:bg-slate-800 self-end mb-1 shrink-0 opacity-50 cursor-not-allowed"
                      title="Audio không khả dụng"
                    >
                      <VolumeX className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    </div>
                  )
                )}
              </div>
            ))}

            <div ref={conversationEndRef} className="h-4" />
          </div>

          {/* ─── CONTROLS SECTION (BOTTOM AREA) ─── */}
          <div className="shrink-0 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm z-10 flex flex-col">
            {/* Error message */}
            {errorMessage && (
              <div className="px-5 py-3 bg-red-50 dark:bg-red-900/10 border-b border-red-200 dark:border-red-900/30 flex items-start gap-2 text-sm text-red-700 dark:text-red-400">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <p>{errorMessage}</p>
              </div>
            )}

            {/* Conversation Complete */}
            {isConversationComplete && (
              <div className="px-5 py-4 bg-green-50 dark:bg-green-900/10 text-center border-b border-green-200 dark:border-green-800/30">
                <p className="text-sm font-bold text-green-800 dark:text-green-400">Kết thúc mô phỏng</p>
                <p className="text-xs text-green-700 dark:text-green-500 mt-0.5">Phiên training đã hoàn tất. Chúc bạn luyện tập hiệu quả!</p>
              </div>
            )}

            {/* Main Controls Wrapper */}
            {!isConversationComplete && (
              <div className="px-5 py-4 flex flex-col md:flex-row gap-4 items-center bg-gray-50/50 dark:bg-slate-900/20">
                
                {/* Mode Toggle - Compact */}
                <div className="shrink-0 self-start md:self-center">
                  <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-1 flex shadow-sm">
                    <button
                      onClick={() => setMode('voice')}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                        mode === 'voice' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400' : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-slate-700'
                      }`}
                    >
                      <Mic className="w-4 h-4" /> Voice
                    </button>
                    <button
                      onClick={() => setMode('text')}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                        mode === 'text' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-slate-700'
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 6.1H3"/><path d="M21 12.1H3"/><path d="M15.1 18H3"/></svg>
                      Text
                    </button>
                  </div>
                </div>

                {/* Input Area */}
                <div className="flex-1 w-full">
                  {mode === 'voice' ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-3 items-center">
                        <Button
                          onClick={isRecording ? stopRecording : startRecording}
                          disabled={isLoading || isSpeaking}
                          className={`flex-1 h-12 text-base font-semibold rounded-xl shadow-sm transition-all ${
                            isRecording
                              ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/20 shadow-lg'
                              : 'bg-orange-500 hover:bg-orange-600 text-white hover:shadow-orange-500/20 hover:shadow-lg'
                          }`}
                        >
                          {isRecording ? (
                            <><MicOff className="w-5 h-5 mr-2 animate-pulse" /> Dừng ghi âm</>
                          ) : (
                            <><Mic className="w-5 h-5 mr-2" /> Bắt đầu nói</>
                          )}
                        </Button>
                        {isSpeaking && (
                          <div className="flex items-center gap-2 px-4 py-2 h-12 bg-orange-50 dark:bg-orange-900/20 rounded-xl text-sm border border-orange-100 dark:border-orange-900/40 shrink-0">
                            <Volume2 className="w-4 h-4 animate-pulse text-orange-600" />
                            <span className="text-orange-700 dark:text-orange-400 font-medium hidden sm:inline">AI đang nói...</span>
                          </div>
                        )}
                        {isLoading && !isSpeaking && (
                          <div className="flex items-center justify-center px-4 h-12 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shrink-0">
                            <div className="flex gap-1">
                              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                          </div>
                        )}
                      </div>
                      {/* Transcription Preview */}
                      {transcription && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2.5 rounded-xl text-sm text-blue-800 dark:text-blue-300 border border-blue-100 dark:border-blue-900/40 flex gap-2 items-start mt-2">
                          <span className="font-semibold shrink-0 mt-0.5">Đang xử lý:</span> 
                          <span className="italic">{transcription}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full">
                      <TextChatInput
                        onSendMessage={handleTextMessage}
                        isLoading={isLoading}
                        placeholder="Nhập câu tư vấn của bạn..."
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>


        </div>

        {/* ── Bottom Info Panels (Moved from Right Column) ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* Product Details / Test Info */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-sm xl:col-span-1">
            <h3 className="font-bold text-gray-900 dark:text-white mb-3 text-sm uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-orange-500" /> {simulationMode === 'knowledge_check' ? 'Thông tin bài kiểm tra' : 'Thông tin dự án'}
            </h3>
            <div className="space-y-3 text-sm">
              <div className="bg-gray-50 dark:bg-slate-900/50 p-3 rounded-xl">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Dự án</p>
                <p className="text-gray-900 dark:text-gray-200 font-medium">{productName}</p>
              </div>
              {productPrice && (
                <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-xl border border-orange-100 dark:border-orange-500/20">
                  <p className="text-xs font-semibold text-orange-700 dark:text-orange-400 uppercase tracking-wider mb-1">Giá</p>
                  <p className="text-orange-600 dark:text-orange-400 font-bold">{productPrice}</p>
                </div>
              )}
              <div className="bg-gray-50 dark:bg-slate-900/50 p-3 rounded-xl">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Mô tả</p>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{productDescription}</p>
              </div>
            </div>
          </div>

          {/* Key Features / Knowledge Content */}
          {keyFeatures.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-sm xl:col-span-1">
              <h3 className="font-bold text-gray-900 dark:text-white mb-3 text-sm uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" /> {simulationMode === 'knowledge_check' ? 'Nội dung kiểm tra' : 'Key Features'}
              </h3>
              <ul className="space-y-2">
                {keyFeatures.map((feature, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <span className="text-orange-500 shrink-0 mt-0.5">•</span>
                    <span className="leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Sales Tips / Answer Hints */}
          {salesTips.length > 0 && (
            <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl border border-orange-200 dark:border-orange-500/20 p-5 shadow-sm xl:col-span-1">
              <h3 className="font-bold text-orange-900 dark:text-orange-400 mb-3 text-sm uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> {simulationMode === 'knowledge_check' ? 'Gợi ý trả lời' : 'Gợi ý cho Sales'}
              </h3>
              <ul className="space-y-2">
                {salesTips.map((tip, i) => (
                  <li key={i} className="flex gap-2 text-sm text-orange-800 dark:text-orange-200">
                    <ArrowRight className="w-3.5 h-3.5 shrink-0 mt-0.5 text-orange-500" />
                    <span className="leading-relaxed">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

        {/* ═══════════ RIGHT COLUMN — Info Panel ═══════════ */}
        <div className="space-y-5">

          {/* Customer Avatar */}
          <CustomerAvatarCard 
            isSpeaking={isSpeaking}
            stage={currentStage}
            customerName="AI Khách hàng"
          />

          {/* Sales Performance */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-sm">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-sm uppercase tracking-wider">Sales Performance</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-500/20 p-3 text-center">
                <p className="text-xs font-semibold text-orange-700 dark:text-orange-400 mb-1">Current Turn</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{Math.round(salesScore)}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-500/20 p-3 text-center">
                <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">Session Avg</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{Math.round(finalSessionScore)}</p>
              </div>
            </div>
            {/* Score Bar */}
            <div className="mt-3">
              <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, salesScore)}%` }} />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{turnScores.length} lượt</p>
            </div>
          </div>

          {/* Feedback */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-sm">
            <h3 className="font-bold text-gray-900 dark:text-white mb-3 text-sm uppercase tracking-wider flex items-center gap-2">
              {feedback && (feedback.includes('đúng') || feedback.includes('tốt') || feedback.includes('xuất sắc')) ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : feedback ? (
                <AlertCircle className="w-4 h-4 text-orange-500" />
              ) : (
                <MessageCircle className="w-4 h-4 text-gray-400" />
              )}
              {simulationMode === 'knowledge_check' ? 'Đánh giá kiến thức' : 'Feedback'}
            </h3>
            {feedback ? (
              <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed space-y-2">
                {feedback.split(/(?<=[.!?])\s+/).filter(Boolean).map((sentence: string, i: number) => (
                  <p key={i} className="leading-relaxed">{sentence.trim()}</p>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500 italic leading-relaxed">
                Hãy bắt đầu trả lời để nhận feedback chi tiết.
              </p>
            )}
          </div>



          {/* Stage Progress */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-sm">
            <h3 className="font-bold text-gray-900 dark:text-white mb-3 text-sm uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" /> Tiến trình
            </h3>
            <div className="space-y-2.5">
              {['early', 'mid', 'closing'].map((stage) => (
                <div key={stage} className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${currentStage === stage ? 'bg-orange-500 shadow-md shadow-orange-500/40' : 'bg-gray-200 dark:bg-slate-700'}`} />
                  <span className={`capitalize text-sm font-medium ${currentStage === stage ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>{stage}</span>
                </div>
              ))}
              <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${isConversationComplete ? 'bg-green-500 shadow-md shadow-green-500/40' : 'bg-gray-200 dark:bg-slate-700'}`} />
                <span className={`text-sm font-medium ${isConversationComplete ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>Complete</span>
              </div>
            </div>
          </div>

          {/* Scenario Description */}
          <div className="bg-gray-50 dark:bg-slate-900/50 rounded-2xl border border-gray-200 dark:border-slate-700 p-5">
            <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-2 text-xs uppercase tracking-wider">Bối cảnh</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{scenarioDescription}</p>
          </div>
      </div>
    </div>
  );
}