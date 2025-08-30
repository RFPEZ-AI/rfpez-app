// Copyright Mark Skiba, 2025 All rights reserved

// Utility for development-only console logging
// This helps avoid ESLint no-console errors in production builds

export const devLog = {
  log: (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(...args);
    }
  },
  
  error: (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.error(...args);
    }
  },
  
  warn: (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(...args);
    }
  },
  
  info: (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.info(...args);
    }
  }
};
