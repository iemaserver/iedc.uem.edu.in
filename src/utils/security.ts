import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Security headers configuration
export const securityHeaders = {
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  
  // Enable XSS protection
  'X-XSS-Protection': '1; mode=block',
  
  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // HSTS (HTTPS only)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  
  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    "frame-ancestors 'none'",
  ].join('; '),
  
  // Permissions policy
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'interest-cohort=()',
  ].join(', '),
};

// Apply security headers to response
export const applySecurityHeaders = (response: NextResponse): NextResponse => {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
};

// CSRF Protection
class CSRFProtection {
  private tokens = new Map<string, { token: string; expires: number }>();
  private secret: string;
  
  constructor() {
    this.secret = process.env.CSRF_SECRET || 'default-csrf-secret-change-in-production';
    
    // Clean up expired tokens every hour
    setInterval(() => this.cleanupExpiredTokens(), 60 * 60 * 1000);
  }
  
  generateToken(sessionId: string): string {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
    
    this.tokens.set(sessionId, { token, expires });
    return token;
  }
  
  validateToken(sessionId: string, token: string): boolean {
    const storedToken = this.tokens.get(sessionId);
    
    if (!storedToken || Date.now() > storedToken.expires) {
      this.tokens.delete(sessionId);
      return false;
    }
    
    return storedToken.token === token;
  }
  
  private cleanupExpiredTokens(): void {
    const now = Date.now();
    for (const [sessionId, tokenData] of this.tokens.entries()) {
      if (now > tokenData.expires) {
        this.tokens.delete(sessionId);
      }
    }
  }
}

export const csrfProtection = new CSRFProtection();

