'use client';

import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function ContactSalesPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Liên hệ Đội ngũ Enterprise</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Hãy cho chúng tôi biết nhu cầu của bạn, chúng tôi sẽ thiết kế giải pháp đào tạo AI phù hợp nhất cho doanh nghiệp.
          </p>
        </div>

        {isSubmitted ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-12 text-center shadow-sm">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Gửi yêu cầu thành công!</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Cảm ơn bạn đã quan tâm đến giải pháp Enterprise của FORGE. Chuyên viên tư vấn của chúng tôi sẽ liên hệ lại qua email trong vòng 24 giờ tới.
            </p>
            <Button asChild className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white">
              <Link href="/dashboard">Quay lại Bảng điều khiển</Link>
            </Button>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-8 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Họ và tên *</label>
                  <input required type="text" className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none" placeholder="Nguyễn Văn A" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email công việc *</label>
                  <input required type="email" className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none" placeholder="email@congty.com" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tên công ty *</label>
                  <input required type="text" className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none" placeholder="Công ty XYZ" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Số lượng học viên dự kiến</label>
                  <select className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none">
                    <option>Dưới 20</option>
                    <option>20 - 50</option>
                    <option>50 - 200</option>
                    <option>Trên 200</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nhu cầu chi tiết</label>
                <textarea rows={4} className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none" placeholder="Vui lòng chia sẻ thêm về nhu cầu đào tạo hiện tại của đội ngũ..."></textarea>
              </div>

              <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white text-lg py-6">
                Gửi Yêu Cầu
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
