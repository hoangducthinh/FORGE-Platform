import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceKey);

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const supabase = await createClient();
    
    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user role / premium status
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_premium')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const canManage = profile.role === 'admin' || profile.role === 'manager' || profile.is_premium;
    if (!canManage) {
      return NextResponse.json({ error: 'Premium required to manage courses' }, { status: 403 });
    }

    // Check if the user is the owner or an admin
    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('created_by')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    if (course.created_by !== user.id && profile.role !== 'admin' && profile.role !== 'manager') {
      return NextResponse.json({ error: 'You can only delete your own courses' }, { status: 403 });
    }

    // In a robust system, we would rely on ON DELETE CASCADE.
    // If not all FKs have CASCADE, we need to delete child records manually using Admin client.
    
    // Fetch simulator sessions to delete their messages
    const { data: simSessions } = await supabaseAdmin
      .from('simulator_sessions')
      .select('id')
      .eq('course_id', courseId);
      
    if (simSessions && simSessions.length > 0) {
      const sessionIds = simSessions.map(s => s.id);
      await supabaseAdmin.from('simulator_messages').delete().in('session_id', sessionIds);
    }

    // Delete other related records explicitly to avoid FK constraint errors
    await Promise.all([
      supabaseAdmin.from('simulator_sessions').delete().eq('course_id', courseId),
      supabaseAdmin.from('learning_sessions').delete().eq('course_id', courseId),
      supabaseAdmin.from('user_course_progress').delete().eq('course_id', courseId),
      supabaseAdmin.from('course_enrollments').delete().eq('course_id', courseId),
      supabaseAdmin.from('course_members').delete().eq('course_id', courseId),
      supabaseAdmin.from('course_invitations').delete().eq('course_id', courseId),
      supabaseAdmin.from('lessons').delete().eq('course_id', courseId),
    ]);

    // Finally, delete the course
    const { error: deleteError } = await supabaseAdmin
      .from('courses')
      .delete()
      .eq('id', courseId);

    if (deleteError) {
      console.error('Error deleting course:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('Delete course exception:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
