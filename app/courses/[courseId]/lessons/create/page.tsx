'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Bot, BookOpen, Megaphone, ChevronDown, ChevronUp, Sparkles, Loader2, Eye, EyeOff, ArrowLeft,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────

type LessonTypeOption = 'content' | 'ai_knowledge_check' | 'ai_sales_simulation';

interface SimulatorConfig {
  mode: string;
  projectName: string;
  salesPitch: string;
  productType: string;
  location?: string;
  priceInfo?: string;
  description: string;
  customerPersona: string;
  openingCustomerMessage: string;
  goal: string;
  questionTopics?: string[];
  commonQuestions?: string[];
  keyFeatures: string[];
  commonObjections?: string[];
  salesTips: string[];
  scoringCriteria: { good: string; average: string; bad: string };
  feedbackRules: { positive: string; needMoreDetail: string; correctMistake?: string; moveToClosing?: string };
  stageRules: { early: string; mid: string; closing: string; complete: string };
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function textareaToArray(text: string): string[] {
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

function arrayToTextarea(arr: string[] | undefined): string {
  return (arr || []).join('\n');
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function CreateLessonPage() {
  const { user, profile, isPremium, role } = useAuth();
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;
  const supabase = createClient();

  // Permission & ownership state
  const [courseOwnerId, setCourseOwnerId] = useState<string | null>(null);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  // Form state
  const [lessonType, setLessonType] = useState<LessonTypeOption>('content');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [orderIndex, setOrderIndex] = useState(1);
  const [isPublished, setIsPublished] = useState(true);

  // AI config form state (knowledge_check)
  const [kcTopic, setKcTopic] = useState('');
  const [kcAiRole, setKcAiRole] = useState('AI Huấn luyện viên');
  const [kcOpeningMessage, setKcOpeningMessage] = useState('');
  const [kcGoal, setKcGoal] = useState('');
  const [kcQuestionTopics, setKcQuestionTopics] = useState('');
  const [kcCommonQuestions, setKcCommonQuestions] = useState('');
  const [kcKeyFeatures, setKcKeyFeatures] = useState('');
  const [kcSalesTips, setKcSalesTips] = useState('');
  const [kcScoringGood, setKcScoringGood] = useState('Trả lời chính xác, có ví dụ thực tế');
  const [kcScoringAvg, setKcScoringAvg] = useState('Trả lời đúng nhưng chưa đủ chi tiết');
  const [kcScoringBad, setKcScoringBad] = useState('Trả lời sai hoặc không rõ ràng');

  // AI config form state (sales_simulation)
  const [ssProjectName, setSsProjectName] = useState('');
  const [ssProductType, setSsProductType] = useState('');
  const [ssLocation, setSsLocation] = useState('');
  const [ssPriceInfo, setSsPriceInfo] = useState('');
  const [ssDescription, setSsDescription] = useState('');
  const [ssCustomerPersona, setSsCustomerPersona] = useState('');
  const [ssOpeningMessage, setSsOpeningMessage] = useState('');
  const [ssGoal, setSsGoal] = useState('');
  const [ssKeyFeatures, setSsKeyFeatures] = useState('');
  const [ssCommonObjections, setSsCommonObjections] = useState('');
  const [ssSalesTips, setSsSalesTips] = useState('');
  const [ssScoringGood, setSsScoringGood] = useState('Trả lời thuyết phục, xử lý phản đối tốt');
  const [ssScoringAvg, setSsScoringAvg] = useState('Trả lời đúng nhưng chưa thuyết phục');
  const [ssScoringBad, setSsScoringBad] = useState('Không xử lý được phản đối, mất khách');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showConfigPreview, setShowConfigPreview] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [aiGenTopic, setAiGenTopic] = useState('');
  const [aiGenGoal, setAiGenGoal] = useState('');
  const [aiGenAudience, setAiGenAudience] = useState('');
  const [aiGenDesc, setAiGenDesc] = useState('');

  // ─── Check access ──────────────────────────────────────────────────────

  useEffect(() => {
    async function checkAccess() {
      if (!user || !courseId) return;
      try {
        const { data: course } = await (supabase as any)
          .from('courses')
          .select('created_by')
          .eq('id', courseId)
          .single();

        if (course) {
          setCourseOwnerId(course.created_by);
        }

        // Also get next order_index
        const { data: lessons } = await (supabase as any)
          .from('lessons')
          .select('order_index')
          .eq('course_id', courseId)
          .order('order_index', { ascending: false })
          .limit(1);

        if (lessons && lessons.length > 0) {
          setOrderIndex((lessons[0] as any).order_index + 1);
        }
      } catch (err) {
        console.error('Error checking access:', err);
      } finally {
        setIsCheckingAccess(false);
      }
    }
    checkAccess();
  }, [user, courseId, supabase]);

  // ─── Permission check ──────────────────────────────────────────────────

  const canCreate =
    role === 'admin' ||
    role === 'manager' ||
    (isPremium && courseOwnerId === user?.id);

  // ─── Build simulator_config ────────────────────────────────────────────

  function buildSimulatorConfig(): SimulatorConfig | null {
    if (lessonType === 'content') return null;

    if (lessonType === 'ai_knowledge_check') {
      return {
        mode: 'knowledge_check',
        projectName: kcTopic || title,
        salesPitch: 'AI kiểm tra kiến thức',
        productType: 'Đào tạo kiến thức',
        description: content || `Bài kiểm tra kiến thức về ${kcTopic}`,
        customerPersona: kcAiRole,
        openingCustomerMessage: kcOpeningMessage,
        goal: kcGoal,
        questionTopics: textareaToArray(kcQuestionTopics),
        commonQuestions: textareaToArray(kcCommonQuestions),
        keyFeatures: textareaToArray(kcKeyFeatures),
        salesTips: textareaToArray(kcSalesTips),
        scoringCriteria: { good: kcScoringGood, average: kcScoringAvg, bad: kcScoringBad },
        feedbackRules: {
          positive: 'Khen ngợi và hỏi câu sâu hơn',
          needMoreDetail: 'Yêu cầu giải thích thêm',
          correctMistake: 'Chỉ ra sai sót và giải thích đúng',
        },
        stageRules: {
          early: 'Câu hỏi cơ bản',
          mid: 'Câu hỏi chuyên sâu',
          closing: 'Tình huống ứng dụng',
          complete: 'Tổng kết',
        },
      };
    }

    // ai_sales_simulation
    return {
      mode: 'sales_simulation',
      projectName: ssProjectName || title,
      salesPitch: ssDescription ? ssDescription.substring(0, 100) : title,
      productType: ssProductType,
      location: ssLocation,
      priceInfo: ssPriceInfo,
      description: ssDescription || content || '',
      customerPersona: ssCustomerPersona,
      openingCustomerMessage: ssOpeningMessage,
      goal: ssGoal,
      keyFeatures: textareaToArray(ssKeyFeatures),
      commonObjections: textareaToArray(ssCommonObjections),
      salesTips: textareaToArray(ssSalesTips),
      scoringCriteria: { good: ssScoringGood, average: ssScoringAvg, bad: ssScoringBad },
      feedbackRules: {
        positive: 'Khen ngợi kỹ năng xử lý',
        needMoreDetail: 'Cần cung cấp thêm thông tin cụ thể',
        moveToClosing: 'Nên chuyển sang bước chốt',
      },
      stageRules: {
        early: 'Khách hỏi thông tin tổng quan',
        mid: 'Khách hỏi sâu về giá, pháp lý, đầu tư',
        closing: 'Khách hỏi bước tiếp theo',
        complete: 'Kết thúc',
      },
    };
  }

  // ─── Generate with AI ──────────────────────────────────────────────────

  async function handleGenerateAI() {
    if (!aiGenTopic.trim()) {
      setErrorMsg('Nhập chủ đề để AI tạo cấu hình.');
      return;
    }
    setIsGenerating(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/lessons/generate-ai-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonType: lessonType === 'ai_knowledge_check' ? 'knowledge_check' : 'sales_simulation',
          topic: aiGenTopic,
          goal: aiGenGoal,
          audience: aiGenAudience,
          description: aiGenDesc,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'AI generation failed');
      }

      const data = await res.json();
      const config = data.simulator_config;

      // Fill title & content
      if (data.title) setTitle(data.title);
      if (data.content) setContent(data.content);

      if (lessonType === 'ai_knowledge_check' && config) {
        setKcTopic(config.projectName || '');
        setKcOpeningMessage(config.openingCustomerMessage || '');
        setKcGoal(config.goal || '');
        setKcQuestionTopics(arrayToTextarea(config.questionTopics));
        setKcCommonQuestions(arrayToTextarea(config.commonQuestions));
        setKcKeyFeatures(arrayToTextarea(config.keyFeatures));
        setKcSalesTips(arrayToTextarea(config.salesTips));
        if (config.scoringCriteria) {
          setKcScoringGood(config.scoringCriteria.good || '');
          setKcScoringAvg(config.scoringCriteria.average || '');
          setKcScoringBad(config.scoringCriteria.bad || '');
        }
      } else if (lessonType === 'ai_sales_simulation' && config) {
        setSsProjectName(config.projectName || '');
        setSsProductType(config.productType || '');
        setSsLocation(config.location || '');
        setSsPriceInfo(config.priceInfo || '');
        setSsDescription(config.description || '');
        setSsCustomerPersona(config.customerPersona || '');
        setSsOpeningMessage(config.openingCustomerMessage || '');
        setSsGoal(config.goal || '');
        setSsKeyFeatures(arrayToTextarea(config.keyFeatures));
        setSsCommonObjections(arrayToTextarea(config.commonObjections));
        setSsSalesTips(arrayToTextarea(config.salesTips));
        if (config.scoringCriteria) {
          setSsScoringGood(config.scoringCriteria.good || '');
          setSsScoringAvg(config.scoringCriteria.average || '');
          setSsScoringBad(config.scoringCriteria.bad || '');
        }
      }
    } catch (err: any) {
      console.error('AI generation error:', err);
      setErrorMsg(err.message || 'Lỗi khi tạo cấu hình AI');
    } finally {
      setIsGenerating(false);
    }
  }

