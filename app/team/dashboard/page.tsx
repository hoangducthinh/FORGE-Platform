'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';
import { Users, UserCheck, UserX, BookOpen, Clock, Award, TrendingUp, BarChart3, GraduationCap, Loader2 } from 'lucide-react';

interface LearnerRow {
  user_id: string | null;
  learner_name: string;
  email: string;
  course_id: string;
  course_title: string;
  invite_status: string;
  enrollment_status: string;
  progress_percent: number;
  total_learning_seconds: number;
  last_accessed_at: string | null;
  average_ai_score: number;
  certificate_status: string;
  certificate_number: string | null;
}

interface Summary {
  totalLearners: number;
  totalEnrolled: number;
  totalNotJoined: number;
  inProgress: number;
  completed: number;
  totalLearningHours: number;
  avgLearningHours: number;
  avgAiScore: number;
  totalCertificates: number;
}

interface CourseOption {
  id: string;
  title: string;
}

export default function TeamDashboardPage() {
  const { user, role } = useAuth();
  const supabase = createClient();
  
  const [isLoading, setIsLoading] = useState(true);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [learners, setLearners] = useState<LearnerRow[]>([]);
  const [summary, setSummary] = useState<Summary>({
    totalLearners: 0, totalEnrolled: 0, totalNotJoined: 0,
    inProgress: 0, completed: 0,
    totalLearningHours: 0, avgLearningHours: 0,
    avgAiScore: 0, totalCertificates: 0,
  });
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    if (!user) return;
    loadAnalytics();
  }, [user, selectedCourse]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const params = new URLSearchParams();
      if (selectedCourse !== 'all') params.set('courseId', selectedCourse);

      const res = await fetch(`/api/team/analytics?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      
      if (!res.ok) throw new Error('Failed to load analytics');
      
      const data = await res.json();
      setCourses(data.courses || []);
      setLearners(data.learners || []);
      setSummary(data.summary || {});
    } catch (err) {
      console.error('Error loading analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLearners = learners.filter(l => {
    if (selectedStatus !== 'all' && l.enrollment_status !== selectedStatus) return false;
    return true;
  });

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${(seconds / 3600).toFixed(1)}h`;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      invited: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      enrolled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      in_progress: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      certified: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    };
    const labels: Record<string, string> = {
      invited: 'Đã mời',
      enrolled: 'Đã tham gia',
      in_progress: 'Đang học',
      completed: 'Hoàn thành',
      certified: 'Chứng chỉ',
    };
    return (
      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getCertBadge = (status: string) => {
    if (status === 'issued') return <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Đã cấp</span>;
    if (status === 'eligible') return <span className="text-xs font-medium px-2 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Đủ ĐK</span>;
    return <span className="text-xs text-gray-400">—</span>;
  };

  const summaryCards = [
    { icon: Users, label: 'Tổng học viên', value: summary.totalLearners, color: 'blue' },
    { icon: UserCheck, label: 'Đã tham gia', value: summary.totalEnrolled, color: 'green' },
    { icon: UserX, label: 'Chưa tham gia', value: summary.totalNotJoined, color: 'yellow' },
    { icon: BookOpen, label: 'Đang học', value: summary.inProgress, color: 'indigo' },
    { icon: TrendingUp, label: 'Hoàn thành', value: summary.completed, color: 'emerald' },
    { icon: Clock, label: 'Tổng giờ học', value: `${summary.totalLearningHours}h`, color: 'purple' },
    { icon: BarChart3, label: 'TB giờ/người', value: `${summary.avgLearningHours}h`, color: 'pink' },
    { icon: Award, label: 'TB điểm AI', value: summary.avgAiScore, color: 'orange' },
    { icon: GraduationCap, label: 'Chứng chỉ', value: summary.totalCertificates, color: 'teal' },
  ];

  return (
    <ProtectedRoute requiredRoles={['manager', 'admin']}>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <Navbar />
        <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-orange-500" />
              Theo Dõi Tiến Độ Nhân Viên
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Tổng quan về tiến độ học tập, thời gian học và kết quả AI của học viên trong các khóa học của bạn.
            </p>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Đang tải dữ liệu...</p>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-4 mb-8">
                {summaryCards.map((card, i) => (
                  <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <card.icon className={`w-4 h-4 text-${card.color}-500`} />
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">{card.label}</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
                  </div>
                ))}
              </div>

              {/* Filters */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 mb-6 shadow-sm">
                <div className="flex flex-wrap gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Khóa học</label>
                    <select
                      value={selectedCourse}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                      className="rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm px-3 py-2 dark:text-white min-w-[200px]"
                    >
                      <option value="all">Tất cả khóa học</option>
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Trạng thái</label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm px-3 py-2 dark:text-white min-w-[160px]"
                    >
                      <option value="all">Tất cả</option>
                      <option value="invited">Đã mời</option>
                      <option value="enrolled">Đã tham gia</option>
                      <option value="in_progress">Đang học</option>
                      <option value="completed">Hoàn thành</option>
                      <option value="certified">Chứng chỉ</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <span className="text-sm text-gray-500 dark:text-gray-400 pb-2">
                      {filteredLearners.length} học viên
                    </span>
                  </div>
                </div>
              </div>

              {/* Learners Table */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-slate-700/50 text-gray-600 dark:text-gray-300 uppercase text-xs font-medium">
                      <tr>
                        <th className="px-4 py-3 sticky left-0 bg-gray-50 dark:bg-slate-700/50 z-10">Học viên</th>
                        <th className="px-4 py-3">Khóa học</th>
                        <th className="px-4 py-3 text-center">Trạng thái</th>
                        <th className="px-4 py-3 text-center">Tiến độ</th>
                        <th className="px-4 py-3 text-center">Thời gian</th>
                        <th className="px-4 py-3 text-center">Điểm AI</th>
                        <th className="px-4 py-3 text-center">Chứng chỉ</th>
                        <th className="px-4 py-3">Truy cập gần nhất</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                      {filteredLearners.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                            Chưa có dữ liệu học viên nào.
                          </td>
                        </tr>
                      ) : (
                        filteredLearners.map((learner, idx) => (
                          <tr key={`${learner.email}-${learner.course_id}-${idx}`} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                            <td className="px-4 py-3 sticky left-0 bg-white dark:bg-slate-800 z-10">
                              <div className="font-medium text-gray-900 dark:text-white text-sm">{learner.learner_name}</div>
                              <div className="text-xs text-gray-500">{learner.email}</div>
                            </td>
                            <td className="px-4 py-3 max-w-[200px]">
                              <span className="text-sm text-gray-700 dark:text-gray-300 truncate block">{learner.course_title}</span>
                            </td>
                            <td className="px-4 py-3 text-center">{getStatusBadge(learner.enrollment_status)}</td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center gap-2 justify-center">
                                <div className="w-16 bg-gray-200 dark:bg-slate-600 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full transition-all ${
                                      learner.progress_percent >= 100 ? 'bg-green-500' : 
                                      learner.progress_percent > 0 ? 'bg-blue-500' : 'bg-gray-300 dark:bg-slate-500'
                                    }`}
                                    style={{ width: `${Math.min(learner.progress_percent, 100)}%` }}
                                  />
                                </div>
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-8">{learner.progress_percent}%</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {learner.total_learning_seconds > 0 ? formatDuration(learner.total_learning_seconds) : '—'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`text-sm font-bold ${
                                learner.average_ai_score >= 70 ? 'text-green-600 dark:text-green-400' :
                                learner.average_ai_score > 0 ? 'text-orange-600 dark:text-orange-400' :
                                'text-gray-400'
                              }`}>
                                {learner.average_ai_score > 0 ? learner.average_ai_score : '—'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">{getCertBadge(learner.certificate_status)}</td>
                            <td className="px-4 py-3">
                              <span className="text-xs text-gray-500">
                                {learner.last_accessed_at 
                                  ? new Date(learner.last_accessed_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
                                  : '—'
                                }
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
