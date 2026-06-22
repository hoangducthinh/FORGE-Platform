import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Khởi tạo Supabase client với service_role key để bypass RLS khi cần insert (bảo mật qua API logic)
// Hoặc có thể dùng auth của user nếu truyền token lên.
// Ở đây dùng service_role để thao tác an toàn bên server.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    // Xác thực request bằng access token của user
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { courseId, emails } = body;

    if (!courseId || !emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    // 1. Kiểm tra quyền của user đối với course này
    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('created_by, title')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, plan')
      .eq('id', user.id)
      .single();

    const isOwner = course.created_by === user.id;
    const isAdminOrManager = profile?.role === 'admin' || profile?.role === 'manager';
    
    // Kiểm tra course_members xem có phải là manager/instructor không
    const { data: memberRecord } = await supabaseAdmin
      .from('course_members')
      .select('member_role')
      .eq('course_id', courseId)
      .eq('user_id', user.id)
      .single();

    const isCourseManager = memberRecord?.member_role === 'manager';

    if (!isOwner && !isAdminOrManager && !isCourseManager) {
      return NextResponse.json({ error: 'Bạn không có quyền mời học viên vào khóa học này' }, { status: 403 });
    }

    // 2. Kiểm tra giới hạn Team Plan (30 học viên trên mỗi khóa)
    if (profile?.plan === 'team') {
      const { count: memberCount } = await supabaseAdmin
        .from('course_members')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', courseId);
      
      const { count: pendingCount } = await supabaseAdmin
        .from('course_invitations')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', courseId)
        .eq('status', 'pending');

      const totalSeatsTaken = (memberCount || 0) + (pendingCount || 0);

      if (totalSeatsTaken + emails.length > 30) {
        return NextResponse.json({ 
          error: `Đã đạt giới hạn 30 học viên/lời mời của gói Team cho khóa học này. Hiện có: ${totalSeatsTaken}` 
        }, { status: 400 });
      }
    }

    // 3. Xử lý từng email
    const results = [];
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    for (const email of emails) {
      const lowercaseEmail = email.toLowerCase().trim();
      
      // Kiểm tra xem đã là member chưa bằng cách check profile email
      // Để chính xác, phải tìm user_id có email này rồi check course_members
      const { data: invitedUsers } = await supabaseAdmin
        .from('profiles')
        .select('id, email')
        .ilike('email', lowercaseEmail);

      let invitedUserId = null;
      if (invitedUsers && invitedUsers.length > 0) {
        invitedUserId = invitedUsers[0].id;
        
        // Kiểm tra xem đã là member chưa
        const { data: existingMember } = await supabaseAdmin
          .from('course_members')
          .select('id')
          .eq('course_id', courseId)
          .eq('user_id', invitedUserId)
          .single();
          
        if (existingMember) {
          results.push({ email, status: 'error', message: 'Người dùng đã tham gia khóa học' });
          continue;
        }
      }

      // Kiểm tra lời mời pending trùng
      const { data: existingInvite } = await supabaseAdmin
        .from('course_invitations')
        .select('id, token')
        .eq('course_id', courseId)
        .ilike('email', lowercaseEmail)
        .eq('status', 'pending')
        .single();

      if (existingInvite) {
        results.push({ 
          email, 
          status: 'exists', 
          message: 'Lời mời đang chờ xử lý', 
          token: existingInvite.token 
        });
        continue;
      }

      // Tạo lời mời mới
      const { data: newInvite, error: insertError } = await supabaseAdmin
        .from('course_invitations')
        .insert({
          course_id: courseId,
          email: lowercaseEmail,
          invited_user_id: invitedUserId,
          invited_by: user.id,
          expires_at: sevenDaysFromNow.toISOString(),
          status: 'pending'
        })
        .select()
        .single();

      if (insertError) {
         results.push({ email, status: 'error', message: insertError.message });
      } else {
         results.push({ 
           email, 
           status: 'success', 
           token: newInvite.token 
         });
      }
    }

    return NextResponse.json({ success: true, results });

  } catch (err: any) {
    console.error('Error creating invitations:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
