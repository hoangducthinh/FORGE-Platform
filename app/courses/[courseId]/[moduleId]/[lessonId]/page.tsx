import { ProtectedRoute } from '@/components/ProtectedRoute';
import { mockLessons, mockCourses, mockModules } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import LessonContent from '@/components/lesson/LessonContent';

export default async function LessonPage({
  params,
}: {
  params: Promise<{ courseId: string; moduleId: string; lessonId: string }>;
}) {
  const { courseId, moduleId, lessonId } = await params;
  const lesson = Object.values(mockLessons)
    .flat()
    .find((l) => l.id === lessonId);
  const course = mockCourses.find((c) => c.id === courseId);
  const modules = mockModules[courseId] || [];
  const module = modules.find((m) => m.id === moduleId);
  const lessons = mockLessons[moduleId] || [];

  if (!lesson || !course || !module) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Lesson Not Found</h1>
            <p className="text-gray-600 mb-4">
              courseId: {courseId}, moduleId: {moduleId}, lessonId: {lessonId}
            </p>
            <Link href="/courses">
              <Button>Back to Courses</Button>
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <LessonContent
        lesson={lesson}
        course={course}
        module={module}
        lessons={lessons}
      />
    </ProtectedRoute>
  );
}
