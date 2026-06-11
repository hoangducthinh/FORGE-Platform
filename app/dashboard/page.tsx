'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { AIChat } from '@/components/layout/AIChat';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Clock, Award, TrendingUp, Plus, Settings, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { SimulatorProgressChart } from '@/components/simulator/SimulatorProgressChart';

export default function DashboardPage() {
  const { user, profile, role, isPremium } = useAuth();
  const supabase = createClient();
  
  const [courseDetails, setCourseDetails] = useState<any[]>([]);
  const [avgProgress, setAvgProgress] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      if (!user) return;
      setIsLoading(true);
      try {
        // Fetch enrollments with course details (Note: assuming FK relationship exists, or we fetch manually)
        const { data: enrollments, error: enrollmentsError } = await (supabase as any)
          .from('course_enrollments')
          .select('course_id, courses (*)')
          .eq('user_id', user.id);
          
        if (enrollmentsError) throw enrollmentsError;
        
        // Fetch user progress
        const { data: progressData, error: progressError } = await (supabase as any)
          .from('user_course_progress')
          .select('*')
          .eq('user_id', user.id);
          
        if (progressError) throw progressError;

        // Process data
        const mappedCourses = (enrollments || []).map((e: any) => {
          // Depending on whether it's a join or embedded object, e.courses might be a single object or array
          const course = Array.isArray(e.courses) ? e.courses[0] : e.courses;
          const progress = progressData?.find((p: any) => p.course_id === e.course_id);
          return {
            courseId: e.course_id,
            course: course,
            progressPercentage: progress ? progress.progress_percentage : 0,
            status: progress?.progress_percentage === 100 ? 'completed' : 'in_progress'
          };
        });
        
        setCourseDetails(mappedCourses);
        
        if (mappedCourses.length > 0) {
          const totalProgress = mappedCourses.reduce((sum: number, item: any) => sum + item.progressPercentage, 0);
          setAvgProgress(Math.round(totalProgress / mappedCourses.length));
          setCompletedCount(mappedCourses.filter((m: any) => m.status === 'completed').length);
        }
        
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboardData();
  }, [user, supabase]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
        <Navbar />

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div initial="hidden" animate="visible" variants={containerVariants}>
            {/* Welcome Header */}
            <motion.div variants={itemVariants}>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  Chào mừng trở lại, {profile?.full_name || user?.email?.split('@')[0]}
                  {isPremium && <span className="bg-gradient-to-r from-orange-400 to-red-500 text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">Premium</span>}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Tiếp tục hành trình học tập và rèn luyện kỹ năng của bạn
                </p>
              </div>

              {/* Manager / Admin Quick Links */}
              {(role === 'manager' || role === 'admin') && (
                <div className="mb-8 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl p-6">
                  <h2 className="text-xl font-bold text-purple-900 dark:text-purple-100 mb-4 flex items-center gap-2">
                    <Settings className="w-5 h-5" /> Bảng Điều Khiển Quản Trị
                  </h2>
                  <div className="flex flex-wrap gap-4">
                    <Button variant="outline" className="border-purple-200 hover:bg-purple-100 dark:border-purple-700 dark:hover:bg-purple-800" asChild>
                      <Link href="/courses/create"><Plus className="w-4 h-4 mr-2" /> Tạo khóa học mới</Link>
                    </Button>
                    <Button variant="outline" className="border-purple-200 hover:bg-purple-100 dark:border-purple-700 dark:hover:bg-purple-800" asChild>
                      <Link href="/admin/courses"><BookOpen className="w-4 h-4 mr-2" /> Quản lý khóa học</Link>
                    </Button>
                    {role === 'admin' && (
                      <Button variant="outline" className="border-purple-200 hover:bg-purple-100 dark:border-purple-700 dark:hover:bg-purple-800" asChild>
                        <Link href="/admin/platform"><Users className="w-4 h-4 mr-2" /> Quản lý hệ thống</Link>
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Premium Quick Links */}
              {(role === 'student' && isPremium) && (
                <div className="mb-8 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-2xl p-6">
                  <h2 className="text-xl font-bold text-orange-900 dark:text-orange-100 mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5" /> Khu Vực Premium
                  </h2>
                  <div className="flex gap-4">
                    <Button className="bg-orange-500 hover:bg-orange-600 text-white" asChild>
                      <Link href="/courses/create"><Plus className="w-4 h-4 mr-2" /> Tạo khóa học mới</Link>
                    </Button>
                    <Button variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-800" asChild>
                      <Link href="/my-courses"><BookOpen className="w-4 h-4 mr-2" /> Khóa học của tôi</Link>
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Quick Stats */}
            <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[
                {
                  icon: BookOpen,
                  label: 'Courses Enrolled',
                  value: courseDetails.length,
                  color: 'orange',
                },
                {
                  icon: TrendingUp,
                  label: 'Average Progress',
                  value: `${avgProgress}%`,
                  color: 'red',
                },
                {
                  icon: Award,
                  label: 'Certifications',
                  value: completedCount,
                  color: 'green',
                },
                {
                  icon: Clock,
                  label: 'Learning Hours',
                  value: '24.5',
                  color: 'orange',
                },
              ].map((stat, i) => (
                <motion.div key={i} variants={itemVariants} className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700 shadow-sm transition-transform hover:scale-105">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                    </div>
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${stat.color}-100 dark:bg-${stat.color}-900/30 text-${stat.color}-600 dark:text-${stat.color}-400`}
                    >
                      <stat.icon className="w-5 h-5" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
            
            {/* Simulator Chart */}
            <motion.div variants={itemVariants} className="mb-12">
              <SimulatorProgressChart />
            </motion.div>

            {/* Continue Learning */}
            <motion.div variants={itemVariants} className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Continue Learning</h2>
              {courseDetails.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courseDetails.map((item) => (
                    <div key={item.courseId} className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md transition overflow-hidden">
                      <div className="h-32 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/40 dark:to-red-900/40" />
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{item.course?.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                          {item.course?.description}
                        </p>
                        <div className="mb-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Progress</span>
                            <span className="text-xs font-bold text-gray-900 dark:text-white">{item.progressPercentage}%</span>
                          </div>
                          <Progress value={item.progressPercentage} className="h-2 dark:bg-slate-700" />
                        </div>
                        <Link href={`/courses/${item.courseId}`}>
                          <Button size="sm" className="w-full bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 text-white">
                            Continue
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-12 text-center">
                  <BookOpen className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">No Courses Yet</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    You haven't enrolled in any courses yet. Browse available courses to get started.
                  </p>
                  <Link href="/courses">
                    <Button className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 text-white">
                      Explore Courses
                    </Button>
                  </Link>
                </div>
              )}
            </motion.div>


          </motion.div>
        </main>

        {/* AI Chat */}
        <AIChat />
      </div>
    </ProtectedRoute>
  );
}