  // ─── Submit ────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !canCreate) return;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const simulatorConfig = buildSimulatorConfig();
      const lessonTypeValue = lessonType === 'content' ? 'content' : 'ai_simulator';

      const { error } = await (supabase as any).from('lessons').insert({
        course_id: courseId,
        title,
        content: content || null,
        video_url: videoUrl || null,
        order_index: orderIndex,
        is_published: isPublished,
        lesson_type: lessonTypeValue,
        simulator_config: simulatorConfig ? JSON.stringify(simulatorConfig) : null,
      });

      if (error) throw error;

      router.push(`/courses/${courseId}`);
    } catch (err: any) {
      console.error('Submit error:', err);
      setErrorMsg(err.message || 'Lỗi khi tạo bài học');
    } finally {
      setIsSubmitting(false);
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────

  if (isCheckingAccess) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </ProtectedRoute>
    );
  }

  if (user && !canCreate) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
          <Navbar />
          <div className="max-w-3xl mx-auto px-4 py-16 text-center">
            <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Bot className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Cần nâng cấp Premium
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Bạn cần nâng cấp Premium để tạo bài học trong khóa học của mình.
            </p>
            <Button onClick={() => router.push('/upgrade')}>Nâng cấp Premium</Button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const simulatorConfigPreview = buildSimulatorConfig();

  return (
    <ProtectedRoute requiredRoles={['student', 'manager', 'admin']}>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push(`/courses/${courseId}`)}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 text-sm font-medium mb-4 inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> Quay lại khóa học
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tạo Bài Học Mới</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Thêm bài học vào khóa học của bạn</p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Error message */}
            {errorMsg && (
              <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-400">
                {errorMsg}
              </div>
            )}

            {/* ─── Lesson Type Selector ─── */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 shadow-sm mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Loại bài học</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { value: 'content' as LessonTypeOption, label: 'Nội dung', desc: 'Bài học text/video thường', icon: BookOpen, color: 'blue' },
                  { value: 'ai_knowledge_check' as LessonTypeOption, label: 'AI Kiểm tra kiến thức', desc: 'AI đặt câu hỏi kiểm tra', icon: Bot, color: 'purple' },
                  { value: 'ai_sales_simulation' as LessonTypeOption, label: 'AI Mô phỏng Sales', desc: 'AI đóng vai khách hàng', icon: Megaphone, color: 'orange' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setLessonType(opt.value)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      lessonType === opt.value
                        ? `border-${opt.color}-500 bg-${opt.color}-50 dark:bg-${opt.color}-900/20 ring-1 ring-${opt.color}-500`
                        : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <opt.icon className={`w-6 h-6 mb-2 ${lessonType === opt.value ? `text-${opt.color}-600` : 'text-gray-400'}`} />
                    <p className={`font-semibold text-sm ${lessonType === opt.value ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                      {opt.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* ─── Basic Info ─── */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 shadow-sm mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Thông tin cơ bản</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tiêu đề bài học *
                  </label>
                  <Input
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="VD: Kiến thức cơ bản về BĐS"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nội dung / Mô tả
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-transparent px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                    placeholder="Mô tả nội dung bài học..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Thứ tự
                    </label>
                    <Input
                      type="number"
                      min={1}
                      value={orderIndex}
                      onChange={(e) => setOrderIndex(parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isPublished}
                        onChange={(e) => setIsPublished(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Xuất bản ngay
                      </span>
                    </label>
                  </div>
                </div>
                {lessonType === 'content' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Video URL (tùy chọn)
                    </label>
                    <Input
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://youtube.com/embed/..."
                    />
                  </div>
                )}
              </div>
            </div>

            {/* ─── AI Generate Section ─── */}
            {lessonType !== 'content' && (
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl border border-purple-200 dark:border-purple-500/30 p-6 shadow-sm mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <h2 className="text-lg font-bold text-purple-900 dark:text-purple-300">Tạo tự động bằng AI</h2>
                </div>
                <p className="text-sm text-purple-700 dark:text-purple-400 mb-4">
                  Nhập mô tả ngắn, AI sẽ tự tạo toàn bộ cấu hình bài học cho bạn.
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-purple-800 dark:text-purple-300 mb-1">Chủ đề *</label>
                    <Input value={aiGenTopic} onChange={(e) => setAiGenTopic(e.target.value)} placeholder="VD: Luật kinh doanh BĐS" className="bg-white dark:bg-slate-800" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-purple-800 dark:text-purple-300 mb-1">Mục tiêu</label>
                      <Input value={aiGenGoal} onChange={(e) => setAiGenGoal(e.target.value)} placeholder="VD: Nắm vững pháp lý" className="bg-white dark:bg-slate-800" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-purple-800 dark:text-purple-300 mb-1">Đối tượng</label>
                      <Input value={aiGenAudience} onChange={(e) => setAiGenAudience(e.target.value)} placeholder="VD: Nhân viên sales mới" className="bg-white dark:bg-slate-800" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-purple-800 dark:text-purple-300 mb-1">Mô tả thêm</label>
                    <textarea
                      value={aiGenDesc}
                      onChange={(e) => setAiGenDesc(e.target.value)}
                      rows={2}
                      className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
                      placeholder="Bổ sung thêm chi tiết..."
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleGenerateAI}
                    disabled={isGenerating}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                  >
                    {isGenerating ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang tạo...</>
                    ) : (
                      <><Sparkles className="w-4 h-4 mr-2" /> Tạo cấu hình bằng AI</>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* ─── Knowledge Check Config ─── */}
            {lessonType === 'ai_knowledge_check' && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 shadow-sm mb-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Cấu hình AI Kiểm tra kiến thức
                </h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chủ đề bài kiểm tra *</label>
                      <Input value={kcTopic} onChange={(e) => setKcTopic(e.target.value)} placeholder="VD: Pháp lý BĐS" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vai trò AI</label>
                      <select
                        value={kcAiRole}
                        onChange={(e) => setKcAiRole(e.target.value)}
                        className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                      >
                        <option value="AI Huấn luyện viên">AI Huấn luyện viên</option>
                        <option value="AI Kiểm tra kiến thức">AI Kiểm tra kiến thức</option>
                        <option value="AI Giám khảo">AI Giám khảo</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tin nhắn mở đầu của AI</label>
                    <textarea
                      value={kcOpeningMessage}
                      onChange={(e) => setKcOpeningMessage(e.target.value)}
                      rows={2}
                      className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-transparent px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                      placeholder="VD: Chào bạn, tôi sẽ kiểm tra kiến thức của bạn về..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mục tiêu bài kiểm tra</label>
                    <Input value={kcGoal} onChange={(e) => setKcGoal(e.target.value)} placeholder="VD: Đánh giá kiến thức pháp lý cơ bản" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chủ đề câu hỏi <span className="text-xs text-gray-400">(mỗi dòng 1 chủ đề)</span></label>
                    <textarea value={kcQuestionTopics} onChange={(e) => setKcQuestionTopics(e.target.value)} rows={3}
                      className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-transparent px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                      placeholder="Sổ đỏ, sổ hồng&#10;Thuế chuyển nhượng&#10;Hợp đồng mua bán" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Câu hỏi mẫu <span className="text-xs text-gray-400">(mỗi dòng 1 câu)</span></label>
                    <textarea value={kcCommonQuestions} onChange={(e) => setKcCommonQuestions(e.target.value)} rows={3}
                      className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-transparent px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                      placeholder="Sổ đỏ và sổ hồng khác nhau thế nào?&#10;Thuế chuyển nhượng BĐS tính ra sao?" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kiến thức trọng tâm <span className="text-xs text-gray-400">(mỗi dòng 1 mục)</span></label>
                    <textarea value={kcKeyFeatures} onChange={(e) => setKcKeyFeatures(e.target.value)} rows={3}
                      className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-transparent px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                      placeholder="Phân biệt sổ đỏ/sổ hồng&#10;Quy trình sang tên" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gợi ý trả lời <span className="text-xs text-gray-400">(mỗi dòng 1 gợi ý)</span></label>
                    <textarea value={kcSalesTips} onChange={(e) => setKcSalesTips(e.target.value)} rows={3}
                      className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-transparent px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                      placeholder="Nêu rõ khái niệm + ví dụ thực tế&#10;Trích dẫn luật nếu biết" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tiêu chí chấm điểm</label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2"><span className="text-xs font-semibold text-green-600 w-12">Tốt:</span>
                        <Input value={kcScoringGood} onChange={(e) => setKcScoringGood(e.target.value)} className="flex-1" /></div>
                      <div className="flex items-center gap-2"><span className="text-xs font-semibold text-yellow-600 w-12">TB:</span>
                        <Input value={kcScoringAvg} onChange={(e) => setKcScoringAvg(e.target.value)} className="flex-1" /></div>
                      <div className="flex items-center gap-2"><span className="text-xs font-semibold text-red-600 w-12">Yếu:</span>
                        <Input value={kcScoringBad} onChange={(e) => setKcScoringBad(e.target.value)} className="flex-1" /></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── Sales Simulation Config ─── */}
            {lessonType === 'ai_sales_simulation' && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 shadow-sm mb-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Cấu hình AI Mô phỏng Sales
                </h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tên dự án/sản phẩm *</label>
                      <Input value={ssProjectName} onChange={(e) => setSsProjectName(e.target.value)} placeholder="VD: Vinhomes Ocean Park" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Loại sản phẩm</label>
                      <Input value={ssProductType} onChange={(e) => setSsProductType(e.target.value)} placeholder="VD: Căn hộ cao cấp" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vị trí</label>
                      <Input value={ssLocation} onChange={(e) => setSsLocation(e.target.value)} placeholder="VD: Gia Lâm, Hà Nội" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Giá / Chính sách</label>
                      <Input value={ssPriceInfo} onChange={(e) => setSsPriceInfo(e.target.value)} placeholder="VD: Từ 1.5 tỷ" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mô tả dự án</label>
                    <textarea value={ssDescription} onChange={(e) => setSsDescription(e.target.value)} rows={3}
                      className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-transparent px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                      placeholder="Mô tả chi tiết về dự án/sản phẩm..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chân dung khách hàng AI</label>
                    <textarea value={ssCustomerPersona} onChange={(e) => setSsCustomerPersona(e.target.value)} rows={2}
                      className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-transparent px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                      placeholder="VD: Khách hàng trung niên, có tài chính, đang tìm căn hộ để đầu tư..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tin nhắn mở đầu của khách hàng AI</label>
                    <textarea value={ssOpeningMessage} onChange={(e) => setSsOpeningMessage(e.target.value)} rows={2}
                      className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-transparent px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                      placeholder="VD: Chào bạn, tôi đang quan tâm dự án này..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mục tiêu sales</label>
                    <Input value={ssGoal} onChange={(e) => setSsGoal(e.target.value)} placeholder="VD: Chốt lịch hẹn xem nhà mẫu" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Key Features <span className="text-xs text-gray-400">(mỗi dòng 1 mục)</span></label>
                    <textarea value={ssKeyFeatures} onChange={(e) => setSsKeyFeatures(e.target.value)} rows={3}
                      className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-transparent px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                      placeholder="Vị trí đắc địa&#10;Tiện ích nội khu đa dạng&#10;Pháp lý hoàn chỉnh" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Common Objections <span className="text-xs text-gray-400">(mỗi dòng 1 phản đối)</span></label>
                    <textarea value={ssCommonObjections} onChange={(e) => setSsCommonObjections(e.target.value)} rows={3}
                      className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-transparent px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                      placeholder="Giá cao quá&#10;Vị trí xa trung tâm&#10;Tiến độ chậm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sales Tips <span className="text-xs text-gray-400">(mỗi dòng 1 gợi ý)</span></label>
                    <textarea value={ssSalesTips} onChange={(e) => setSsSalesTips(e.target.value)} rows={3}
                      className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-transparent px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                      placeholder="So sánh giá với khu vực lân cận&#10;Nhấn mạnh tiềm năng tăng giá" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tiêu chí chấm điểm</label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2"><span className="text-xs font-semibold text-green-600 w-12">Tốt:</span>
                        <Input value={ssScoringGood} onChange={(e) => setSsScoringGood(e.target.value)} className="flex-1" /></div>
                      <div className="flex items-center gap-2"><span className="text-xs font-semibold text-yellow-600 w-12">TB:</span>
                        <Input value={ssScoringAvg} onChange={(e) => setSsScoringAvg(e.target.value)} className="flex-1" /></div>
                      <div className="flex items-center gap-2"><span className="text-xs font-semibold text-red-600 w-12">Yếu:</span>
                        <Input value={ssScoringBad} onChange={(e) => setSsScoringBad(e.target.value)} className="flex-1" /></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── Config Preview ─── */}
            {lessonType !== 'content' && simulatorConfigPreview && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm mb-6 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowConfigPreview(!showConfigPreview)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-slate-700/50 transition"
                >
                  <div className="flex items-center gap-2">
                    {showConfigPreview ? <EyeOff className="w-4 h-4 text-gray-500" /> : <Eye className="w-4 h-4 text-gray-500" />}
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Preview simulator_config
                    </span>
                  </div>
                  {showConfigPreview ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>
                {showConfigPreview && (
                  <div className="px-6 pb-4">
                    <pre className="bg-gray-50 dark:bg-slate-900 rounded-xl p-4 text-xs text-gray-700 dark:text-gray-300 overflow-auto max-h-80">
                      {JSON.stringify(simulatorConfigPreview, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* ─── Submit ─── */}
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => router.push(`/courses/${courseId}`)}>
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang tạo...</>
                ) : (
                  'Tạo Bài Học'
                )}
              </Button>
            </div>
          </form>
        </main>
      </div>
    </ProtectedRoute>
  );
}
