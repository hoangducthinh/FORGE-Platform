'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2, ArrowLeft, Trash2, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';

// ─── Helpers ───────────────────────────────────────────────────────────────

function textareaToArray(text: string): string[] {
  return text.split('\n').map((s) => s.trim()).filter(Boolean);
}
function arrayToTextarea(arr: string[] | undefined): string {
  return (arr || []).join('\n');
}

export default function EditLessonPage() {
  const { user, isPremium, role } = useAuth();
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;
  const lessonId = params.lessonId as string;
  const supabase = createClient();

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showConfigPreview, setShowConfigPreview] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [courseOwnerId, setCourseOwnerId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [orderIndex, setOrderIndex] = useState(1);
  const [isPublished, setIsPublished] = useState(true);
  const [lessonType, setLessonType] = useState('content');
  const [simulatorConfig, setSimulatorConfig] = useState<any>(null);
  const [configJsonText, setConfigJsonText] = useState('');

  // ─── Load data ─────────────────────────────────────────────────────────

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        // Load course owner
        const { data: course } = await (supabase as any)
          .from('courses')
          .select('created_by')
          .eq('id', courseId)
          .single();
        if (course) setCourseOwnerId(course.created_by);

        // Load lesson
        const { data: lesson, error } = await (supabase as any)
          .from('lessons')
          .select('*')
          .eq('id', lessonId)
          .single();

        if (error || !lesson) {
          setErrorMsg('Không tìm thấy bài học');
          return;
        }

        setTitle(lesson.title || '');
        setContent(lesson.content || '');
        setVideoUrl(lesson.video_url || '');
        setOrderIndex(lesson.order_index || 1);
        setIsPublished(lesson.is_published ?? true);
        setLessonType(lesson.lesson_type || 'content');

        if (lesson.simulator_config) {
          let cfg = lesson.simulator_config;
          if (typeof cfg === 'string') {
            try { cfg = JSON.parse(cfg); } catch { cfg = null; }
          }
          setSimulatorConfig(cfg);
          setConfigJsonText(JSON.stringify(cfg, null, 2));
        }
      } catch (err) {
        console.error('Load error:', err);
        setErrorMsg('Lỗi tải dữ liệu bài học');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [user, courseId, lessonId, supabase]);

  // ─── Permission ────────────────────────────────────────────────────────

  const canEdit =
    role === 'admin' ||
    role === 'manager' ||
    (isPremium && courseOwnerId === user?.id);

  // ─── Save ──────────────────────────────────────────────────────────────

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!canEdit) return;
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      // Parse config JSON if it was edited
      let finalConfig = simulatorConfig;
      if (lessonType === 'ai_simulator' && configJsonText) {
        try {
          finalConfig = JSON.parse(configJsonText);
        } catch {
          setErrorMsg('simulator_config JSON không hợp lệ');
          setIsSubmitting(false);
          return;
        }
      }

      const { error } = await (supabase as any).from('lessons').update({
        title,
        content: content || null,
        video_url: videoUrl || null,
        order_index: orderIndex,
        is_published: isPublished,
        simulator_config: finalConfig ? JSON.stringify(finalConfig) : null,
      }).eq('id', lessonId);

      if (error) throw error;
      router.push(`/courses/${courseId}`);
    } catch (err: any) {
      console.error('Save error:', err);
      setErrorMsg(err.message || 'Lỗi lưu bài học');
    } finally {
      setIsSubmitting(false);
    }
  }

  // ─── Delete ────────────────────────────────────────────────────────────

  async function handleDelete() {
    if (!canEdit) return;
    setIsDeleting(true);
    setErrorMsg('');

    try {
      const { error } = await (supabase as any)
        .from('lessons')
        .delete()
        .eq('id', lessonId);

      if (error) throw error;
      router.push(`/courses/${courseId}`);
    } catch (err: any) {
      console.error('Delete error:', err);
      setErrorMsg(err.message || 'Lỗi xóa bài học');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </ProtectedRoute>
    );
  }

  if (user && !canEdit) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
          <Navbar />
          <div className="max-w-3xl mx-auto px-4 py-16 text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Không có quyền chỉnh sửa</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Bạn không có quyền chỉnh sửa bài học này.</p>
            <Button onClick={() => router.back()}>Quay lại</Button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

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
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Chỉnh sửa Bài Học</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  Loại: <span className="font-medium capitalize">{lessonType === 'ai_simulator' ? 'AI Simulator' : 'Nội dung'}</span>
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-600 border-red-300 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Xóa bài học
              </Button>
            </div>
          </div>

          {/* Error */}
          {errorMsg && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-400">
              {errorMsg}
            </div>
          )}

          {/* Delete Confirm */}
          {showDeleteConfirm && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
              <p className="text-sm font-bold text-red-800 dark:text-red-300 mb-2">Xác nhận xóa bài học?</p>
              <p className="text-sm text-red-700 dark:text-red-400 mb-4">
                Bài học &quot;{title}&quot; sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.
              </p>
              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {isDeleting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang xóa...</> : 'Xóa vĩnh viễn'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                  Hủy
                </Button>
              </div>
            </div>
          )}

          <form onSubmit={handleSave}>
            {/* Basic info */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 shadow-sm mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Thông tin cơ bản</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tiêu đề *</label>
                  <Input required value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nội dung / Mô tả</label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={4}
                    className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-transparent px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Thứ tự</label>
                    <Input type="number" min={1} value={orderIndex} onChange={(e) => setOrderIndex(parseInt(e.target.value) || 1)} />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isPublished}
                        onChange={(e) => setIsPublished(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Xuất bản</span>
                    </label>
                  </div>
                </div>
                {lessonType !== 'ai_simulator' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Video URL</label>
                    <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://..." />
                  </div>
                )}
              </div>
            </div>

            {/* Simulator Config Editor */}
            {lessonType === 'ai_simulator' && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm mb-6 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowConfigPreview(!showConfigPreview)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-slate-700/50 transition"
                >
                  <div className="flex items-center gap-2">
                    {showConfigPreview ? <EyeOff className="w-4 h-4 text-gray-500" /> : <Eye className="w-4 h-4 text-gray-500" />}
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Chỉnh sửa simulator_config (JSON)
                    </span>
                  </div>
                  {showConfigPreview ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>
                {showConfigPreview && (
                  <div className="px-6 pb-4">
                    <textarea
                      value={configJsonText}
                      onChange={(e) => setConfigJsonText(e.target.value)}
                      rows={20}
                      className="w-full bg-gray-50 dark:bg-slate-900 rounded-xl p-4 text-xs font-mono text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-400 mt-2">Chỉnh sửa trực tiếp JSON. Đảm bảo JSON hợp lệ trước khi lưu.</p>
                  </div>
                )}
              </div>
            )}

            {/* Submit */}
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => router.push(`/courses/${courseId}`)}>
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang lưu...</> : 'Lưu thay đổi'}
              </Button>
            </div>
          </form>
        </main>
      </div>
    </ProtectedRoute>
  );
}
