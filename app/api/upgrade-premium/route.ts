import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await (supabase
      .from('profiles') as any)
      .update({
        plan: 'premium',
        is_premium: true,
        premium_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as any)
      .eq('id', session.user.id);

    if (error) {
      console.error('Error updating profile:', error);
      return NextResponse.json({ error: 'Failed to upgrade profile' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Unhandled error in upgrade-premium:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
