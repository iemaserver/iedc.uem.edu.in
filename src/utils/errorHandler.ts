import { NextResponse } from 'next/server';
import toast from 'react-hot-toast';

// Error types for better error handling
export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  CONFLICT_ERROR = 'CONFLICT_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
}

// Custom error class
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    type: ErrorType = ErrorType.INTERNAL_SERVER_ERROR,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.type = type;
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

// Predefined error creators
export const createValidationError = (message: string) =>
  new AppError(message, ErrorType.VALIDATION_ERROR, 400);

export const createAuthenticationError = (message: string = 'Authentication required') =>
  new AppError(message, ErrorType.AUTHENTICATION_ERROR, 401);

export const createAuthorizationError = (message: string = 'Insufficient permissions') =>
  new AppError(message, ErrorType.AUTHORIZATION_ERROR, 403);

export const createNotFoundError = (message: string = 'Resource not found') =>
  new AppError(message, ErrorType.NOT_FOUND_ERROR, 404);

export const createConflictError = (message: string) =>
  new AppError(message, ErrorType.CONFLICT_ERROR, 409);

export const createRateLimitError = (message: string = 'Rate limit exceeded') =>
  new AppError(message, ErrorType.RATE_LIMIT_ERROR, 429);

export const createDatabaseError = (message: string = 'Database operation failed') =>
  new AppError(message, ErrorType.DATABASE_ERROR, 500);

export const createExternalApiError = (message: string = 'External API error') =>
  new AppError(message, ErrorType.EXTERNAL_API_ERROR, 502);

// API Error Response Handler
export const handleApiError = (error: unknown): NextResponse => {
  // Log the error for debugging
  console.error('API Error:', error);

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.message,
        type: error.type,
        statusCode: error.statusCode,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
      },
      { status: error.statusCode }
    );
  }

  // Handle Prisma errors
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as { code: string; message: string };
    
    switch (prismaError.code) {
      case 'P2002': // Unique constraint violation
        return NextResponse.json(
          {
            error: 'A record with this information already exists',
            type: ErrorType.CONFLICT_ERROR,
            statusCode: 409,
          },
          { status: 409 }
        );
      
      case 'P2025': // Record not found
        return NextResponse.json(
          {
            error: 'The requested record was not found',
            type: ErrorType.NOT_FOUND_ERROR,
            statusCode: 404,
          },
          { status: 404 }
        );
      
      default:
        return NextResponse.json(
          {
            error: 'Database operation failed',
            type: ErrorType.DATABASE_ERROR,
            statusCode: 500,
          },
          { status: 500 }
        );
    }
  }

  // Handle Zod validation errors
  if (error && typeof error === 'object' && 'issues' in error) {
    const zodError = error as { issues: Array<{ message: string; path: string[] }> };
    const validationErrors = zodError.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));

    return NextResponse.json(
      {
        error: 'Validation failed',
        type: ErrorType.VALIDATION_ERROR,
        statusCode: 400,
        details: validationErrors,
      },
      { status: 400 }
    );
  }

  // Handle generic errors
  const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
  
  return NextResponse.json(
    {
      error: errorMessage,
      type: ErrorType.INTERNAL_SERVER_ERROR,
      statusCode: 500,
      ...(process.env.NODE_ENV === 'development' && { 
        stack: error instanceof Error ? error.stack : undefined 
      }),
    },
    { status: 500 }
  );
};

// Client-side error handler
export const handleClientError = (error: unknown, context?: string): void => {
  console.error(`Client Error${context ? ` in ${context}` : ''}:`, error);

  if (error instanceof AppError) {
    switch (error.type) {
      case ErrorType.VALIDATION_ERROR:
        toast.error(`Validation Error: ${error.message}`);
        break;
      case ErrorType.AUTHENTICATION_ERROR:
        toast.error('Please log in to continue');
        break;
      case ErrorType.AUTHORIZATION_ERROR:
        toast.error('You do not have permission to perform this action');
        break;
      case ErrorType.NOT_FOUND_ERROR:
        toast.error('The requested resource was not found');
        break;
      case ErrorType.CONFLICT_ERROR:
        toast.error(`Conflict: ${error.message}`);
        break;
      case ErrorType.RATE_LIMIT_ERROR:
        toast.error('Too many requests. Please try again later.');
        break;
      default:
        toast.error('An unexpected error occurred');
    }
    return;
  }

  // Handle Axios errors
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response: { data: { error: string; type: string } } };
    const errorData = axiosError.response?.data;
    
    if (errorData?.error) {
      toast.error(errorData.error);
      return;
    }
  }

  // Handle generic errors
  const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
  toast.error(errorMessage);
};

// Async error wrapper for API routes
export const withErrorHandling = (
  handler: (request: Request, context?: any) => Promise<NextResponse>
) => {
  return async (request: Request, context?: any): Promise<NextResponse> => {
    try {
      return await handler(request, context);
    } catch (error) {
      return handleApiError(error);
    }
  };
};

// Error boundary helper
export const logError = (error: Error, errorInfo?: any): void => {
  console.error('Error Boundary:', error);
  console.error('Error Info:', errorInfo);
  
  // In production, you might want to send this to an error tracking service
  if (process.env.NODE_ENV === 'production') {
    // Example: Sentry, LogRocket, etc.
    // Sentry.captureException(error, { extra: errorInfo });
  }
};

// Validation helpers
export const validateRequired = (value: any, fieldName: string): void => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    throw createValidationError(`${fieldName} is required`);
  }
};

export const validateEmail = (email: string): void => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw createValidationError('Invalid email format');
  }
};

export const validateUUID = (id: string, fieldName: string = 'ID'): void => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    throw createValidationError(`Invalid ${fieldName} format`);
  }
};

export const validateArrayLength = (array: any[], min: number, max: number, fieldName: string): void => {
  if (!Array.isArray(array)) {
    throw createValidationError(`${fieldName} must be an array`);
  }
  if (array.length < min) {
    throw createValidationError(`${fieldName} must have at least ${min} items`);
  }
  if (array.length > max) {
    throw createValidationError(`${fieldName} must have at most ${max} items`);
  }
};
