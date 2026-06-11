import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if current user is admin
    const { data: profile } = await (supabase
      .from('profiles') as any)
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { userId, role, plan } = await request.json();

    if (!userId || !role || !plan) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const updateData: any = { role, plan };
    if (plan === 'premium') {
      updateData.is_premium = true;
      // Just a default expiration for premium
      updateData.premium_until = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    } else {
      updateData.is_premium = false;
      updateData.premium_until = null;
    }

    const { error } = await (supabase
      .from('profiles') as any)
      .update(updateData as any)
      .eq('id', userId);

    if (error) {
      console.error('Error updating user profile:', error);
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Unhandled error in update-user:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
