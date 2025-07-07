import { NextRequest, NextResponse } from 'next/server';
import { createRateLimitError } from './errorHandler';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (request: NextRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
}

interface RequestInfo {
  count: number;
  resetTime: number;
  requests: number[];
}

class InMemoryStore {
  private store = new Map<string, RequestInfo>();
  
  increment(key: string): RequestInfo {
    const now = Date.now();
    const current = this.store.get(key) || { count: 0, resetTime: now, requests: [] };
    
    // Clean up old requests outside the window
    const windowStart = now - this.getWindowMs();
    current.requests = current.requests.filter(time => time > windowStart);
    
    // Add current request
    current.requests.push(now);
    current.count = current.requests.length;
    current.resetTime = Math.max(current.resetTime, now + this.getWindowMs());
    
    this.store.set(key, current);
    return current;
  }
  
  private getWindowMs(): number {
    return 60 * 1000; // Default 1 minute
  }
  
  reset(key: string): void {
    this.store.delete(key);
  }
  
  // Clean up expired entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, info] of this.store.entries()) {
      if (info.resetTime < now) {
        this.store.delete(key);
      }
    }
  }
}

class RateLimiter {
  private store = new InMemoryStore();
  private config: Required<RateLimitConfig>;
  
  constructor(config: RateLimitConfig) {
    this.config = {
      windowMs: config.windowMs,
      maxRequests: config.maxRequests,
      keyGenerator: config.keyGenerator || this.defaultKeyGenerator,
      skipSuccessfulRequests: config.skipSuccessfulRequests || false,
      skipFailedRequests: config.skipFailedRequests || false,
      message: config.message || 'Too many requests, please try again later.',
    };
    
    // Cleanup expired entries every 5 minutes
    setInterval(() => this.store.cleanup(), 5 * 60 * 1000);
  }
  
  private defaultKeyGenerator(request: NextRequest): string {
    const ip = this.getClientIP(request);
    const userAgent = request.headers.get('user-agent') || '';
    return `${ip}:${userAgent}`;
  }
  
  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const real = request.headers.get('x-real-ip');
    const remote = request.headers.get('x-remote-addr');
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    return real || remote || 'unknown';
  }
  
  async checkLimit(request: NextRequest): Promise<{
    allowed: boolean;
    limit: number;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  }> {
    const key = this.config.keyGenerator(request);
    const info = this.store.increment(key);
    
    const allowed = info.count <= this.config.maxRequests;
    const remaining = Math.max(0, this.config.maxRequests - info.count);
    const retryAfter = allowed ? undefined : Math.ceil((info.resetTime - Date.now()) / 1000);
    
    return {
      allowed,
      limit: this.config.maxRequests,
      remaining,
      resetTime: info.resetTime,
      retryAfter,
    };
  }
  
  createResponse(result: Awaited<ReturnType<RateLimiter['checkLimit']>>): NextResponse | null {
    if (result.allowed) {
      return null; // Continue processing
    }
    
    const response = NextResponse.json(
      {
        error: this.config.message,
        limit: result.limit,
        remaining: result.remaining,
        resetTime: result.resetTime,
        retryAfter: result.retryAfter,
      },
      { status: 429 }
    );
    
    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', result.limit.toString());
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    response.headers.set('X-RateLimit-Reset', result.resetTime.toString());
    
    if (result.retryAfter) {
      response.headers.set('Retry-After', result.retryAfter.toString());
    }
    
    return response;
  }
}

// Predefined rate limiters for different use cases
export const rateLimiters = {
  // General API rate limit
  api: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Too many API requests, please try again later.',
  }),
  
  // Authentication rate limit (stricter)
  auth: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many authentication attempts, please try again later.',
  }),
  
  // File upload rate limit
  upload: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20,
    message: 'Too many file uploads, please try again later.',
  }),
  
  // Email sending rate limit
  email: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5,
    message: 'Too many emails sent, please try again later.',
  }),
  
  // Search rate limit
  search: new RateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 50,
    message: 'Too many search requests, please try again later.',
  }),
};

// Middleware wrapper for rate limiting
export const withRateLimit = (limiter: RateLimiter) => {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const result = await limiter.checkLimit(request);
    return limiter.createResponse(result);
  };
};

// Function to apply rate limiting to API routes
export const applyRateLimit = async (
  request: NextRequest,
  limiterType: keyof typeof rateLimiters = 'api'
): Promise<void> => {
  const limiter = rateLimiters[limiterType];
  const result = await limiter.checkLimit(request);
  
  if (!result.allowed) {
    throw createRateLimitError(`Rate limit exceeded. Try again in ${result.retryAfter} seconds.`);
  }
};

// Custom rate limiter for specific use cases
export const createCustomRateLimiter = (config: RateLimitConfig): RateLimiter => {
  return new RateLimiter(config);
};

// User-specific rate limiter (requires authentication)
export const createUserRateLimiter = (config: Omit<RateLimitConfig, 'keyGenerator'>) => {
  return new RateLimiter({
    ...config,
    keyGenerator: (request: NextRequest) => {
      const userId = request.headers.get('x-user-id');
      const ip = request.headers.get('x-forwarded-for') || 'unknown';
      return userId || ip;
    },
  });
};

// IP-based rate limiter
export const createIPRateLimiter = (config: Omit<RateLimitConfig, 'keyGenerator'>) => {
  return new RateLimiter({
    ...config,
    keyGenerator: (request: NextRequest) => {
      const forwarded = request.headers.get('x-forwarded-for');
      const real = request.headers.get('x-real-ip');
      
      if (forwarded) {
        return forwarded.split(',')[0].trim();
      }
      
      return real || 'unknown';
    },
  });
};

// Endpoint-specific rate limiter
export const createEndpointRateLimiter = (config: Omit<RateLimitConfig, 'keyGenerator'>) => {
  return new RateLimiter({
    ...config,
    keyGenerator: (request: NextRequest) => {
      const ip = request.headers.get('x-forwarded-for') || 'unknown';
      const pathname = new URL(request.url).pathname;
      return `${ip}:${pathname}`;
    },
  });
};

// Usage examples:
// In middleware:
// const rateLimitResponse = await withRateLimit(rateLimiters.api)(request);
// if (rateLimitResponse) return rateLimitResponse;

// In API routes:
// await applyRateLimit(request, 'auth');

// Custom rate limiter:
// const customLimiter = createCustomRateLimiter({
//   windowMs: 10 * 60 * 1000, // 10 minutes
//   maxRequests: 50,
//   message: 'Custom rate limit message',
// });
