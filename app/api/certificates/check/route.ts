import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
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
    const { courseId } = body;

    if (!courseId) {
      return NextResponse.json({ error: 'courseId required' }, { status: 400 });
    }

    // Check if certificate already exists
    const { data: existingCert } = await supabaseAdmin
      .from('course_certificates')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .single();

    if (existingCert) {
      return NextResponse.json({ status: 'already_issued' });
    }

    // Get all published lessons for this course
    const { data: lessons } = await supabaseAdmin
      .from('lessons')
      .select('id')
      .eq('course_id', courseId)
      .eq('is_published', true);

    if (!lessons || lessons.length === 0) {
      return NextResponse.json({ status: 'no_lessons' });
    }

    // Get user progress
    const { data: progress } = await supabaseAdmin
      .from('user_course_progress')
      .select('lesson_id, is_completed')
      .eq('user_id', user.id)
      .eq('course_id', courseId);

    const completedLessons = (progress || []).filter(p => p.is_completed);
    const progressPercent = Math.round((completedLessons.length / lessons.length) * 100);

    if (progressPercent < 100) {
      return NextResponse.json({ 
        status: 'not_eligible', 
        reason: 'incomplete',
        progress: progressPercent 
      });
    }

    // Get average AI score
    const { data: simSessions } = await supabaseAdmin
      .from('simulator_sessions')
      .select('session_avg')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .eq('status', 'completed');

    let avgAiScore = 0;
    if (simSessions && simSessions.length > 0) {
      avgAiScore = simSessions.reduce((sum, s) => sum + (s.session_avg || 0), 0) / simSessions.length;
    }

    if (avgAiScore < 70) {
      return NextResponse.json({
        status: 'not_eligible',
        reason: 'low_ai_score',
        avgAiScore: Math.round(avgAiScore * 10) / 10,
        required: 70,
      });
    }

    // Issue certificate
    const certNumber = `FORGE-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const { data: cert, error: certError } = await supabaseAdmin
      .from('course_certificates')
      .insert({
        user_id: user.id,
        course_id: courseId,
        certificate_number: certNumber,
        progress_percent: progressPercent,
        average_ai_score: Math.round(avgAiScore * 10) / 10,
      })
      .select()
      .single();

    if (certError) {
      console.error('Certificate insert error:', certError);
      return NextResponse.json({ error: certError.message }, { status: 500 });
    }

    return NextResponse.json({
      status: 'issued',
      certificate: cert,
    });

  } catch (err: any) {
    console.error('Certificate check error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
