'use client';

import { Navbar } from '@/components/layout/Navbar';
import { AIChat } from '@/components/layout/AIChat';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import { ChevronDown, ChevronUp, BookOpen, CheckCircle2, Play, FileText, AlertCircle, Bot, Plus, Pencil } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Course, Lesson } from '@/lib/supabase/database.types';
import AISalesSimulator from '@/components/lesson/AISalesSimulator';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';

// Type for simulator_config stored in Supabase
interface SimulatorConfig {
  productName?: string;
  productDescription?: string;
  productPrice?: string;
  scenarioDescription?: string;
  scenario?: string;
  customerRole?: string;
  goal?: string;
  productType?: string;
  projectName?: string;
  location?: string;
  salesGoal?: string;
  salesPitch?: string;
  description?: string;
  priceInfo?: string;
  keyFeatures?: string[];
  commonObjections?: string[];
  openingCustomerMessage?: string;
  salesTips?: string[];
  mode?: 'sales' | 'knowledge_check';
}

// Default Hạ Long / Vingroup fallback config
const DEFAULT_SIMULATOR_CONFIG: SimulatorConfig = {
  projectName: 'Vinhomes Hạ Long Xanh / Vinhomes Global Gate Hạ Long',
  productName: 'Vinhomes Hạ Long Xanh',
  productDescription: 'Đại đô thị biển thuộc hệ sinh thái Vingroup/Vinhomes tại khu vực cửa ngõ kết nối Hạ Long – Quảng Yên – Hải Phòng, gần hệ sinh thái du lịch biển Hạ Long. Quy mô đại đô thị lớn, phù hợp mua ở, đầu tư giữ tài sản hoặc khai thác cho thuê.',
  productPrice: 'Cần kiểm tra bảng hàng và chính sách cập nhật',
  scenarioDescription: 'Khách hàng đang cân nhắc mua căn hộ/nhà ở trong đại đô thị biển tại Hạ Long thuộc hệ sinh thái Vingroup/Vinhomes. Mục tiêu: thuyết phục khách hiểu giá trị vị trí, tiềm năng khai thác du lịch – nghỉ dưỡng, sau đó chốt bước tiếp theo (gửi bảng hàng, tính dòng tiền, đặt lịch tư vấn).',
  keyFeatures: [
    'Thuộc hệ sinh thái Vingroup/Vinhomes',
    'Khu vực Hạ Long đang phát triển mạnh về du lịch, hạ tầng và đô thị biển',
    'Phù hợp khách mua ở, đầu tư giữ tài sản hoặc khai thác cho thuê',
    'Lợi thế thương hiệu chủ đầu tư và quy hoạch đại đô thị',
    'Cần kiểm tra bảng hàng, pháp lý và chính sách bán hàng cập nhật trước khi tư vấn con số cụ thể',
  ],
  openingCustomerMessage: 'Chào bạn, tôi đang quan tâm một dự án căn hộ/đô thị biển ở Hạ Long của Vingroup. Bạn có thể giới thiệu rõ hơn dự án này có gì đáng chú ý không?',
  salesTips: [
    'Nhấn vào vị trí Hạ Long – Quảng Yên – Hải Phòng',
    'Nhấn vào hệ sinh thái Vingroup/Vinhomes',
    'Nhấn vào tiềm năng du lịch, nghỉ dưỡng, đô thị biển',
    'Không cam kết lợi nhuận cứng',
    'Luôn kéo khách sang bước tiếp theo: gửi bảng hàng, tính dòng tiền, đặt lịch tư vấn',
  ],
};

interface CourseDetailContentProps {
  course: Course;
  lessons: Lesson[];
  courseId: string;
  lessonsError?: string | null;
}

