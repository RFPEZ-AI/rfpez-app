// Copyright Mark Skiba, 2025 All rights reserved

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User, SupabaseClient, AuthError } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';
import type { UserProfile } from '../types/database';

export type SupabaseCtx = {
  supabase: SupabaseClient;
  session: Session | null;
  user: User | null;
  loading: boolean;
  userProfile: UserProfile | null;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, options?: { data?: object }) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  signInWithOAuth: (provider: 'google' | 'github') => Promise<{ error: AuthError | null }>;
  clearAuthState?: () => Promise<void>;
};

const SupabaseContext = createContext<SupabaseCtx | undefined>(undefined);

export const SupabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authRetryCount, setAuthRetryCount] = useState(0);
  const MAX_AUTH_RETRIES = 3;

  // Debug userProfile changes
  useEffect(() => {
    console.log('🔍 UserProfile state changed:', {
      profile: userProfile,
      role: userProfile?.role,
      email: userProfile?.email
    });
  }, [userProfile]);

  // Function to clear corrupted auth state
  const clearAuthState = async () => {
    console.log('🧹 Clearing corrupted auth state...');
    try {
      // Clear Supabase session
      await supabase.auth.signOut();
      
      // Clear local storage
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('supabase.')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Clear state
      setSession(null);
      setUser(null);
      setUserProfile(null);
      setAuthRetryCount(0);
      
      console.log('✅ Auth state cleared successfully');
    } catch (error) {
      console.error('❌ Error clearing auth state:', error);
    }
  };

  useEffect(() => {
    let active = true;
    console.log('SupabaseProvider useEffect: Starting initialization');

    const loadUserProfile = async (user: User) => {
      try {
        console.log('📋 Loading user profile for:', user.id);
        
        // First, let's verify the table structure exists and is accessible
        console.log('🔍 Checking user_profiles table structure...');
        const { data: tableCheck, error: tableError } = await supabase
          .from('user_profiles')
          .select('id, role')
          .limit(1);
        
        console.log('📊 Table structure check:', { 
          accessible: !tableError, 
          error: tableError,
          hasRoleColumn: tableCheck?.[0] ? 'role' in tableCheck[0] : false
        });
        
        // First try to find existing profile
        console.log('🔍 Querying user_profiles for user:', user.id);
        const { data: existingProfile, error: fetchError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('supabase_user_id', user.id)
          .maybeSingle();

        console.log('📊 Query result:', { 
          data: existingProfile, 
          error: fetchError,
          hasData: !!existingProfile,
          roleFromDB: existingProfile?.role 
        });

        if (fetchError) {
          console.error('❌ Error fetching user profile:', fetchError);
          console.error('📋 Error details:', { 
            code: fetchError.code, 
            message: fetchError.message,
            details: fetchError.details,
            hint: fetchError.hint 
          });
          // Don't return here, try to create profile instead
        }

        if (existingProfile) {
          console.log('✅ Found existing user profile:');
          console.log('  - ID:', existingProfile.id);
          console.log('  - Email:', existingProfile.email);
          console.log('  - Role:', existingProfile.role);
          console.log('  - Full profile:', existingProfile);
          console.log('🏷️ Setting userProfile with role:', existingProfile.role);
          setUserProfile(existingProfile);
          
          // Update last login
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({ last_login: new Date().toISOString() })
            .eq('supabase_user_id', user.id);
            
          if (updateError) {
            console.error('Error updating last login:', updateError);
          }
          return;
        }

        // Create new profile if none exists
        console.log('🆕 Creating new user profile for:', user.email);
        console.log('👤 User metadata:', user.user_metadata);
        console.log('🔐 User auth details:', {
          id: user.id,
          email: user.email,
          aud: user.aud,
          role: user.role,
          app_metadata: user.app_metadata
        });
        
        const newProfile = {
          supabase_user_id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '',
          avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
          role: 'user' as const, // Default role for new users
          last_login: new Date().toISOString(),
          created_at: new Date().toISOString()
        };

        console.log('📝 Attempting to insert profile:', newProfile);

        const { data: newUserProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert([newProfile])
          .select()
          .single();

        console.log('📊 Insert result:', { 
          data: newUserProfile, 
          error: createError,
          hasData: !!newUserProfile
        });

        if (createError) {
          console.error('❌ Error creating user profile:', createError);
          console.error('📋 Detailed error information:');
          console.error('  - Code:', createError.code);
          console.error('  - Message:', createError.message);
          console.error('  - Details:', createError.details);
          console.error('  - Hint:', createError.hint);
          
          // Handle specific RLS policy violations
          if (createError.code === '42501') {
            console.log('🔒 RLS Policy violation detected! This means:');
            console.log('  1. The user_profiles table needs proper INSERT policy');
            console.log('  2. Add policy: CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = supabase_user_id);');
            console.log('  3. Check your Supabase dashboard > Authentication > Policies');
          }
          
          // Handle other common permission errors
          if (createError.code === 'PGRST301' || createError.message.includes('permission denied')) {
            console.log('🚫 Permission denied - check RLS policies and table permissions');
          }
          
          // Test if it's a permissions issue
          console.log('🧪 Testing basic table access...');
          const { data: testRead, error: readError } = await supabase
            .from('user_profiles')
            .select('count(*)')
            .limit(1);
          
          console.log('📊 Read test result:', { data: testRead, error: readError });
          
          console.warn('🔄 FALLBACK: Setting temporary profile for testing purposes');
          // Set a temporary profile so the app can still function for development
          setUserProfile({
            id: `temp-${user.id}`,
            supabase_user_id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '',
            avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
            role: 'developer', // Use developer role for testing when RLS fails
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        } else {
          console.log('✅ Successfully created user profile:', newUserProfile);
          console.log('🏷️ New profile role:', newUserProfile?.role);
          setUserProfile(newUserProfile);
        }
      } catch (error) {
        console.error('❌ Unexpected error in loadUserProfile:', error);
        console.warn('🔄 FALLBACK: Setting profile with user role due to unexpected error');
        // Set a minimal profile as fallback
        setUserProfile({
          supabase_user_id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '',
          avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
          role: 'user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    };

    const initializeAuth = async () => {
      console.log(`SupabaseProvider: Initializing auth (attempt ${authRetryCount + 1}/${MAX_AUTH_RETRIES})`);
      console.log('Current URL:', window.location.href);
      console.log('URL has auth params:', window.location.search.includes('code=') || window.location.hash.includes('access_token='));
      
      // Prevent infinite retry loops
      if (authRetryCount >= MAX_AUTH_RETRIES) {
        console.log('🛑 Max auth retries reached. Stopping attempts and clearing state.');
        await clearAuthState();
        setLoading(false);
        return;
      }
      
      try {
        // Check if we're handling an OAuth callback
        const urlParams = new URLSearchParams(window.location.search);
        const hasAuthCode = urlParams.has('code');
        const hasError = urlParams.has('error');
        
        if (hasAuthCode) {
          console.log('🔄 Detected OAuth callback with code parameter');
          
          // Don't manually exchange code - let getSession() handle the PKCE flow
          // The manual exchangeCodeForSession call was causing the PKCE error
          console.log('📋 Letting Supabase handle PKCE flow automatically...');
        }
        
        if (hasError) {
          console.error('❌ OAuth error in URL:', urlParams.get('error'), urlParams.get('error_description'));
          
          // Clear the error from URL to prevent repeated processing
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('error');
          newUrl.searchParams.delete('error_description');
          window.history.replaceState({}, '', newUrl.toString());
          
          setLoading(false);
          return;
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
          
          // Handle invalid refresh token errors
          if (error.message.includes('Invalid Refresh Token') || 
              error.message.includes('Refresh Token Not Found') ||
              error.message.includes('refresh_token')) {
            console.log('🧹 Invalid refresh token detected - clearing auth state...');
            await clearAuthState();
            setSession(null);
            setUser(null);
            setUserProfile(null);
            setLoading(false);
            return;
          }
          
          // Handle PKCE validation failures
          if (error.message.includes('code verifier') || 
              error.message.includes('pkce') || 
              error.message.includes('Invalid PKCE')) {
            console.log('🔄 PKCE error detected - clearing URL parameters and reloading...');
            
            // Clear URL parameters that might be causing issues
            const url = new URL(window.location.href);
            url.search = '';
            url.hash = '';
            
            // Replace current URL without the problematic parameters
            window.history.replaceState({}, document.title, url.toString());
            
            // Force a page reload to restart the auth flow
            setTimeout(() => window.location.reload(), 100);
            return;
          }
          
          // Handle rate limiting
          if (error.message.includes('429') || 
              error.message.includes('Too Many Requests') ||
              error.message.includes('rate limit')) {
            console.log('⏱️ Rate limiting detected - will retry after exponential backoff...');
            const delay = Math.pow(2, authRetryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
            setTimeout(() => {
              setAuthRetryCount(prev => prev + 1);
              initializeAuth();
            }, delay);
            return;
          }
        } else {
          console.log('Initial session received:', session ? 'Session found' : 'No session');
        }
        
        // Reset retry count on successful completion
        setAuthRetryCount(0);
        
        if (active) {
          setSession(session || null);
          setUser(session?.user || null);
          setLoading(false);
          console.log('Set loading to false, session set to:', session ? 'valid session' : 'null');
          
          // Clean up OAuth callback parameters after successful authentication
          if (session && hasAuthCode) {
            console.log('🧹 Cleaning up OAuth callback parameters from URL...');
            const cleanUrl = new URL(window.location.href);
            cleanUrl.searchParams.delete('code');
            cleanUrl.searchParams.delete('state');
            cleanUrl.hash = '';
            window.history.replaceState({}, document.title, cleanUrl.toString());
          }
          
          // Load user profile if we have a user
          if (session?.user) {
            console.log('Loading user profile for user:', session.user.id);
            await loadUserProfile(session.user);
          } else {
            console.log('No session found, not loading user profile');
          }
        }
      } catch (error) {
        console.error('Error in auth initialization:', error);
        
        if (active) {
          // Check if we should retry
          if (authRetryCount < MAX_AUTH_RETRIES) {
            console.log(`🔄 Retrying auth initialization in 2 seconds... (${authRetryCount + 1}/${MAX_AUTH_RETRIES})`);
            setTimeout(() => {
              setAuthRetryCount(prev => prev + 1);
              initializeAuth();
            }, 2000);
          } else {
            console.log('🛑 Max retries reached. Clearing auth state and stopping.');
            await clearAuthState();
            setSession(null);
            setUser(null);
            setLoading(false);
          }
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
          // Ensure local state is cleared on sign out
          if (active) {
            console.log('Clearing local state after sign out');
            setSession(null);
            setUser(null);
            setUserProfile(null);
          }
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('🔄 Token refreshed');
        } else if (event === 'USER_UPDATED') {
          console.log('👤 User updated');
        } else if (event === 'INITIAL_SESSION') {
          console.log('🔍 Initial session detected');
        }
        
        if (active) {
          setSession(session);
          setUser(session?.user || null);
          setLoading(false);
          console.log('Auth state updated - Loading set to false, Session:', session ? 'Present' : 'Null');
          
          // Load user profile asynchronously
          if (session?.user) {
            console.log('Loading user profile for authenticated user:', session.user.id);
            loadUserProfile(session.user).catch(error => {
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
    try {
      console.log('Starting signOut process...');
      console.log('Current session before logout:', session ? 'Present' : 'Missing');
      console.log('Platform info:', navigator.userAgent);
      
      // First, clear the local session state immediately
      setSession(null);
      setUser(null);
      setUserProfile(null);
      
      // Try multiple logout strategies for cross-platform compatibility
      let finalError = null;
      
      // Strategy 1: Standard signOut
      try {
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) {
          console.warn('Standard signOut failed:', signOutError);
          finalError = signOutError;
        } else {
          console.log('Standard signOut successful');
          return { error: null };
        }
      } catch (signOutException) {
        console.warn('Standard signOut threw exception:', signOutException);
        finalError = signOutException as AuthError;
      }
      
      // Strategy 2: Global scope logout (for cases where session is corrupted)
      try {
        console.log('Attempting global scope logout...');
        const { error: globalSignOutError } = await supabase.auth.signOut({ scope: 'global' });
        if (globalSignOutError) {
          console.warn('Global signOut failed:', globalSignOutError);
        } else {
          console.log('Global signOut successful');
          return { error: null };
        }
      } catch (globalSignOutException) {
        console.warn('Global signOut threw exception:', globalSignOutException);
      }
      
      // Strategy 3: Manual session cleanup for Windows platform issues
      try {
        console.log('Attempting manual session cleanup...');
        
        // Clear localStorage/sessionStorage manually
        if (typeof window !== 'undefined') {
          const keysToRemove = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('supabase.')) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach(key => {
            console.log('Removing localStorage key:', key);
            localStorage.removeItem(key);
          });
          
          // Also clear sessionStorage
          const sessionKeysToRemove = [];
          for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && key.startsWith('supabase.')) {
              sessionKeysToRemove.push(key);
            }
          }
          sessionKeysToRemove.forEach(key => {
            console.log('Removing sessionStorage key:', key);
            sessionStorage.removeItem(key);
          });
        }
        
        console.log('Manual session cleanup completed');
        
        // Force trigger auth state change
        console.log('Triggering manual auth state change...');
        // The onAuthStateChange listener should pick this up
        
        return { error: null };
      } catch (manualCleanupException) {
        console.error('Manual cleanup failed:', manualCleanupException);
      }
      
      console.error('All logout strategies failed, final error:', finalError);
      return { error: finalError };
      
    } catch (unexpectedError) {
      console.error('Unexpected error during signOut:', unexpectedError);
      
      // Even if everything fails, clear the local state
      setSession(null);
      setUser(null);
      setUserProfile(null);
      
      return { error: unexpectedError as AuthError };
    }
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
      user,
      loading,
      userProfile,
      signIn,
      signUp,
      signOut,
      signInWithOAuth,
      clearAuthState,
    }),
    [session, loading, userProfile]
  );

  // Don't render children until we've checked for existing sessions
  if (loading) {
    return <div>Loading...</div>;
  }

  return <SupabaseContext.Provider value={value}>{children}</SupabaseContext.Provider>;
};

export const useSupabase = (): SupabaseCtx => {
  const ctx = useContext(SupabaseContext);
  if (!ctx) throw new Error('useSupabase must be used within SupabaseProvider');
  return ctx;
};