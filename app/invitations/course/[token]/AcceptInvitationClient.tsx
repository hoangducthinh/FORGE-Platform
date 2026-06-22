'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

export default function AcceptInvitationClient({
  token,
  courseTitle,
  courseDescription
}: {
  token: string,
  courseTitle: string,
  courseDescription: string
}) {
  const [isAccepting, setIsAccepting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetch(`/api/courses/invitations/${token}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      
      const json = await res.json();
      
      if (!res.ok) {
        alert(json.error || 'Có lỗi xảy ra khi chấp nhận lời mời.');
        setIsAccepting(false);
        return;
      }
      
      // Thành công -> redirect tới course detail
      router.push(`/courses/${json.courseId}`);
    } catch (err: any) {
      alert(err.message);
      setIsAccepting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-sm max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Lời Mời Tham Gia</h1>
          <p className="text-gray-600">Bạn đã được mời tham gia khóa học:</p>
        </div>
        
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
          <h2 className="font-semibold text-lg text-blue-900">{courseTitle}</h2>
          <p className="text-sm text-blue-800 mt-2 line-clamp-3">{courseDescription}</p>
        </div>
        
        <Button 
          onClick={handleAccept} 
          disabled={isAccepting} 
          className="w-full h-12 text-lg"
        >
          {isAccepting ? 'Đang xử lý...' : 'Chấp nhận & Bắt đầu học'}
        </Button>
      </div>
    </div>
  );
}
