'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Plus, BookOpen } from 'lucide-react';
import type { Course } from '@/lib/supabase/database.types';

export default function MyCoursesPage() {
  const { user, isPremium, role } = useAuth();
  const supabase = createClient();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadMyCourses() {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .eq('created_by', user.id);
        
        if (error) throw error;
        setCourses(data || []);
      } catch (err) {
        console.error('Error loading my courses:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadMyCourses();
  }, [user, supabase]);

  const canCreate = (role === 'student' && isPremium) || role === 'manager' || role === 'admin';

  if (user && !canCreate) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <p>Bạn cần nâng cấp Premium để tạo và quản lý khóa học.</p>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRoles={['student', 'manager', 'admin']}>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Khóa học của tôi</h1>
            <Button asChild>
              <Link href="/courses/create" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Tạo mới
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>
          ) : courses.length === 0 ? (
            <div className="text-center bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-12">
              <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Chưa có khóa học nào</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Bạn chưa tạo khóa học nào. Hãy bắt đầu ngay!</p>
              <Button asChild>
                <Link href="/courses/create">Tạo khóa học đầu tiên</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map(course => (
                <div key={course.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-md transition">
                  <div className="h-40 bg-gray-200 dark:bg-slate-700 relative">
                    {course.thumbnail_url ? (
                      <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400">Không có ảnh bìa</div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {course.category}
                      </span>
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${course.is_published ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                        {course.is_published ? 'Đã xuất bản' : 'Bản nháp'}
                      </span>
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1 line-clamp-2">{course.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{course.description}</p>
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/courses/${course.id}`}>Xem chi tiết</Link>
                      </Button>
                      <Button size="sm" asChild className="bg-orange-500 hover:bg-orange-600 text-white">
                        <Link href={`/courses/${course.id}/lessons/create`} className="flex items-center gap-1">
                          <Plus className="w-3.5 h-3.5" /> Thêm bài học
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
