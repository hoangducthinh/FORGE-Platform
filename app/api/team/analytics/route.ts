import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Check role
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, plan')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'manager'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 3. Get courses owned by user (or all if admin)
    const courseFilter = request.nextUrl.searchParams.get('courseId');
    let coursesQuery = supabaseAdmin.from('courses').select('id, title');
    
    if (profile.role === 'admin') {
      // Admin sees all
    } else {
      coursesQuery = coursesQuery.eq('created_by', user.id);
    }

    const { data: courses } = await coursesQuery;
    if (!courses || courses.length === 0) {
      return NextResponse.json({ courses: [], learners: [], summary: getEmptySummary() });
    }

    const courseIds = courseFilter 
      ? courses.filter(c => c.id === courseFilter).map(c => c.id) 
      : courses.map(c => c.id);

    if (courseIds.length === 0) {
      return NextResponse.json({ courses, learners: [], summary: getEmptySummary() });
    }

    // 4. Fetch all relevant data in parallel
    const [
      membersRes,
      invitationsRes,
      enrollmentsRes,
      progressRes,
      learningSessionsRes,
      simSessionsRes,
      certificatesRes,
      lessonsRes
    ] = await Promise.all([
      supabaseAdmin.from('course_members').select('user_id, course_id, member_role').in('course_id', courseIds),
      supabaseAdmin.from('course_invitations').select('email, course_id, status, invited_user_id').in('course_id', courseIds),
      supabaseAdmin.from('course_enrollments').select('user_id, course_id, enrolled_at').in('course_id', courseIds),
      supabaseAdmin.from('user_course_progress').select('user_id, course_id, lesson_id, is_completed, progress_percent').in('course_id', courseIds),
      supabaseAdmin.from('learning_sessions').select('user_id, course_id, duration_seconds, started_at').in('course_id', courseIds),
      supabaseAdmin.from('simulator_sessions').select('user_id, course_id, lesson_id, session_avg, status, current_score, turns_count').in('course_id', courseIds),
      supabaseAdmin.from('course_certificates').select('user_id, course_id, certificate_number, issued_at').in('course_id', courseIds),
      supabaseAdmin.from('lessons').select('id, course_id').in('course_id', courseIds).eq('is_published', true)
    ]);

    const members = membersRes.data || [];
    const invitations = invitationsRes.data || [];
    const enrollments = enrollmentsRes.data || [];
    const progress = progressRes.data || [];
    const learningSessions = learningSessionsRes.data || [];
    const simSessions = simSessionsRes.data || [];
    const certificates = certificatesRes.data || [];
    const lessons = lessonsRes.data || [];

    // 5. Get unique user IDs from members + enrollments + invitations
    const allUserIds = new Set<string>();
    members.forEach(m => { if (m.user_id !== user.id) allUserIds.add(m.user_id); });
    enrollments.forEach(e => allUserIds.add(e.user_id));
    invitations.forEach(i => { if (i.invited_user_id) allUserIds.add(i.invited_user_id); });

    // Fetch profiles for those users
    const userIdsArr = Array.from(allUserIds);
    let profilesMap: Record<string, any> = {};
    if (userIdsArr.length > 0) {
      const { data: profilesData } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIdsArr);
      (profilesData || []).forEach(p => { profilesMap[p.id] = p; });
    }

    // 6. Build learner rows — one per (user/email, course)
    const learnerRows: any[] = [];
    const processedKeys = new Set<string>();

    // Process enrolled users
    for (const enrollment of enrollments) {
      if (enrollment.user_id === user.id) continue; // Skip owner
      for (const course of courses) {
        if (!courseIds.includes(course.id)) continue;
        const key = `${enrollment.user_id}:${course.id}`;
        if (enrollment.course_id !== course.id) continue;
        if (processedKeys.has(key)) continue;
        processedKeys.add(key);

        const userProfile = profilesMap[enrollment.user_id];
        const courseLessons = lessons.filter(l => l.course_id === course.id);
        const userProgress = progress.filter(p => p.user_id === enrollment.user_id && p.course_id === course.id && p.is_completed);
        const userLearningSec = learningSessions
          .filter(s => s.user_id === enrollment.user_id && s.course_id === course.id)
          .reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
        const lastSession = learningSessions
          .filter(s => s.user_id === enrollment.user_id && s.course_id === course.id)
          .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())[0];
        const userSimSessions = simSessions.filter(s => s.user_id === enrollment.user_id && s.course_id === course.id);
        const avgAiScore = userSimSessions.length > 0
          ? userSimSessions.reduce((sum, s) => sum + (s.session_avg || 0), 0) / userSimSessions.length
          : 0;
        const knowledgeCheckSessions = userSimSessions.filter(s => {
          const lesson = lessons.find(l => l.id === s.lesson_id);
          return lesson != null; // We'd need lesson_type but we only have id, so use session_avg
        });
        const progressPercent = courseLessons.length > 0
          ? Math.round((userProgress.length / courseLessons.length) * 100)
          : 0;
        const cert = certificates.find(c => c.user_id === enrollment.user_id && c.course_id === course.id);

        let status = 'enrolled';
        if (cert) status = 'certified';
        else if (progressPercent >= 100) status = 'completed';
        else if (progressPercent > 0) status = 'in_progress';

        learnerRows.push({
          user_id: enrollment.user_id,
          learner_name: userProfile?.full_name || 'Unknown',
          email: userProfile?.email || '',
          course_id: course.id,
          course_title: course.title,
          invite_status: 'accepted',
          enrollment_status: status,
          progress_percent: progressPercent,
          total_learning_seconds: userLearningSec,
          last_accessed_at: lastSession?.started_at || enrollment.enrolled_at,
          average_ai_score: Math.round(avgAiScore * 10) / 10,
          certificate_status: cert ? 'issued' : (progressPercent >= 100 && avgAiScore >= 70 ? 'eligible' : 'not_eligible'),
          certificate_number: cert?.certificate_number || null,
        });
      }
    }

    // Process pending invitations (not yet enrolled)
    for (const inv of invitations) {
      if (inv.status !== 'pending') continue;
      const course = courses.find(c => c.id === inv.course_id);
      if (!course || !courseIds.includes(course.id)) continue;
      
      // Check if this user is already processed via enrollment
      const invitedId = inv.invited_user_id;
      const key = invitedId ? `${invitedId}:${course.id}` : `email:${inv.email}:${course.id}`;
      if (processedKeys.has(key)) continue;
      if (invitedId && processedKeys.has(`${invitedId}:${course.id}`)) continue;
      processedKeys.add(key);

      const userProfile = invitedId ? profilesMap[invitedId] : null;

      learnerRows.push({
        user_id: invitedId || null,
        learner_name: userProfile?.full_name || inv.email.split('@')[0],
        email: inv.email,
        course_id: course.id,
        course_title: course.title,
        invite_status: 'pending',
        enrollment_status: 'invited',
        progress_percent: 0,
        total_learning_seconds: 0,
        last_accessed_at: null,
        average_ai_score: 0,
        certificate_status: 'not_eligible',
        certificate_number: null,
      });
    }

    // 7. Build summary
    const enrolledUserIds = new Set(enrollments.filter(e => e.user_id !== user.id).map(e => e.user_id));
    const invitedEmails = new Set(invitations.filter(i => i.status === 'pending').map(i => i.email));
    const totalLearners = enrolledUserIds.size + invitedEmails.size;
    const totalEnrolled = enrolledUserIds.size;
    const totalNotJoined = invitedEmails.size;

    const inProgressCount = learnerRows.filter(r => r.enrollment_status === 'in_progress').length;
    const completedCount = learnerRows.filter(r => ['completed', 'certified'].includes(r.enrollment_status)).length;
    
    const totalLearningSec = learningSessions
      .filter(s => s.user_id !== user.id)
      .reduce((sum, s) => sum + (s.duration_seconds || 0), 0);

    const avgLearningHours = totalEnrolled > 0 ? totalLearningSec / totalEnrolled / 3600 : 0;

    const learnerSimSessions = simSessions.filter(s => s.user_id !== user.id);
    const overallAvgAiScore = learnerSimSessions.length > 0
      ? learnerSimSessions.reduce((sum, s) => sum + (s.session_avg || 0), 0) / learnerSimSessions.length
      : 0;

    const summary = {
      totalLearners,
      totalEnrolled,
      totalNotJoined,
      inProgress: inProgressCount,
      completed: completedCount,
      totalLearningHours: Math.round(totalLearningSec / 3600 * 10) / 10,
      avgLearningHours: Math.round(avgLearningHours * 10) / 10,
      avgAiScore: Math.round(overallAvgAiScore * 10) / 10,
      totalCertificates: certificates.length,
    };

    return NextResponse.json({ courses, learners: learnerRows, summary });

  } catch (err: any) {
    console.error('Team analytics error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

function getEmptySummary() {
  return {
    totalLearners: 0, totalEnrolled: 0, totalNotJoined: 0,
    inProgress: 0, completed: 0,
    totalLearningHours: 0, avgLearningHours: 0,
    avgAiScore: 0, totalCertificates: 0,
  };
}
