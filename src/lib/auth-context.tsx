import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface Profile {
  id: string;
  empresa_id: string | null;
  nome: string | null;
  role: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  empresaId: string | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, meta?: { nome?: string; empresa_nome?: string }) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    setProfile(data as Profile | null);
  };

  useEffect(() => {
    // Set up auth listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        // Use setTimeout to avoid Supabase client deadlock
        setTimeout(() => fetchProfile(session.user.id), 0);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    // THEN check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp = async (email: string, password: string, meta?: { nome?: string; empresa_nome?: string }) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: meta },
    });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const empresaId = profile?.empresa_id ?? null;
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';
  const isSuperAdmin = profile?.role === 'super_admin';

  return (
    <AuthContext.Provider value={{ user, profile, session, empresaId, isAdmin, isSuperAdmin, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
