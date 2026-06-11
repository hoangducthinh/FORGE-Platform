'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, AlertTriangle, BarChart3, Settings, Shield, Edit2, CheckCircle2, Zap } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import type { Profile } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';

export default function PlatformAdminPage() {
  const supabase = createClient();
  const { role: currentUserRole } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [totalCourses, setTotalCourses] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<string>('student');
  const [editPlan, setEditPlan] = useState<string>('free');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: pData } = await (supabase as any).from('profiles').select('*').order('created_at', { ascending: false });
      if (pData) setProfiles(pData as any[]);

      const { count: cCount } = await (supabase as any).from('courses').select('*', { count: 'exact', head: true });
      if (cCount) setTotalCourses(cCount);

      const { count: sCount } = await (supabase as any).from('simulator_sessions').select('*', { count: 'exact', head: true });
      if (sCount) setTotalSessions(sCount);

    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredUsers = profiles.filter(
    (u) =>
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const students = profiles.filter((u) => u.role === 'student');
  const managers = profiles.filter((u) => u.role === 'manager');
  const admins = profiles.filter((u) => u.role === 'admin');
  
  const premiumUsers = profiles.filter((p) => {
    const activeUntilOk = !p.premium_until || new Date(p.premium_until) > new Date();
    return activeUntilOk && (p.is_premium === true || p.plan === 'premium');
  });

  const startEdit = (user: Profile) => {
    setEditingUserId(user.id);
    setEditRole(user.role || 'student');
    setEditPlan(user.plan || 'free');
  };

  const saveEdit = async (userId: string) => {
    try {
      const res = await fetch('/api/admin/update-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: editRole, plan: editPlan })
      });
      if (res.ok) {
        setEditingUserId(null);
        // Tải lại dữ liệu trực tiếp từ Supabase ngay lập tức
        await loadData();
      } else {
        const data = await res.json();
        alert('Cập nhật thất bại: ' + data.error);
      }
    } catch (err) {
      console.error(err);
      alert('Đã có lỗi xảy ra');
    }
  };

  return (
    <ProtectedRoute requiredRoles={['admin', 'manager']}>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Quản trị Hệ thống</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Quản lý người dùng, phân quyền và gói cước</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Tổng User</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{profiles.length}</p>
                </div>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-100 text-blue-600">
                  <Users className="w-5 h-5" />
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Admin / Manager</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{admins.length} / {managers.length}</p>
                </div>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-100 text-purple-600">
                  <Shield className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Premium Users</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{premiumUsers.length}</p>
                </div>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-orange-100 text-orange-600">
                  <Zap className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Tổng Khóa Học</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{totalCourses}</p>
                </div>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-100 text-green-600">
                  <BarChart3 className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="users" className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
            <TabsList className="border-b border-gray-200 dark:border-slate-700 rounded-none w-full justify-start px-6 py-0 h-auto bg-transparent">
              <TabsTrigger value="users" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 py-3">
                Quản lý User
              </TabsTrigger>
              <TabsTrigger value="analytics" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 py-3">
                Thống kê
              </TabsTrigger>
            </TabsList>

            {/* User Management */}
            <TabsContent value="users" className="p-6">
              <div className="mb-6">
                <Input
                  type="text"
                  placeholder="Tìm kiếm user..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-md"
                />
              </div>

              {isLoading ? (
                <div className="flex justify-center p-8"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-700">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
                      <tr>
                        <th className="px-6 py-3 font-medium text-gray-900 dark:text-gray-200">Email</th>
                        <th className="px-6 py-3 font-medium text-gray-900 dark:text-gray-200">Tên</th>
                        <th className="px-6 py-3 font-medium text-gray-900 dark:text-gray-200">Role</th>
                        <th className="px-6 py-3 font-medium text-gray-900 dark:text-gray-200">Gói</th>
                        <th className="px-6 py-3 font-medium text-gray-900 dark:text-gray-200">Trạng thái Premium</th>
                        <th className="px-6 py-3 font-medium text-gray-900 dark:text-gray-200 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                          <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{u.email}</td>
                          <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{u.full_name || 'N/A'}</td>
                          
                          <td className="px-6 py-4">
                            {editingUserId === u.id ? (
                              <select 
                                value={editRole} 
                                onChange={(e) => setEditRole(e.target.value)}
                                className="border rounded px-2 py-1 bg-white dark:bg-slate-800 dark:text-white"
                              >
                                <option value="student">Student</option>
                                <option value="manager">Manager</option>
                                <option value="admin">Admin</option>
                              </select>
                            ) : (
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                u.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                u.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {u.role}
                              </span>
                            )}
                          </td>

                          <td className="px-6 py-4">
                            {editingUserId === u.id ? (
                              <select 
                                value={editPlan} 
                                onChange={(e) => setEditPlan(e.target.value)}
                                className="border rounded px-2 py-1 bg-white dark:bg-slate-800 dark:text-white"
                              >
                                <option value="free">Free</option>
                                <option value="premium">Premium</option>
                              </select>
                            ) : (
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                u.plan === 'premium' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {u.plan || 'free'}
                              </span>
                            )}
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium w-max ${
                                u.is_premium ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {u.is_premium ? 'Có' : 'Không'}
                              </span>
                              {u.premium_until && (
                                <span className="text-xs text-gray-500 mt-1">
                                  Đến: {new Date(u.premium_until).toLocaleDateString('vi-VN')}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-6 py-4 text-right">
                            {editingUserId === u.id ? (
                              <div className="flex justify-end gap-2">
                                <Button size="sm" variant="outline" onClick={() => setEditingUserId(null)}>Hủy</Button>
                                <Button size="sm" onClick={() => saveEdit(u.id)}>Lưu</Button>
                              </div>
                            ) : currentUserRole === 'admin' ? (
                              <Button size="sm" variant="ghost" onClick={() => startEdit(u)}>
                                <Edit2 className="w-4 h-4 mr-2" /> Sửa
                              </Button>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                      {filteredUsers.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                            Không tìm thấy user nào
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            {/* Analytics */}
            <TabsContent value="analytics" className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">Hội thoại Simulator</h3>
                  <p className="text-3xl text-blue-600 font-bold">{totalSessions}</p>
                  <p className="text-sm text-gray-500 mt-2">Tổng số lượt thực hành qua AI</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </ProtectedRoute>
  );
}