export default function CourseDetailContent({
  course,
  lessons,
  courseId,
  lessonsError,
}: CourseDetailContentProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);

  const { user, isPremium, role } = useAuth();
  const supabase = createClient();
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);

  // Can this user manage lessons in this course?
  const canManage =
    role === 'admin' ||
    role === 'manager' ||
    (isPremium && (course as any).created_by === user?.id);

  useEffect(() => {
    async function loadProgress() {
      if (!user) return;
      try {
        const { data, error } = await (supabase as any)
          .from('user_course_progress')
          .select('lesson_id, is_completed')
          .eq('user_id', user.id)
          .eq('course_id', courseId);
          
        if (error) throw error;
        
        if (data) {
          const completed = data.filter((p: any) => p.is_completed).map((p: any) => p.lesson_id);
          setCompletedLessonIds(completed);
        }
      } catch (err) {
        console.error('Error loading progress:', err);
      }
    }
    loadProgress();
  }, [user, courseId, supabase]);

  const markLessonComplete = async (lessonId: string) => {
    if (!user || isUpdatingProgress || completedLessonIds.includes(lessonId)) return;
    setIsUpdatingProgress(true);
    try {
      const { error } = await (supabase as any)
        .from('user_course_progress')
        .upsert({
          user_id: user.id,
          course_id: courseId,
          lesson_id: lessonId,
          is_completed: true,
          progress_percentage: 100,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id, course_id, lesson_id' });

      if (error) throw error;
      setCompletedLessonIds(prev => [...prev, lessonId]);
    } catch (err) {
      console.error('Error marking lesson complete:', err);
      alert('Could not update progress. Please try again.');
    } finally {
      setIsUpdatingProgress(false);
    }
  };

  // Get the active lesson object
  const activeLesson = activeLessonId ? lessons.find(l => l.id === activeLessonId) : null;

  // Parse simulator_config safely
  const getSimulatorConfig = (lesson: Lesson): SimulatorConfig | null => {
    if (!lesson.simulator_config) return null;
    try {
      if (typeof lesson.simulator_config === 'string') {
        return JSON.parse(lesson.simulator_config) as SimulatorConfig;
      }
      return lesson.simulator_config as unknown as SimulatorConfig;
    } catch {
      return null;
    }
  };

  // Determine icon for lesson type
  const getLessonIcon = (lesson: Lesson) => {
    if (lesson.lesson_type === 'ai_simulator') {
      return <Bot className="w-4 h-4 text-orange-500" />;
    }
    if (lesson.video_url) {
      return <Play className="w-4 h-4 text-blue-500" />;
    }
    return <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
      <Navbar />

      <main className="max-w-[1800px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Course Header */}
        <div className="mb-8 max-w-6xl">
          <Link href="/courses" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium mb-4 inline-block transition-colors">
            ← Back to Courses
          </Link>
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <div className="h-48 bg-gray-100 dark:bg-slate-800 relative overflow-hidden flex items-center justify-center">
              {course.thumbnail_url ? (
                <img 
                  src={course.thumbnail_url} 
                  alt={course.title} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/40 dark:to-purple-900/40" />
              )}
            </div>
            <div className="p-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{course.title}</h1>
              <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl">{course.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 px-4 py-2 rounded-full font-medium">
                    {course.category}
                  </span>
                  {canManage && (
                    <Link
                      href={`/courses/${courseId}/lessons/create`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-full transition-colors shadow-sm"
                    >
                      <Plus className="w-4 h-4" /> Thêm bài học
                    </Link>
                  )}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Created on {new Date(course.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error State */}
        {lessonsError && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-300">Lỗi tải bài học</p>
              <p className="text-sm text-red-600 dark:text-red-400">{lessonsError}</p>
            </div>
          </div>
        )}

        <div className={`grid grid-cols-1 gap-6 xl:gap-8 ${
          activeLesson?.lesson_type === 'ai_simulator' 
            ? 'xl:grid-cols-[1.7fr_0.9fr_0.7fr]' 
            : 'lg:grid-cols-[1fr_320px]'
        }`}>
          {/* Main Content */}
          {activeLesson && activeLesson.lesson_type === 'ai_simulator' ? (
            // Render AI Sales Simulator directly in the grid (it returns 2 columns via display: contents)
            (() => {
              const config = getSimulatorConfig(activeLesson) || DEFAULT_SIMULATOR_CONFIG;
              return (
                <AISalesSimulator
                  productName={config.projectName || config.salesPitch || activeLesson.title || 'Dự án Bất động sản'}
                  productDescription={config.description || config.productDescription || activeLesson.content || 'Mô tả dự án'}
                  productPrice={config.priceInfo || config.productPrice || 'Liên hệ'}
                  scenarioDescription={config.scenarioDescription || 'Khách hàng đang tìm hiểu dự án. Hãy tư vấn và thuyết phục khách hàng.'}
                  keyFeatures={config.keyFeatures || DEFAULT_SIMULATOR_CONFIG.keyFeatures}
                  salesTips={config.salesTips || DEFAULT_SIMULATOR_CONFIG.salesTips}
                  openingMessage={config.openingCustomerMessage || DEFAULT_SIMULATOR_CONFIG.openingCustomerMessage}
                  simulationMode={config.mode as any}
                  courseId={courseId}
                  lessonId={activeLesson.id}
                  onBack={() => setActiveLessonId(null)}
                  onLessonComplete={() => markLessonComplete(activeLesson.id)}
                />
              );
            })()
          ) : (
            <div className={`${activeLesson?.lesson_type !== 'ai_simulator' ? '' : 'hidden'}`}>
              {/* Active Lesson Content Area */}
              {activeLesson ? (
                <div className="mb-8">
                  {/* Back to lesson list */}
                  <button 
                    onClick={() => setActiveLessonId(null)}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium mb-4 inline-block transition-colors"
                  >
                    ← Quay lại danh sách bài học
                  </button>

                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{activeLesson.title}</h2>

                  {/* Render normal content lesson */}
                  <div className="space-y-6">
                    {/* Video if available */}
                    {activeLesson.video_url && (
                      <div className="rounded-lg overflow-hidden bg-black aspect-video">
                        <iframe
                          src={activeLesson.video_url}
                          title={activeLesson.title}
                          className="w-full h-full"
                          allowFullScreen
                        />
                      </div>
                    )}

                    {/* Lesson text content */}
                    {activeLesson.content ? (
                      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-8 shadow-sm">
                        <div
                          className="prose prose-sm md:prose-base max-w-none text-gray-700 dark:text-gray-300 dark:prose-headings:text-white dark:prose-strong:text-white dark:prose-a:text-blue-400"
                          dangerouslySetInnerHTML={{ __html: activeLesson.content }}
                        />
                      </div>
                    ) : (
                      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-8 text-center">
                        <p className="text-gray-500 dark:text-gray-400">Nội dung bài học đang được cập nhật...</p>
                      </div>
                    )}
                  </div>

                {/* Completion & Navigation */}
                <div className="flex flex-col gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-slate-700">
                  <div className="flex justify-between items-center">
                    <div>
                      {completedLessonIds.includes(activeLesson.id) ? (
                        <div className="flex items-center text-green-600 dark:text-green-500 font-medium text-sm">
                          <CheckCircle2 className="w-5 h-5 mr-2" />
                          Đã hoàn thành
                        </div>
                      ) : (
                        <Button 
                          onClick={() => markLessonComplete(activeLesson.id)}
                          disabled={isUpdatingProgress}
                          variant="outline"
                          className="border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                        >
                          Đánh dấu đã hoàn thành
                        </Button>
                      )}
                    </div>
                  </div>
                  
                {/* Lesson Navigation */}
                <div className="flex gap-4 mt-6">
                  {(() => {
                    const currentIdx = lessons.findIndex(l => l.id === activeLesson.id);
                    const prevLesson = currentIdx > 0 ? lessons[currentIdx - 1] : null;
                    const nextLesson = currentIdx < lessons.length - 1 ? lessons[currentIdx + 1] : null;
                    return (
                      <>
                        {prevLesson && (
                          <Button 
                            variant="outline" 
                            className="flex-1 dark:border-slate-700 dark:text-gray-300"
                            onClick={() => setActiveLessonId(prevLesson.id)}
                          >
                            ← Bài trước
                          </Button>
                        )}
                        {nextLesson && (
                          <Button 
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => setActiveLessonId(nextLesson.id)}
                          >
                            Bài tiếp theo →
                          </Button>
                        )}
                      </>
                    );
                  })()}
                </div>
                </div>
              </div>
            ) : (
              /* Lesson List */
              <>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Course Content</h2>

                <div className="space-y-4">
                  <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm">
                    {/* Header */}
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/50 transition"
                    >
                      <div className="flex items-center gap-4 text-left">
                        <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">Nội dung khóa học</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{lessons.length} bài học</p>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                      )}
                    </button>

                    {/* Content */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
                        {lessons.length > 0 ? (
                          <div className="divide-y divide-gray-200 dark:divide-slate-700">
                            {lessons.map((lesson) => {
                              return (
                                <div
                                  key={lesson.id}
                                  className="w-full px-6 py-4 hover:bg-gray-100 dark:hover:bg-slate-700 transition flex items-center justify-between"
                                >
                                  <button
                                    onClick={() => setActiveLessonId(lesson.id)}
                                    className="flex items-center gap-3 flex-1 text-left"
                                  >
                                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs font-bold">
                                      {lesson.order_index}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {getLessonIcon(lesson)}
                                      <p className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                        {lesson.title}
                                      </p>
                                      {completedLessonIds.includes(lesson.id) && (
                                        <CheckCircle2 className="w-4 h-4 text-green-500 ml-2 flex-shrink-0" />
                                      )}
                                    </div>
                                    {lesson.lesson_type === 'ai_simulator' && (
                                      <span className="text-xs font-semibold bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded-full">
                                        AI Simulator
                                      </span>
                                    )}
                                  </button>
                                  <div className="flex items-center gap-2 shrink-0">
                                    {canManage && (
                                      <Link
                                        href={`/courses/${courseId}/lessons/${lesson.id}/edit`}
                                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                        title="Chỉnh sửa bài học"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <Pencil className="w-4 h-4" />
                                      </Link>
                                    )}
                                    <CheckCircle2 className="w-5 h-5 text-gray-300 dark:text-slate-600 flex-shrink-0" />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="px-6 py-8 text-center text-gray-600 dark:text-gray-400">
                            <BookOpen className="w-10 h-10 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
                            <p className="font-medium">Chưa có bài học nào</p>
                            <p className="text-sm mt-1">Các bài học sẽ được cập nhật sớm.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
            </div>
          )}

          {/* Sidebar */}
          <div>
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6 sticky top-24 shadow-sm">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Course Progress</h3>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Overall Progress</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">0%</span>
                </div>
                <Progress value={0} className="h-3 dark:bg-slate-700" />
              </div>

              <div className="space-y-3 mb-6 text-sm">
                <div className="flex justify-between text-gray-700 dark:text-gray-300">
                  <span>Total Lessons</span>
                  <span className="font-semibold">{lessons.length}</span>
                </div>
                <div className="flex justify-between text-gray-700 dark:text-gray-300">
                  <span>AI Simulators</span>
                  <span className="font-semibold">{lessons.filter(l => l.lesson_type === 'ai_simulator').length}</span>
                </div>
              </div>

              {/* Lesson Quick Nav */}
              {lessons.length > 0 && (
                <div className="pt-6 border-t border-gray-200 dark:border-slate-700">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">Lessons</h4>
                  <div className="space-y-2">
                    {lessons.map((lesson) => (
                      <button
                        key={lesson.id}
                        onClick={() => setActiveLessonId(lesson.id)}
                        className={`w-full flex items-center gap-2 text-sm text-left p-2 rounded-lg transition ${
                          activeLessonId === lesson.id
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        {getLessonIcon(lesson)}
                        <span className="truncate">{lesson.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!activeLesson && lessons.length > 0 && (
                <div className="pt-6 border-t border-gray-200 dark:border-slate-700 mt-6">
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => setActiveLessonId(lessons[0].id)}
                  >
                    Start Course
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <AIChat />
    </div>
  );
}
