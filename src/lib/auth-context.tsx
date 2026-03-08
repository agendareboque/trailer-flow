import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface Profile {
  id: string;
  empresa_id: string | null;
  nome: string | null;
  role: string;
}

interface Empresa {
  id: string;
  nome: string | null;
  plano: string | null;
  status: string | null;
  trial_ends_at: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  empresa: Empresa | null;
  session: Session | null;
  empresaId: string | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isSuspended: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, meta?: { nome?: string; empresa_nome?: string }) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshEmpresa: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    const prof = data as Profile | null;
    setProfile(prof);

    if (prof?.empresa_id) {
      await fetchEmpresa(prof.empresa_id, prof.role);
    }
  };

  const fetchEmpresa = async (empresaId: string, role?: string) => {
    const { data } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', empresaId)
      .single();

    if (data) {
      const emp = data as Empresa;
      // Auto-suspend expired trials (skip for super_admin)
      if (
        role !== 'super_admin' &&
        emp.status !== 'suspenso' &&
        (!emp.plano || emp.plano === 'trial') &&
        emp.trial_ends_at &&
        new Date() > new Date(emp.trial_ends_at)
      ) {
        await supabase
          .from('empresas')
          .update({ status: 'suspenso' })
          .eq('id', empresaId);
        emp.status = 'suspenso';
      }
      setEmpresa(emp);
    }
  };

  const refreshEmpresa = async () => {
    if (profile?.empresa_id) {
      await fetchEmpresa(profile.empresa_id, profile.role);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => fetchProfile(session.user.id), 0);
      } else {
        setProfile(null);
        setEmpresa(null);
      }
      setLoading(false);
    });

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
    setEmpresa(null);
  };

  const empresaId = profile?.empresa_id ?? null;
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';
  const isSuperAdmin = profile?.role === 'super_admin';
  const isSuspended = empresa?.status === 'suspenso' && !isSuperAdmin;

  return (
    <AuthContext.Provider value={{ user, profile, empresa, session, empresaId, isAdmin, isSuperAdmin, isSuspended, loading, signIn, signUp, signOut, refreshEmpresa }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
