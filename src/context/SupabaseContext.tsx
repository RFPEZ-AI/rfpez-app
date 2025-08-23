import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import type { Session, User, SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';

type Auth0User = {
  sub?: string;
  name?: string;
  email?: string;
  picture?: string;
  [key: string]: unknown;
};

type UserProfile = {
  id?: string;
  auth0_id?: string;
  email?: string;
  name?: string;
  [key: string]: unknown;
} | null;

export type SupabaseCtx = {
  supabase: SupabaseClient;
  session: Session | null;
  user: User | null;
  loading: boolean;
  auth0User: Auth0User | null;
  userProfile: UserProfile;
};

const SupabaseContext = createContext<SupabaseCtx | undefined>(undefined);

export const SupabaseProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [, ] = useState<Session | null>(null); // Remove unused session state
  const [loading, setLoading] = useState<boolean>(true);
  const [userProfile, setUserProfile] = useState<UserProfile>(null);
  const { user: auth0User, isAuthenticated, isLoading: auth0Loading } = useAuth0();

  useEffect(() => {
    let active = true;

    const initializeAuth = async () => {
      console.log('SupabaseProvider: Initializing auth');
      console.log('Auth0 loading:', auth0Loading);
      console.log('Auth0 authenticated:', isAuthenticated);
      console.log('Auth0 user:', auth0User);

      if (auth0Loading) {
        console.log('Auth0 still loading, waiting...');
        return;
      }

      if (isAuthenticated && auth0User) {
        console.log('Auth0 authenticated, creating/updating user profile in Supabase');
        
        try {
          // Create or update user profile in Supabase using Auth0 user data
          const { data: existingProfile, error: fetchError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('auth0_id', auth0User.sub)
            .single();

          console.log('Existing profile:', existingProfile);
          console.log('Fetch error:', fetchError);

          if (!existingProfile && fetchError?.code === 'PGRST116') {
            // Create new profile
            console.log('Creating new user profile');
            const { data: newProfile, error: createError } = await supabase
              .from('user_profiles')
              .insert({
                auth0_id: auth0User.sub,
                email: auth0User.email,
                full_name: auth0User.name,
                avatar_url: auth0User.picture,
                last_login: new Date().toISOString()
              })
              .select()
              .single();

            console.log('Created profile:', newProfile);
            console.log('Create error:', createError);

            if (createError) {
              console.error('Error creating user profile:', createError);
            } else {
              setUserProfile(newProfile);
            }
          } else if (existingProfile) {
            // Update existing profile
            console.log('Updating existing user profile');
            const { data: updatedProfile, error: updateError } = await supabase
              .from('user_profiles')
              .update({
                email: auth0User.email,
                full_name: auth0User.name,
                avatar_url: auth0User.picture,
                last_login: new Date().toISOString()
              })
              .eq('auth0_id', auth0User.sub)
              .select()
              .single();

            console.log('Updated profile:', updatedProfile);
            console.log('Update error:', updateError);
            
            if (!updateError) {
              setUserProfile(updatedProfile);
            }
          }
        } catch (error) {
          console.error('Error managing user profile:', error);
        }
      } else {
        setUserProfile(null);
      }

      if (active) {
        setLoading(false);
      }
    };

    // Initialize authentication flow
    initializeAuth();

    return () => {
      active = false;
    };
  }, [isAuthenticated, auth0User, auth0Loading]);

  // We don't use Supabase auth, only Auth0
  const value = useMemo<SupabaseCtx>(
    () => ({ 
      supabase: supabase as unknown as SupabaseClient, 
      session: null, // We don't use Supabase sessions
      user: null, // We don't use Supabase users
      loading: loading || auth0Loading,
      auth0User: auth0User as Auth0User | null,
      userProfile
    }),
    [loading, auth0Loading, auth0User, userProfile]
  );

  return <SupabaseContext.Provider value={value}>{children}</SupabaseContext.Provider>;
};

export const useSupabase = (): SupabaseCtx => {
  const ctx = useContext(SupabaseContext);
  if (!ctx) throw new Error('useSupabase must be used within SupabaseProvider');
  return ctx;
};
