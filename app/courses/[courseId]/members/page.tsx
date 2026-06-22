'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CourseMember, CourseInvitation } from '@/lib/types';
import Link from 'next/link';

export default function CourseMembersPage({ params }: { params: { courseId: string } }) {
  const { user, role } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [course, setCourse] = useState<any>(null);
  const [members, setMembers] = useState<CourseMember[]>([]);
  const [invitations, setInvitations] = useState<CourseInvitation[]>([]);
  const [emailsInput, setEmailsInput] = useState('');
  const [inviteResult, setInviteResult] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    const { data: cData } = await supabase.from('courses').select('title, created_by').eq('id', params.courseId).single();
    setCourse(cData);

    const { data: mData } = await supabase.from('course_members').select('*, profile:profiles(full_name, email)').eq('course_id', params.courseId).order('joined_at', { ascending: false });
    if (mData) setMembers(mData as any);

    const { data: iData } = await supabase.from('course_invitations').select('*').eq('course_id', params.courseId).eq('status', 'pending').order('created_at', { ascending: false });
    if (iData) setInvitations(iData as any);
  };

  const handleInvite = async () => {
    const emails = emailsInput.split('\n').map(e => e.trim()).filter(e => e);
    if (emails.length === 0) return;

    setIsSubmitting(true);
    setInviteResult([]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetch('/api/courses/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          courseId: params.courseId,
          emails
        })
      });

      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'Có lỗi xảy ra');
      } else {
        setInviteResult(json.results || []);
        setEmailsInput('');
        loadData(); // reload
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const revokeInvitation = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn thu hồi lời mời này?')) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch(`/api/courses/invitations/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const removeMember = async (id: string, memberUserId: string) => {
    if (memberUserId === course?.created_by) {
      alert('Không thể xoá Owner ra khỏi khóa học.');
      return;
    }
    if (!confirm('Bạn có chắc chắn muốn xoá học viên này?')) return;
    const { error } = await supabase.from('course_members').delete().eq('id', id);
    if (error) alert(error.message);
    else loadData();
  };

  const changeRole = async (id: string, newRole: string) => {
    const { error } = await supabase.from('course_members').update({ member_role: newRole }).eq('id', id);
    if (error) alert(error.message);
    else loadData();
  };

  // Check permission basic UI (RLS handles actual security)
  const isOwner = course?.created_by === user?.id;
  const canManage = isOwner || role === 'admin' || role === 'manager';

  if (course && !canManage) {
    // If user is a manager inside course_members, we should allow them. 
    // For simplicity, relying on RLS to block data is enough, but we can check here.
    const amIManager = members.some(m => m.user_id === user?.id && m.member_role === 'manager');
    if (!amIManager) {
       return <div className="p-8">Bạn không có quyền quản lý khóa học này.</div>;
    }
  }

  return (
    <ProtectedRoute requiredRoles={['student', 'manager', 'admin']}>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 py-8">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <Link href={`/courses/${params.courseId}`} className="text-sm text-blue-600 hover:underline">← Quay lại khóa học</Link>
              <h1 className="text-2xl font-bold mt-2">Quản lý Học viên: {course?.title}</h1>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Members List */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-4">Danh sách thành viên ({members.length})</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                    <thead className="bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-gray-100 uppercase font-medium">
                      <tr>
                        <th className="px-4 py-3">Tên / Email</th>
                        <th className="px-4 py-3">Vai trò</th>
                        <th className="px-4 py-3">Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map(m => (
                        <tr key={m.id} className="border-b dark:border-slate-700">
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900 dark:text-white">{(m.profile as any)?.full_name || 'No Name'}</div>
                            <div className="text-xs text-gray-500">{(m.profile as any)?.email}</div>
                          </td>
                          <td className="px-4 py-3">
                            <select 
                              value={m.member_role}
                              onChange={(e) => changeRole(m.id, e.target.value)}
                              disabled={m.user_id === course?.created_by}
                              className="text-sm border rounded p-1 dark:bg-slate-700"
                            >
                              <option value="student">Student</option>
                              <option value="instructor">Instructor</option>
                              <option value="manager">Manager</option>
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            {m.user_id !== course?.created_by && (
                              <button onClick={() => removeMember(m.id, m.user_id)} className="text-red-500 hover:text-red-700 text-xs">Xóa</button>
                            )}
                            {m.user_id === course?.created_by && <span className="text-xs text-gray-400">Owner</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pending Invitations */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-4">Lời mời đang chờ ({invitations.length})</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                    <thead className="bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-gray-100 uppercase font-medium">
                      <tr>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Trạng thái</th>
                        <th className="px-4 py-3">Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invitations.map(inv => (
                        <tr key={inv.id} className="border-b dark:border-slate-700">
                          <td className="px-4 py-3">{inv.email}</td>
                          <td className="px-4 py-3 text-orange-500">Pending</td>
                          <td className="px-4 py-3">
                            <button onClick={() => {
                              const origin = window.location.origin;
                              navigator.clipboard.writeText(`${origin}/invitations/course/${inv.token}`);
                              alert('Đã copy link mời!');
                            }} className="text-blue-500 hover:text-blue-700 text-xs mr-3">Copy Link</button>
                            <button onClick={() => revokeInvitation(inv.id)} className="text-red-500 hover:text-red-700 text-xs">Thu hồi</button>
                          </td>
                        </tr>
                      ))}
                      {invitations.length === 0 && (
                        <tr><td colSpan={3} className="px-4 py-3 text-center text-gray-500">Không có lời mời nào.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Invite Form */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm h-fit">
              <h2 className="text-xl font-bold mb-4">Mời học viên mới</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-1">Nhập email (mỗi dòng 1 email)</label>
                  <textarea 
                    value={emailsInput}
                    onChange={e => setEmailsInput(e.target.value)}
                    rows={4}
                    placeholder="student1@gmail.com\nstudent2@gmail.com"
                    className="w-full rounded border p-2 text-sm dark:bg-slate-700"
                  />
                </div>
                <Button onClick={handleInvite} disabled={isSubmitting || !emailsInput.trim()} className="w-full">
                  {isSubmitting ? 'Đang gửi...' : 'Tạo lời mời'}
                </Button>
                
                {inviteResult.length > 0 && (
                  <div className="mt-4 border-t pt-4">
                    <h3 className="font-bold text-sm mb-2">Kết quả:</h3>
                    <ul className="text-xs space-y-2">
                      {inviteResult.map((r, idx) => (
                        <li key={idx} className={r.status === 'error' ? 'text-red-500' : 'text-green-600'}>
                          <strong>{r.email}</strong>: {r.status === 'success' ? 'Tạo thành công' : r.message}
                          {r.token && (
                            <div className="mt-1">
                              <button onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/invitations/course/${r.token}`);
                                alert('Đã copy!');
                              }} className="underline">Copy link</button>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
