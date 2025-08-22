import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User, SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';

export type SupabaseCtx = {
  supabase: SupabaseClient;
  session: Session | null;
  user: User | null;
  loading: boolean;
};

const SupabaseContext = createContext<SupabaseCtx | undefined>(undefined);

export const SupabaseProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) console.error('Supabase getSession error:', error);
      if (active) {
        setSession(data.session ?? null);
        setLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession ?? null);
      setLoading(false);
    });

    return () => {
      active = false;
      sub?.subscription.unsubscribe();
    };
  }, []);

  const user: User | null = useMemo(() => session?.user ?? null, [session]);

  const value = useMemo<SupabaseCtx>(
    () => ({ supabase: supabase as unknown as SupabaseClient, session, user, loading }),
    [session, user, loading]
  );

  return <SupabaseContext.Provider value={value}>{children}</SupabaseContext.Provider>;
};

export const useSupabase = (): SupabaseCtx => {
  const ctx = useContext(SupabaseContext);
  if (!ctx) throw new Error('useSupabase must be used within SupabaseProvider');
  return ctx;
};
