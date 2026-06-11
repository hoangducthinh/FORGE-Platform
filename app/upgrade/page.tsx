'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { CheckCircle2, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function UpgradePage() {
  const { user, profile, isPremium } = useAuth();
  const [isActivating, setIsActivating] = useState(false);
  const router = useRouter();

  const handleActivateDemo = async () => {
    setIsActivating(true);
    try {
      const res = await fetch('/api/upgrade-premium', {
        method: 'POST',
      });
      if (res.ok) {
        // Need a hard refresh to re-fetch the profile correctly via server or wait for layout reload
        window.location.href = '/dashboard';
      } else {
        alert('Failed to upgrade. Please try again.');
        setIsActivating(false);
      }
    } catch (error) {
      console.error(error);
      setIsActivating(false);
    }
  };

  if (isPremium) {
    return (
      <ProtectedRoute requiredRoles={['student', 'manager', 'admin']}>
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
          <Navbar />
          <div className="max-w-3xl mx-auto px-4 py-16 text-center">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Bạn đang sử dụng gói Premium</h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">Bạn đã có toàn quyền truy cập chức năng tạo khóa học và các tính năng nâng cao.</p>
            <Button onClick={() => router.push('/dashboard')}>Quay về Dashboard</Button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRoles={['student', 'manager', 'admin']}>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Nâng cấp FORGE Premium</h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">Mở khóa toàn bộ sức mạnh của nền tảng đào tạo AI</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Học viên</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Gói cơ bản</p>
              <div className="text-4xl font-bold text-gray-900 dark:text-white mb-8">Miễn phí</div>
              
              <ul className="space-y-4 mb-8">
                {['Truy cập các khóa học public', 'Sử dụng AI Simulator (số lượt giới hạn)', 'Xem báo cáo tiến độ học tập cá nhân'].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-600 dark:text-gray-300">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full" disabled>Đang sử dụng</Button>
            </div>

            {/* Premium Plan */}
            <div className="bg-gradient-to-b from-slate-900 to-slate-800 rounded-2xl border border-slate-700 p-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                <Zap className="w-8 h-8 text-orange-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Premium</h2>
              <p className="text-slate-400 mb-6">Dành cho Nhà đào tạo</p>
              <div className="text-4xl font-bold text-white mb-8">
                Demo <span className="text-lg font-normal text-slate-400">/ 30 ngày</span>
              </div>
              
              <ul className="space-y-4 mb-8">
                {['Tự do tạo khóa học mới', 'Sử dụng AI Simulator (không giới hạn)', 'Công cụ quản lý khóa học cá nhân', 'Được ưu tiên hỗ trợ kỹ thuật'].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-200">
                    <CheckCircle2 className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button 
                onClick={handleActivateDemo} 
                disabled={isActivating}
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white border-0"
              >
                {isActivating ? 'Đang kích hoạt...' : 'Kích hoạt Demo Miễn phí'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
