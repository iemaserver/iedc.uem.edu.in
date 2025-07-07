import { NextResponse } from 'next/server';

export interface ErrorLog {
  id: string;
  timestamp: string;
  level: 'error' | 'warn' | 'info';
  message: string;
  stack?: string;
  context?: Record<string, any>;
  userId?: string;
  url?: string;
  userAgent?: string;
  ip?: string;
}

class ErrorLogger {
  private logs: ErrorLog[] = [];
  private maxLogs = 1000; // Keep last 1000 logs in memory

  log(level: 'error' | 'warn' | 'info', message: string, context?: Record<string, any>) {
    const log: ErrorLog = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };

    this.logs.unshift(log);
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Log to console
    console[level](`[${log.timestamp}] ${message}`, context);

    // In production, you might want to send to external logging service
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalService(log);
    }
  }

  error(message: string, error?: Error, context?: Record<string, any>) {
    this.log('error', message, {
      ...context,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : undefined,
    });
  }

  warn(message: string, context?: Record<string, any>) {
    this.log('warn', message, context);
  }

  info(message: string, context?: Record<string, any>) {
    this.log('info', message, context);
  }

  getLogs(level?: 'error' | 'warn' | 'info', limit = 100): ErrorLog[] {
    let filteredLogs = this.logs;
    
    if (level) {
      filteredLogs = this.logs.filter(log => log.level === level);
    }
    
    return filteredLogs.slice(0, limit);
  }

  getErrorStats() {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);

    const last24hLogs = this.logs.filter(log => new Date(log.timestamp) >= last24h);
    const lastHourLogs = this.logs.filter(log => new Date(log.timestamp) >= lastHour);

    return {
      total: this.logs.length,
      last24h: {
        total: last24hLogs.length,
        errors: last24hLogs.filter(log => log.level === 'error').length,
        warnings: last24hLogs.filter(log => log.level === 'warn').length,
        info: last24hLogs.filter(log => log.level === 'info').length,
      },
      lastHour: {
        total: lastHourLogs.length,
        errors: lastHourLogs.filter(log => log.level === 'error').length,
        warnings: lastHourLogs.filter(log => log.level === 'warn').length,
        info: lastHourLogs.filter(log => log.level === 'info').length,
      },
    };
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private async sendToExternalService(log: ErrorLog) {
    // Implement external logging service integration here
    // Examples: Sentry, LogRocket, Datadog, etc.
    
    // Example for Sentry:
    // if (log.level === 'error') {
    //   Sentry.captureException(new Error(log.message), {
    //     extra: log.context,
    //     tags: {
    //       component: 'error-logger',
    //     },
    //   });
    // }
  }
}

// Singleton instance
export const errorLogger = new ErrorLogger();

// Express-like error handler for API routes
export const apiErrorHandler = (error: unknown, req?: Request): NextResponse => {
  const message = error instanceof Error ? error.message : 'Unknown error';
  const stack = error instanceof Error ? error.stack : undefined;
  
  const context = {
    url: req?.url,
    method: req?.method,
    headers: req ? Object.fromEntries(req.headers.entries()) : undefined,
  };

  errorLogger.error(message, error instanceof Error ? error : undefined, context);

  // Don't expose internal error details in production
  const isProduction = process.env.NODE_ENV === 'production';
  
  return NextResponse.json({
    error: isProduction ? 'Internal server error' : message,
    ...(isProduction ? {} : { stack }),
  }, { status: 500 });
};

// Client-side error boundary logger
export const logClientError = (error: Error, errorInfo?: any) => {
  const context = {
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    errorInfo,
  };

  errorLogger.error('Client-side error', error, context);
};

// Performance logger
export const logPerformance = (operation: string, duration: number, context?: Record<string, any>) => {
  const message = `Performance: ${operation} took ${duration}ms`;
  
  if (duration > 1000) {
    errorLogger.warn(message, context);
  } else {
    errorLogger.info(message, context);
  }
};

// Usage example:
// errorLogger.error('Database connection failed', dbError, { userId: '123' });
// errorLogger.warn('Slow query detected', { query: 'SELECT * FROM users', duration: 2000 });
// errorLogger.info('User logged in', { userId: '123', timestamp: new Date() });
