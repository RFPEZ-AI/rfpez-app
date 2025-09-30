// Supabase Connection Health Check Utility
// Copyright Mark Skiba, 2025 All rights reserved

import { supabase } from '../supabaseClient';

interface HealthCheckResult {
  isHealthy: boolean;
  connectionTime: number;
  error?: string;
  details?: any;
}

class SupabaseHealthChecker {
  private static instance: SupabaseHealthChecker;

  static getInstance(): SupabaseHealthChecker {
    if (!SupabaseHealthChecker.instance) {
      SupabaseHealthChecker.instance = new SupabaseHealthChecker();
    }
    return SupabaseHealthChecker.instance;
  }

  /**
   * Perform a basic health check on Supabase connection
   */
  async checkConnection(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Try a simple query to test connectivity
      const { data, error } = await supabase
        .from('agents')
        .select('id')
        .limit(1);
      
      const connectionTime = Date.now() - startTime;
      
      if (error) {
        return {
          isHealthy: false,
          connectionTime,
          error: error.message,
          details: error
        };
      }
      
      return {
        isHealthy: true,
        connectionTime
      };
    } catch (networkError) {
      const connectionTime = Date.now() - startTime;
      return {
        isHealthy: false,
        connectionTime,
        error: networkError instanceof Error ? networkError.message : 'Unknown network error',
        details: networkError
      };
    }
  }

  /**
   * Test the specific RPC function that's failing
   */
  async checkRPCFunction(sessionId: string): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase
        .rpc('get_session_active_agent', { session_uuid: sessionId });
      
      const connectionTime = Date.now() - startTime;
      
      if (error) {
        return {
          isHealthy: false,
          connectionTime,
          error: `RPC Error: ${error.message}`,
          details: {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          }
        };
      }
      
      return {
        isHealthy: true,
        connectionTime,
        details: { resultCount: data?.length || 0 }
      };
    } catch (networkError) {
      const connectionTime = Date.now() - startTime;
      return {
        isHealthy: false,
        connectionTime,
        error: `Network Error: ${networkError instanceof Error ? networkError.message : 'Unknown'}`,
        details: networkError
      };
    }
  }

  /**
   * Comprehensive health check with detailed logging
   */
  async diagnose(sessionId?: string): Promise<void> {
    console.group('🏥 SUPABASE HEALTH CHECK');
    
    // Basic connection test
    console.log('📡 Testing basic connection...');
    const basicCheck = await this.checkConnection();
    
    if (basicCheck.isHealthy) {
      console.log('✅ Basic connection: OK (' + basicCheck.connectionTime + 'ms)');
    } else {
      console.error('❌ Basic connection: FAILED (' + basicCheck.connectionTime + 'ms)');
      console.error('Error:', basicCheck.error);
      console.log('Details:', basicCheck.details);
    }
    
    // RPC function test
    if (sessionId) {  
      console.log('\n🔧 Testing RPC function...');
      const rpcCheck = await this.checkRPCFunction(sessionId);
      
      if (rpcCheck.isHealthy) {
        console.log('✅ RPC function: OK (' + rpcCheck.connectionTime + 'ms)');
        console.log('Results:', rpcCheck.details);
      } else {
        console.error('❌ RPC function: FAILED (' + rpcCheck.connectionTime + 'ms)');
        console.error('Error:', rpcCheck.error);
        console.log('Details:', rpcCheck.details);
      }
    }
    
    // Environment check
    console.log('\n🔍 Environment variables:');
    console.log('SUPABASE_URL:', process.env.REACT_APP_SUPABASE_URL ? 'SET' : 'NOT SET');
    console.log('SUPABASE_ANON_KEY:', process.env.REACT_APP_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
    
    console.groupEnd();
  }
}

// Create global functions for easy debugging
const healthChecker = SupabaseHealthChecker.getInstance();

// Make available globally
if (typeof window !== 'undefined') {
  (window as any).checkSupabaseHealth = (sessionId?: string) => {
    return healthChecker.diagnose(sessionId);
  };
  
  (window as any).testSupabaseConnection = () => {
    return healthChecker.checkConnection();
  };
}

export default healthChecker;