import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User, SupabaseClient, AuthError } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';

type UserProfile = {
  id?: string;
  supabase_user_id?: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  [key: string]: unknown;
} | null;

export type SupabaseCtx = {
  supabase: SupabaseClient;
  session: Session | null;
  user: User | null;
  loading: boolean;
  userProfile: UserProfile;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, options?: { data?: object }) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  signInWithOAuth: (provider: 'google' | 'github') => Promise<{ error: AuthError | null }>;
};

const SupabaseContext = createContext<SupabaseCtx | undefined>(undefined);

export const SupabaseProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [userProfile, setUserProfile] = useState<UserProfile>(null);

  useEffect(() => {
    let active = true;
    console.log('SupabaseProvider useEffect: Starting initialization');

    const loadUserProfile = async (userId: string) => {
      try {
        console.log('Loading user profile for:', userId);
        
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('supabase_user_id', userId)
          .single();

        if (error && error.code === 'PGRST116') {
          // Profile doesn't exist, create it
          console.log('Creating new user profile');
          const user = session?.user;
          const { data: newProfile, error: createError } = await supabase
            .from('user_profiles')
            .insert({
              supabase_user_id: userId,
              email: user?.email,
              full_name: user?.user_metadata?.full_name || user?.user_metadata?.name,
              avatar_url: user?.user_metadata?.avatar_url || user?.user_metadata?.picture,
              last_login: new Date().toISOString()
            })
            .select()
            .single();

          if (createError) {
            console.error('Error creating user profile:', createError);
            // If column doesn't exist, we need to run migration
            if (createError.message?.includes('column "supabase_user_id" of relation "user_profiles" does not exist')) {
              console.error('Migration required: supabase_user_id column does not exist. Please run the database migration script.');
              setUserProfile(null);
              return;
            }
          } else {
            console.log('Successfully created user profile:', newProfile);
            setUserProfile(newProfile);
          }
        } else if (!error) {
          // Update last login
          console.log('Found existing user profile, updating last login');
          const { data: updatedProfile } = await supabase
            .from('user_profiles')
            .update({ last_login: new Date().toISOString() })
            .eq('supabase_user_id', userId)
            .select()
            .single();
          
          setUserProfile(updatedProfile || profile);
        } else {
          console.error('Error loading user profile:', error);
          if (error.message?.includes('column "supabase_user_id" of relation "user_profiles" does not exist')) {
            console.error('Migration required: supabase_user_id column does not exist. Please run the database migration script.');
          }
          setUserProfile(null);
        }
      } catch (error) {
        console.error('Error in loadUserProfile:', error);
        setUserProfile(null);
      }
    };

    const initializeAuth = async () => {
      console.log('SupabaseProvider: Initializing auth');
      console.log('Current URL:', window.location.href);
      console.log('URL has auth params:', window.location.search.includes('code=') || window.location.hash.includes('access_token='));
      
      try {
        // Check if we're handling an OAuth callback
        const urlParams = new URLSearchParams(window.location.search);
        const hasAuthCode = urlParams.has('code');
        const hasError = urlParams.has('error');
        
        if (hasAuthCode) {
          console.log('🔄 Detected OAuth callback with code:', urlParams.get('code'));
          
          // Try to exchange the code for a session
          try {
            const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(urlParams.get('code')!);
            if (exchangeError) {
              console.error('❌ Error exchanging code for session:', exchangeError);
            } else {
              console.log('✅ Successfully exchanged code for session:', data);
            }
          } catch (exchangeError) {
            console.error('❌ Exception during code exchange:', exchangeError);
          }
        }
        
        if (hasError) {
          console.error('❌ OAuth error in URL:', urlParams.get('error'), urlParams.get('error_description'));
        }
        
        console.log('Calling supabase.auth.getSession()...');
        
        // Add a timeout to prevent hanging
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Session request timeout')), 10000)
        );
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]) as any;
        
        console.log('Session call completed. Error:', error, 'Session:', session);
        console.log('Session details:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          userId: session?.user?.id,
          userEmail: session?.user?.email,
          accessToken: session?.access_token ? 'Present' : 'Missing'
        });
        
        if (error) {
          console.error('Error getting session:', error);
        } else {
          console.log('Initial session received:', session ? 'Session found' : 'No session');
        }
        
        if (active) {
          setSession(session || null);
          setLoading(false); // Set loading to false regardless
          console.log('Set loading to false, session set to:', session ? 'valid session' : 'null');
          
          // Load user profile asynchronously (don't block the loading state)
          if (session?.user) {
            console.log('Loading user profile for user:', session.user.id);
            loadUserProfile(session.user.id).catch(error => {
              console.error('Error loading user profile during init:', error);
            });
          } else {
            console.log('No session found, not loading user profile');
          }
        }
      } catch (error) {
        console.error('Error in auth initialization:', error);
        if (active) {
          setSession(null);
          setLoading(false);
          console.log('Error occurred, set loading to false');
        }
      }
    };

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        console.log('Auth event details:', {
          event,
          hasSession: !!session,
          hasUser: !!session?.user,
          userId: session?.user?.id,
          userEmail: session?.user?.email,
          accessToken: session?.access_token ? 'Present' : 'Missing'
        });
        
        if (event === 'SIGNED_IN') {
          console.log('✅ User signed in successfully');
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out');
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('🔄 Token refreshed');
        } else if (event === 'USER_UPDATED') {
          console.log('👤 User updated');
        } else if (event === 'INITIAL_SESSION') {
          console.log('🔍 Initial session detected');
        }
        
        if (active) {
          setSession(session);
          setLoading(false); // Always set loading to false when auth state changes
          console.log('Auth state updated - Loading set to false, Session:', session ? 'Present' : 'Null');
          
          // Load user profile asynchronously (don't block the loading state)
          if (session?.user) {
            console.log('Loading user profile for authenticated user:', session.user.id);
            loadUserProfile(session.user.id).catch(error => {
              console.error('Error loading user profile during auth change:', error);
            });
          } else {
            console.log('No session/user, clearing user profile');
            setUserProfile(null);
          }
        }
      }
    );

    // Initialize authentication
    initializeAuth();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  // Authentication methods
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, options?: { data?: object }) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options,
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const signInWithOAuth = async (provider: 'google' | 'github') => {
    console.log('Starting OAuth sign-in with provider:', provider);
    const redirectTo = `${window.location.origin}`;
    console.log('Redirect URL:', redirectTo);
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    
    if (error) {
      console.error('OAuth sign-in error:', error);
    } else {
      console.log('OAuth sign-in initiated successfully');
    }
    
    return { error };
  };

  const value = useMemo<SupabaseCtx>(
    () => ({ 
      supabase,
      session,
      user: session?.user || null,
      loading,
      userProfile,
      signIn,
      signUp,
      signOut,
      signInWithOAuth,
    }),
    [session, loading, userProfile]
  );

  return <SupabaseContext.Provider value={value}>{children}</SupabaseContext.Provider>;
};

export const useSupabase = (): SupabaseCtx => {
  const ctx = useContext(SupabaseContext);
  if (!ctx) throw new Error('useSupabase must be used within SupabaseProvider');
  return ctx;
};
