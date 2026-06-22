'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function CreateCoursePage() {
  const { user, isPremium, role } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Sales Skills',
    level: 'Beginner',
    thumbnail_url: '',
    visibility: 'private',
    allow_self_enroll: false
  });

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };
      
      // If visibility changes to private, disable self-enroll
      if (name === 'visibility' && value === 'private') {
        newData.allow_self_enroll = false;
      }
      
      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.from('courses').insert({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        level: formData.level,
        thumbnail_url: formData.thumbnail_url || null,
        is_published: true, // Auto publish for simplicity in demo
        visibility: formData.visibility,
        allow_self_enroll: formData.allow_self_enroll,
        created_by: user.id
      } as any).select().single();

      if (error) throw error;
      
      router.push(`/my-courses`);
    } catch (err) {
      console.error(err);
      alert('Failed to create course. ' + (err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Only allow premium students or managers/admins
  const canCreate = (role === 'student' && isPremium) || role === 'manager' || role === 'admin';

  if (user && !canCreate) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <p>Bạn cần nâng cấp gói Team hoặc Enterprise để tạo khóa học.</p>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRoles={['student', 'manager', 'admin']}>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Tạo Khóa Học Mới</h1>
          
          <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 shadow-sm">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tiêu đề khóa học *</label>
                <Input required name="title" value={formData.title} onChange={handleChange} placeholder="VD: Kỹ năng chốt sale BĐS" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mô tả *</label>
                <textarea 
                  required
                  name="description" 
                  value={formData.description} 
                  onChange={handleChange} 
                  rows={4}
                  className="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  placeholder="Mô tả chi tiết nội dung khóa học..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Danh mục *</label>
                  <select 
                    name="category" 
                    value={formData.category} 
                    onChange={handleChange}
                    className="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  >
                    <option value="Sales Skills">Kỹ năng Bán hàng</option>
                    <option value="Real Estate">Bất động sản</option>
                    <option value="Communication">Giao tiếp</option>
                    <option value="Negotiation">Đàm phán</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cấp độ *</label>
                  <select 
                    name="level" 
                    value={formData.level} 
                    onChange={handleChange}
                    className="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  >
                    <option value="Beginner">Cơ bản</option>
                    <option value="Intermediate">Trung cấp</option>
                    <option value="Advanced">Nâng cao</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL Ảnh bìa (tùy chọn)</label>
                <Input name="thumbnail_url" value={formData.thumbnail_url} onChange={handleChange} placeholder="https://..." />
              </div>

              <div className="border-t border-gray-200 dark:border-slate-700 pt-6 mt-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Quyền riêng tư</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chế độ hiển thị</label>
                    <select 
                      name="visibility" 
                      value={formData.visibility} 
                      onChange={handleChange}
                      className="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                    >
                      <option value="public">Công khai (Ai cũng có thể xem)</option>
                      <option value="private">Riêng tư (Chỉ thành viên được mời)</option>
                      <option value="unlisted">Không công khai (Truy cập bằng link)</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center mt-4">
                    <input 
                      type="checkbox" 
                      id="allow_self_enroll" 
                      name="allow_self_enroll" 
                      checked={formData.allow_self_enroll} 
                      onChange={handleChange}
                      disabled={formData.visibility === 'private'}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="allow_self_enroll" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Cho phép tự động đăng ký (Self-enroll)
                    </label>
                  </div>
                  {formData.visibility === 'private' && (
                    <p className="text-xs text-orange-500 mt-1">Khóa học riêng tư không cho phép tự đăng ký.</p>
                  )}
                </div>
              </div>

            </div>

            <div className="mt-8 flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>Hủy</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Đang tạo...' : 'Tạo Khóa Học'}
              </Button>
            </div>
          </form>
        </main>
      </div>
    </ProtectedRoute>
  );
}
