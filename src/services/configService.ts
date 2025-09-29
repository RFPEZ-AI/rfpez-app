// Copyright Mark Skiba, 2025 All rights reserved

// Centralized configuration management
import { logger } from '../utils/logger';

export interface AppConfig {
  // API Configuration
  claudeApiKey: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  
  // Feature Flags
  enableDebugMode: boolean;
  enableMCPIntegration: boolean;
  enableOfflineMode: boolean;
  
  // App Settings
  environment: 'development' | 'staging' | 'production';
  appVersion: string;
  maxMessageHistory: number;
  defaultModel: string;
}

class ConfigService {
  private static instance: ConfigService;
  private config: AppConfig | null = null;

  static getInstance(): ConfigService {
    if (!this.instance) {
      this.instance = new ConfigService();
    }
    return this.instance;
  }

  getConfig(): AppConfig {
    if (!this.config) {
      this.config = this.loadConfig();
      this.validateConfig(this.config);
    }
    return this.config;
  }

  private loadConfig(): AppConfig {
    return {
      // API Configuration
      claudeApiKey: process.env.REACT_APP_CLAUDE_API_KEY || '',
      supabaseUrl: process.env.REACT_APP_SUPABASE_URL || '',
      supabaseAnonKey: process.env.REACT_APP_SUPABASE_ANON_KEY || '',
      
      // Feature Flags
      enableDebugMode: process.env.NODE_ENV === 'development' || process.env.REACT_APP_DEBUG === 'true',
      enableMCPIntegration: process.env.REACT_APP_ENABLE_MCP === 'true',
      enableOfflineMode: process.env.REACT_APP_ENABLE_OFFLINE === 'true',
      
      // App Settings
      environment: (process.env.NODE_ENV === 'production' ? 'production' : 'development') as 'development' | 'staging' | 'production',
      appVersion: process.env.REACT_APP_VERSION || '0.0.1',
      maxMessageHistory: parseInt(process.env.REACT_APP_MAX_MESSAGE_HISTORY || '50'),
      defaultModel: process.env.REACT_APP_DEFAULT_MODEL || 'claude-sonnet-4-20250514'
    };
  }

  private validateConfig(config: AppConfig): void {
    const errors: string[] = [];

    // Required in all environments
    if (!config.supabaseUrl) {
      errors.push('REACT_APP_SUPABASE_URL is required');
    }
    if (!config.supabaseAnonKey) {
      errors.push('REACT_APP_SUPABASE_ANON_KEY is required');
    }

    // Required in production
    if (config.environment === 'production') {
      if (!config.claudeApiKey || config.claudeApiKey === 'your_claude_api_key_here') {
        errors.push('REACT_APP_CLAUDE_API_KEY is required in production');
      }
    }

    if (errors.length > 0) {
      const message = `Configuration validation failed:\n${errors.join('\n')}`;
      logger.error('Configuration validation failed', new Error(message));
      
      if (config.environment === 'production') {
        throw new Error(message);
      } else {
        console.warn(message);
      }
    }
  }

  // Helper methods for common config access
  get isDevelopment(): boolean {
    return this.getConfig().environment === 'development';
  }

  get isProduction(): boolean {
    return this.getConfig().environment === 'production';
  }

  get isDebugEnabled(): boolean {
    return this.getConfig().enableDebugMode;
  }

  get claudeConfig() {
    const config = this.getConfig();
    return {
      apiKey: config.claudeApiKey,
      defaultModel: config.defaultModel,
      maxTokens: 2000,
      temperature: 0.7
    };
  }

  get supabaseConfig() {
    const config = this.getConfig();
    return {
      url: config.supabaseUrl,
      anonKey: config.supabaseAnonKey
    };
  }
}

// Export singleton instance
export const configService = ConfigService.getInstance();

// Export config getter for convenience
export const getConfig = () => configService.getConfig();