// Input sanitization
export const sanitizeInput = {
  // Remove potentially dangerous characters
  removeXSS: (input: string): string => {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  },
  
  // Sanitize HTML content
  sanitizeHTML: (input: string): string => {
    const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'i', 'b'];
    const tagRegex = /<\/?([a-zA-Z0-9]+)[^>]*>/g;
    
    return input.replace(tagRegex, (match, tag) => {
      return allowedTags.includes(tag.toLowerCase()) ? match : '';
    });
  },
  
  // Sanitize SQL input (basic)
  sanitizeSQL: (input: string): string => {
    return input
      .replace(/['";\\]/g, '')
      .replace(/--/g, '')
      .replace(/\/\*/g, '')
      .replace(/\*\//g, '');
  },
  
  // Sanitize file names
  sanitizeFileName: (fileName: string): string => {
    return fileName
      .replace(/[^a-zA-Z0-9._-]/g, '')
      .replace(/\.{2,}/g, '.')
      .substring(0, 255);
  },
};

// Request validation
export const validateRequest = {
  // Check if request has valid content type
  hasValidContentType: (request: NextRequest, allowedTypes: string[]): boolean => {
    const contentType = request.headers.get('content-type');
    if (!contentType) return false;
    
    return allowedTypes.some(type => contentType.includes(type));
  },
  
  // Check if request size is within limits
  hasValidSize: (request: NextRequest, maxSize: number): boolean => {
    const contentLength = request.headers.get('content-length');
    if (!contentLength) return true; // Unknown size, let it through
    
    return parseInt(contentLength, 10) <= maxSize;
  },
  
  // Check if request has required headers
  hasRequiredHeaders: (request: NextRequest, requiredHeaders: string[]): boolean => {
    return requiredHeaders.every(header => request.headers.has(header));
  },
  
  // Validate origin for CORS
  hasValidOrigin: (request: NextRequest, allowedOrigins: string[]): boolean => {
    const origin = request.headers.get('origin');
    if (!origin) return true; // Same-origin request
    
    return allowedOrigins.includes(origin);
  },
};

// Security utilities
export const securityUtils = {
  // Generate secure random string
  generateSecureToken: (length: number = 32): string => {
    return crypto.randomBytes(length).toString('hex');
  },
  
  // Hash sensitive data
  hashData: (data: string, salt?: string): string => {
    const actualSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(data, actualSalt, 10000, 64, 'sha512');
    return `${actualSalt}:${hash.toString('hex')}`;
  },
  
  // Verify hashed data
  verifyHash: (data: string, hash: string): boolean => {
    const [salt, originalHash] = hash.split(':');
    const newHash = crypto.pbkdf2Sync(data, salt, 10000, 64, 'sha512');
    return originalHash === newHash.toString('hex');
  },
  
  // Encrypt sensitive data
  encrypt: (text: string, secret?: string): string => {
    const key = secret || process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-cbc', key);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return `${iv.toString('hex')}:${encrypted}`;
  },
  
  // Decrypt sensitive data
  decrypt: (encryptedText: string, secret?: string): string => {
    const key = secret || process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
    const [ivHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipher('aes-256-cbc', key);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  },
  
  // Generate API key
  generateAPIKey: (): string => {
    return `iedc_${crypto.randomBytes(32).toString('hex')}`;
  },
  
  // Validate API key format
  isValidAPIKey: (apiKey: string): boolean => {
    return /^iedc_[a-f0-9]{64}$/.test(apiKey);
  },
};

// IP whitelist/blacklist management
class IPFilter {
  private whitelist = new Set<string>();
  private blacklist = new Set<string>();
  
  addToWhitelist(ip: string): void {
    this.whitelist.add(ip);
  }
  
  addToBlacklist(ip: string): void {
    this.blacklist.add(ip);
  }
  
  removeFromWhitelist(ip: string): void {
    this.whitelist.delete(ip);
  }
  
  removeFromBlacklist(ip: string): void {
    this.blacklist.delete(ip);
  }
  
  isAllowed(ip: string): boolean {
    if (this.blacklist.has(ip)) return false;
    if (this.whitelist.size === 0) return true;
    return this.whitelist.has(ip);
  }
  
  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const real = request.headers.get('x-real-ip');
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    return real || 'unknown';
  }
  
  checkRequest(request: NextRequest): boolean {
    const ip = this.getClientIP(request);
    return this.isAllowed(ip);
  }
}

export const ipFilter = new IPFilter();

// Security middleware wrapper
export const withSecurity = (options: {
  enableCSRF?: boolean;
  enableIPFilter?: boolean;
  maxRequestSize?: number;
  allowedContentTypes?: string[];
} = {}) => {
  const {
    enableCSRF = false,
    enableIPFilter = false,
    maxRequestSize = 10 * 1024 * 1024, // 10MB
    allowedContentTypes = ['application/json', 'multipart/form-data'],
  } = options;
  
  return async (request: NextRequest): Promise<NextResponse | null> => {
    // Check IP filter
    if (enableIPFilter && !ipFilter.checkRequest(request)) {
      return new NextResponse('Forbidden', { status: 403 });
    }
    
    // Check request size
    if (!validateRequest.hasValidSize(request, maxRequestSize)) {
      return new NextResponse('Request too large', { status: 413 });
    }
    
    // Check content type for POST/PUT requests
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      if (!validateRequest.hasValidContentType(request, allowedContentTypes)) {
        return new NextResponse('Invalid content type', { status: 415 });
      }
    }
    
    // CSRF protection for state-changing requests
    if (enableCSRF && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      const csrfToken = request.headers.get('x-csrf-token');
      const sessionId = request.headers.get('x-session-id');
      
      if (!csrfToken || !sessionId || !csrfProtection.validateToken(sessionId, csrfToken)) {
        return new NextResponse('Invalid CSRF token', { status: 403 });
      }
    }
    
    return null; // Continue processing
  };
};

// Usage examples:
// Apply security headers: applySecurityHeaders(response)
// Sanitize input: sanitizeInput.removeXSS(userInput)
// Generate token: securityUtils.generateSecureToken()
// Use security middleware: const securityResponse = await withSecurity(options)(request)
