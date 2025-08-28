// Enhanced logging service for RFPEZ.AI
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4
}

export interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  sessionId?: string;
  [key: string]: unknown;
}

class Logger {
  private level: LogLevel = process.env.NODE_ENV === 'production' ? LogLevel.WARN : LogLevel.DEBUG;
  private enableRemoteLogging = false; // Could send to external service

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, { ...context, error: error?.message, stack: error?.stack });
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (level < this.level) return;

    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];
    const formattedContext = context ? JSON.stringify(context) : '';

    // Console output for development
    if (process.env.NODE_ENV !== 'production') {
      const consoleMethod = this.getConsoleMethod(level);
      consoleMethod(`[${timestamp}] ${levelName}: ${message}`, formattedContext);
    }

    // Could add remote logging here
    if (this.enableRemoteLogging && level >= LogLevel.ERROR) {
      this.sendToRemoteService();
    }
  }

  private getConsoleMethod(level: LogLevel) {
    switch (level) {
      case LogLevel.DEBUG: return console.debug;
      case LogLevel.INFO: return console.info;
      case LogLevel.WARN: return console.warn;
      case LogLevel.ERROR: return console.error;
      default: return console.log;
    }
  }

  private async sendToRemoteService(): Promise<void> {
    // Implementation for remote logging service
    // Could integrate with services like LogRocket, Sentry, etc.
  }
}

export const logger = new Logger();
