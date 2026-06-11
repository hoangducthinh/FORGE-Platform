import { Database } from './lib/supabase/database.types';
type T = Database['public']['Tables']['simulator_sessions'];
const a: T['Row']['id'] = 'hello';
