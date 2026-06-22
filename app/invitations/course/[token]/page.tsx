import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AcceptInvitationClient from './AcceptInvitationClient';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceKey);

export default async function InvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  
  // 1. Fetch invitation details using admin client
  const { data: invitation, error: invError } = await supabaseAdmin
    .from('course_invitations')
    .select(`
      *,
      courses ( title, description )
    `)
    .eq('token', token)
    .single();

  if (invError || !invitation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-sm text-center max-w-md">
          <h1 className="text-xl font-bold text-red-600 mb-2">Liên kết không hợp lệ</h1>
          <p className="text-gray-600">Lời mời này không tồn tại hoặc đã bị xóa.</p>
        </div>
      </div>
    );
  }

  if (invitation.status !== 'pending' || new Date(invitation.expires_at) < new Date()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-sm text-center max-w-md">
          <h1 className="text-xl font-bold text-orange-600 mb-2">Lời mời đã hết hạn</h1>
          <p className="text-gray-600">Lời mời này đã được sử dụng, bị thu hồi hoặc hết hạn.</p>
        </div>
      </div>
    );
  }

  // 2. Check auth
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Redirect to login with returnUrl
    redirect(`/auth/login?returnUrl=/invitations/course/${token}`);
  }

  // 3. Check email match
  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', user.id)
    .single();

  if (!profile || profile.email?.toLowerCase() !== invitation.email.toLowerCase()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-sm text-center max-w-md">
          <h1 className="text-xl font-bold text-red-600 mb-2">Sai tài khoản</h1>
          <p className="text-gray-600">Lời mời này được gửi đến email <strong>{invitation.email}</strong>. Bạn đang đăng nhập bằng <strong>{profile?.email}</strong>.</p>
          <p className="text-sm text-gray-500 mt-4">Vui lòng đăng xuất và đăng nhập đúng tài khoản.</p>
        </div>
      </div>
    );
  }

  return (
    <AcceptInvitationClient 
      token={token} 
      courseTitle={(invitation.courses as any)?.title || 'Khóa học'} 
      courseDescription={(invitation.courses as any)?.description || ''} 
    />
  );
}
