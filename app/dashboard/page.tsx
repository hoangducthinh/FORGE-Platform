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
  const [learningHours, setLearningHours] = useState('0.0');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      setIsLoading(true);
      try {
        // Fetch current user explicitly as requested
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
        if (userError || !currentUser) {
          console.error('User not found or error fetching user:', userError);
          setIsLoading(false);
          return;
        }

        // Fetch enrollments without relationship first
        const { data: rawEnrollments, error: enrollmentsError } = await (supabase as any)
          .from('course_enrollments')
          .select('id, user_id, course_id')
          .eq('user_id', currentUser.id);
          
        if (enrollmentsError) {
          console.error("Enrollments query error:", enrollmentsError, "for user:", currentUser.email, currentUser.id);
          throw enrollmentsError;
        }

        const courseIds = (rawEnrollments || []).map((e: any) => e.course_id);
        
        let coursesData: any[] = [];
        if (courseIds.length > 0) {
          const { data: cData, error: coursesError } = await (supabase as any)
            .from('courses')
            .select('*')
            .in('id', courseIds);
            
          if (coursesError) {
            console.error("Courses query error:", coursesError);
          } else {
            coursesData = cData || [];
          }
        }

        // Fetch lessons for enrolled courses to calculate progress
        const { data: lessons, error: lessonsError } = await (supabase as any)
          .from('lessons')
          .select('id, course_id')
          .in('course_id', courseIds.length ? courseIds : ['00000000-0000-0000-0000-000000000000']);

        if (lessonsError) throw lessonsError;
        
        // Fetch user progress
        const { data: progressData, error: progressError } = await (supabase as any)
          .from('user_course_progress')
          .select('course_id, lesson_id, is_completed, progress_percentage')
          .eq('user_id', currentUser.id)
          .in('course_id', courseIds.length ? courseIds : ['00000000-0000-0000-0000-000000000000']);
          
        if (progressError) {
          console.error("Progress query error:", progressError);
        }

        // Fetch learning hours
        const { data: learningSessions, error: learningError } = await (supabase as any)
          .from('learning_sessions')
          .select('duration_seconds')
          .eq('user_id', currentUser.id);

        if (learningError && learningError.code !== '42P01') { // Ignore if table doesn't exist yet
           console.error('Learning session error:', learningError);
        }

        let totalDurationSec = 0;
        (learningSessions || []).forEach((s: any) => {
           totalDurationSec += s.duration_seconds || 0;
        });
        setLearningHours((totalDurationSec / 3600).toFixed(1));

        // Process data
        let totalCompletedLessonsAll = 0;
        let totalLessonsAll = lessons?.length || 0;
        let certCount = 0;

        const mappedCourses = (rawEnrollments || []).map((e: any) => {
          const course = coursesData.find((c: any) => c.id === e.course_id);
          const courseLessons = (lessons || []).filter((l: any) => l.course_id === e.course_id);
          const courseProgress = (progressData || []).filter((p: any) => p.course_id === e.course_id && (p.is_completed || p.progress_percentage >= 100));
          
          const completedLessonsCount = courseProgress.length;
          totalCompletedLessonsAll += completedLessonsCount;

          let progressPercentage = 0;
          if (courseLessons.length > 0) {
            progressPercentage = Math.round((completedLessonsCount / courseLessons.length) * 100);
            if (completedLessonsCount === courseLessons.length) {
              certCount++;
            }
          }

          return {
            courseId: e.course_id,
            course: course,
            progressPercentage,
            status: progressPercentage === 100 ? 'completed' : 'in_progress'
          };
        });
        
        setCourseDetails(mappedCourses);
        setCompletedCount(certCount);
        
        if (totalLessonsAll > 0) {
          setAvgProgress(Math.round((totalCompletedLessonsAll / totalLessonsAll) * 100));
        } else {
          setAvgProgress(0);
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
          {isLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
              <div className="animate-spin w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400 font-medium">Đang tải bảng điều khiển...</p>
            </div>
          ) : (
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
                  value: learningHours,
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
          )}
        </main>

        {/* AI Chat */}
        <AIChat />
      </div>
    </ProtectedRoute>
  );
}
