'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { AIChat } from '@/components/layout/AIChat';
import { useAuth } from '@/lib/auth-context';
import { mockCourses, mockUserProgress } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Search, Filter } from 'lucide-react';
import { useState } from 'react';

export default function CoursesPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const enrolledCourseIds = mockUserProgress
    .filter((p) => p.userId === user?.id)
    .map((p) => p.courseId);

  const publishedCourses = mockCourses.filter((c) => c.status === 'published');

  const filteredCourses = publishedCourses.filter((course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(publishedCourses.map((c) => c.category)));

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Course Catalog</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Explore our comprehensive collection of training courses designed to enhance your skills.
            </p>
          </div>

          {/* Search and Filter */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6 mb-8 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search Courses
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <Input
                    id="search"
                    type="text"
                    placeholder="Search by title or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  id="category"
                  value={selectedCategory || ''}
                  onChange={(e) => setSelectedCategory(e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-slate-900 dark:text-white"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Courses Grid */}
          {filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => {
                const isEnrolled = enrolledCourseIds.includes(course.id);
                return (
                  <div
                    key={course.id}
                    className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col"
                  >
                    {/* Course Image */}
                    <div className="h-40 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-blue-900/40 dark:via-purple-900/40 dark:to-pink-900/40 relative overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-6xl opacity-10">📚</div>
                      </div>
                    </div>

                    {/* Course Info */}
                    <div className="p-6 flex flex-col flex-1">
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-full">
                            {course.category}
                          </span>
                          {isEnrolled && (
                            <span className="text-xs font-semibold bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-3 py-1 rounded-full">
                              Enrolled
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{course.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{course.description}</p>
                      </div>

                      {/* Footer */}
                      <div className="mt-auto">
                        <Link href={`/courses/${course.id}`}>
                          <Button
                            className={`w-full ${
                              isEnrolled
                                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600'
                                : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
                            }`}
                          >
                            {isEnrolled ? 'Continue' : 'Enroll Now'}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-12 text-center">
              <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">No Courses Found</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Try adjusting your search or filters to find courses you're looking for.
              </p>
            </div>
          )}
        </main>

        <AIChat />
      </div>
    </ProtectedRoute>
  );
}
