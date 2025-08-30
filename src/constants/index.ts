// Copyright Mark Skiba, 2025 All rights reserved

// Application constants
export const APP_CONSTANTS = {
  // UI Constants
  SIDEBAR_WIDTH: {
    EXPANDED: 300,
    COLLAPSED: 60
  },
  
  // Conversation Constants
  MAX_MESSAGE_HISTORY: 50,
  MESSAGE_PAGINATION_LIMIT: 20,
  MAX_MESSAGE_LENGTH: 8000,
  
  // Session Constants
  DEFAULT_SESSION_TITLE: 'New Conversation',
  MAX_SESSION_TITLE_LENGTH: 100,
  SESSION_CLEANUP_DAYS: 30,
  
  // API Constants
  CLAUDE_API: {
    DEFAULT_MODEL: 'claude-3-5-sonnet-20241022',
    MAX_TOKENS: 2000,
    DEFAULT_TEMPERATURE: 0.7,
    TIMEOUT_MS: 30000
  },
  
  // File Upload Constants
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['txt', 'md', 'json', 'csv'],
  
  // Cache Constants
  CACHE_EXPIRY: {
    SESSIONS: 5 * 60 * 1000, // 5 minutes
    AGENTS: 10 * 60 * 1000, // 10 minutes
    USER_PROFILE: 30 * 60 * 1000 // 30 minutes
  },
  
  // Error Messages
  ERROR_MESSAGES: {
    NETWORK_ERROR: 'Connection error. Please check your internet connection.',
    AUTH_REQUIRED: 'Please sign in to continue.',
    SESSION_NOT_FOUND: 'Session not found.',
    INVALID_INPUT: 'Invalid input. Please check your data.',
    SERVER_ERROR: 'Server error. Please try again later.',
    RATE_LIMIT: 'Too many requests. Please wait a moment.',
    FILE_TOO_LARGE: 'File is too large. Maximum size is 10MB.',
    UNSUPPORTED_FILE: 'Unsupported file type.'
  },
  
  // Success Messages
  SUCCESS_MESSAGES: {
    SESSION_CREATED: 'New session created successfully.',
    MESSAGE_SENT: 'Message sent successfully.',
    FILE_UPLOADED: 'File uploaded successfully.',
    SETTINGS_SAVED: 'Settings saved successfully.'
  },
  
  // Regex Patterns
  PATTERNS: {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    SESSION_ID: /^[a-zA-Z0-9_-]+$/
  },
  
  // Local Storage Keys
  STORAGE_KEYS: {
    USER_PREFERENCES: 'rfpez_user_preferences',
    DRAFT_MESSAGES: 'rfpez_draft_messages',
    RECENT_SESSIONS: 'rfpez_recent_sessions',
    AGENT_SELECTIONS: 'rfpez_agent_selections'
  },
  
  // Animation Durations (ms)
  ANIMATIONS: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500
  },
  
  // Breakpoints (px)
  BREAKPOINTS: {
    MOBILE: 768,
    TABLET: 1024,
    DESKTOP: 1200
  },
  
  // Z-Index Layers
  Z_INDEX: {
    DROPDOWN: 1000,
    MODAL: 1050,
    TOAST: 1100,
    TOOLTIP: 1200
  }
} as const;

// Type-safe constants for specific domains
export const AGENT_CONSTANTS = {
  DEFAULT_AGENT_ID: 'default',
  SYSTEM_AGENT_ID: 'system',
  MAX_AGENT_NAME_LENGTH: 50,
  MAX_AGENT_DESCRIPTION_LENGTH: 500
} as const;

export const MCP_CONSTANTS = {
  PROTOCOL_VERSION: '2024-11-05',
  SERVER_NAME: 'RFPEZ Supabase MCP Server',
  SERVER_VERSION: '1.0.0',
  MAX_FUNCTION_RETRIES: 3,
  FUNCTION_TIMEOUT_MS: 10000
} as const;

export const AUTH_CONSTANTS = {
  SESSION_TIMEOUT_HOURS: 24,
  REFRESH_THRESHOLD_MINUTES: 30,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MINUTES: 15
} as const;
