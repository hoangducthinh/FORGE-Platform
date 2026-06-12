'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import { createClient } from './supabase/client';
import type { User } from '@supabase/supabase-js';
import type { Database } from './supabase/database.types';

import type { UserRole, UserPlan, Profile } from './types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  role: UserRole | null;
  plan: UserPlan | null;
  isPremium: boolean;
  isLoading: boolean;
  signup: (email: string, name: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Memoize the Supabase client to prevent recreation on every render
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        
        if (authUser) {
          setUser(authUser);
          // Fetch profile data
          let { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .single();
          
          if (!profileData) {
             // auto-create profile
             const newProfile = {
                id: authUser.id,
                email: authUser.email || '',
                full_name: '',
                role: 'student' as UserRole,
                plan: 'free' as UserPlan,
                is_premium: false,
                subscription_status: 'active',
                seat_limit: 1,
                seats_used: 1
             };
             await (supabase.from('profiles') as any).insert(newProfile as any);
             profileData = newProfile as any;
          }
          setProfile(profileData as any);
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error('Error getting session:', error);
        setUser(null);
        setProfile(null);
      } finally {
        setIsLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        // Fetch profile data
        let { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (!profileData) {
             const newProfile = {
                id: session.user.id,
                email: session.user.email || '',
                full_name: '',
                role: 'student' as UserRole,
                plan: 'free' as UserPlan,
                is_premium: false,
                subscription_status: 'active',
                seat_limit: 1,
                seats_used: 1
             };
             await (supabase.from('profiles') as any).insert(newProfile as any);
             profileData = newProfile as any;
        }
        setProfile(profileData as any);
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase]);

  const signup = async (email: string, name: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
          `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`,
      },
    });

    if (error) throw error;
  };

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo:
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
        `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/reset-password`,
    });
    if (error) throw error;
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile,
      role: profile?.role || null,
      plan: profile?.plan || null,
      isPremium: profile?.plan === 'team' || profile?.plan === 'enterprise' || profile?.is_premium === true,
      isLoading, 
      signup, 
      login, 
      logout, 
      resetPassword, 
      updatePassword 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
