import { ProtectedRoute } from '@/components/ProtectedRoute';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import CourseDetailContent from '@/components/course/CourseDetailContent';

export default async function CourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  
  const supabase = await createClient();

  // Fetch course
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single();

  if (courseError || !course) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Không tìm thấy khóa học</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Khóa học này không tồn tại hoặc đã bị xóa.</p>
            <Link href="/courses">
              <Button>Quay lại danh sách</Button>
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Fetch lessons for the course — only published, ordered by order_index
  const { data: lessons, error: lessonsError } = await supabase
    .from('lessons')
    .select('*')
    .eq('course_id', courseId)
    .eq('is_published', true)
    .order('order_index', { ascending: true });

  return (
    <ProtectedRoute>
      <CourseDetailContent 
        course={course} 
        lessons={lessons || []} 
        courseId={courseId}
        lessonsError={lessonsError ? lessonsError.message : null}
      />
    </ProtectedRoute>
  );
}
