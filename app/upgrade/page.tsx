'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { CheckCircle2, Zap, Building2, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function UpgradePage() {
  const { user, profile, plan } = useAuth();
  const [isActivating, setIsActivating] = useState(false);
  const router = useRouter();

  const handleActivateTeamDemo = async () => {
    setIsActivating(true);
    try {
      const res = await fetch('/api/upgrade-premium', {
        method: 'POST',
      });
      if (res.ok) {
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

  return (
    <ProtectedRoute requiredRoles={['student', 'manager', 'admin']}>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Chọn gói phù hợp với đội ngũ của bạn</h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">Bắt đầu miễn phí, mở rộng khi đội ngũ Sales của bạn phát triển.</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 items-stretch">
            {/* Free Plan */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-8 flex flex-col">
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-wide">Free</h2>
                <p className="text-gray-500 dark:text-gray-400 font-medium min-h-[48px]">Khám phá cách FORGE giúp Sales luyện tập với khách hàng AI.</p>
              </div>
              <div className="mb-8">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">0₫</span>
                <span className="text-gray-500 dark:text-gray-400"> / tháng</span>
              </div>
              
              <ul className="space-y-4 mb-8 flex-grow">
                {['Tham gia lớp học demo', 'Thực hành AI Sales Simulation', 'Nhận đánh giá sau mỗi phiên luyện tập', 'Theo dõi kết quả cá nhân', 'Tham gia lớp học được mời'].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-600 dark:text-gray-300">
                    <CheckCircle2 className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-8">
                {!user ? (
                  <Button asChild className="w-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900">
                    <Link href="/auth/signup">Bắt đầu miễn phí</Link>
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full border-gray-300 text-gray-700 dark:border-slate-600 dark:text-gray-300" disabled={plan === 'free'}>
                    {plan === 'free' ? 'Gói hiện tại' : 'Đã vượt qua giới hạn'}
                  </Button>
                )}
              </div>
            </div>

            {/* Team Plan */}
            <div className="bg-slate-900 rounded-2xl border-2 border-orange-500 p-8 shadow-2xl relative flex flex-col transform md:-translate-y-4">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest whitespace-nowrap">Phổ biến nhất</span>
              </div>
              
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-orange-400" />
                  <h2 className="text-xl font-bold text-white uppercase tracking-wide">Team</h2>
                </div>
                <p className="text-slate-400 font-medium min-h-[48px]">Biến dữ liệu sản phẩm thành môi trường đào tạo thực chiến.</p>
              </div>
              <div className="mb-8">
                <span className="text-4xl font-bold text-white">4.900.000₫</span>
                <span className="text-slate-400"> / tháng</span>
              </div>
              
              <ul className="space-y-4 mb-8 flex-grow">
                {[
                  'Mọi tính năng của Free', 
                  'Tạo và quản lý lớp học', 
                  'Upload tài liệu sản phẩm', 
                  'AI tạo Customer Archetypes', 
                  'Dashboard quản lý học viên', 
                  'Tối đa 20 học viên'
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-200">
                    <CheckCircle2 className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-8">
                {plan === 'team' || plan === 'enterprise' ? (
                  <Button disabled className="w-full bg-slate-800 text-slate-400 border-0">Gói hiện tại</Button>
                ) : (
                  <Button 
                    onClick={handleActivateTeamDemo} 
                    disabled={isActivating}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white border-0 shadow-lg shadow-orange-500/20"
                  >
                    {isActivating ? 'Đang xử lý...' : 'Đăng ký gói Team'}
                  </Button>
                )}
              </div>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-slate-700 p-8 flex flex-col">
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-wide">Enterprise</h2>
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium min-h-[48px]">Tùy chỉnh FORGE theo quy trình và dữ liệu riêng của doanh nghiệp.</p>
              </div>
              <div className="mb-8">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">Liên hệ</span>
                <span className="text-gray-500 dark:text-gray-400"> báo giá</span>
              </div>
              
              <ul className="space-y-4 mb-8 flex-grow">
                {[
                  'Mọi tính năng của Team', 
                  'Quản lý nhiều phòng ban', 
                  'CRM & API Integration', 
                  'Dashboard phân tích nâng cao', 
                  'Số lượng học viên linh hoạt', 
                  'Customer Success Manager riêng'
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-600 dark:text-gray-300">
                    <CheckCircle2 className="w-5 h-5 text-slate-600 dark:text-slate-400 shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-8">
                {plan === 'enterprise' ? (
                  <Button disabled className="w-full" variant="outline">Gói hiện tại</Button>
                ) : (
                  <Button asChild variant="outline" className="w-full border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800">
                    <Link href="/contact-sales?plan=enterprise">Liên hệ tư vấn</Link>
                  </Button>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
