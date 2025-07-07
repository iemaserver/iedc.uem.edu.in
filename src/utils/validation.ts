import { z } from 'zod';
import { createValidationError } from './errorHandler';

// Common validation schemas
export const commonSchemas = {
  id: z.string().uuid('Invalid ID format'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  url: z.string().url('Invalid URL format'),
  dateString: z.string().refine(
    (date) => !isNaN(Date.parse(date)),
    'Invalid date format'
  ),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 10),
  tags: z.array(z.string()).min(1, 'At least one tag is required'),
  userType: z.enum(['STUDENT', 'FACULTY', 'ADMIN']),
  projectStatus: z.enum(['UPLOAD', 'PUBLISH', 'ONGOING', 'COMPLETED', 'CANCELLED']),
  reviewerStatus: z.enum(['ACCEPTED', 'REJECTED', 'PENDING', 'ONGOING', 'ACCEPTED_FOR_PUBLISH', 'REJECTED_FOR_PUBLISH', 'NEEDS_UPDATES']),
  paperStatus: z.enum(['UPLOAD', 'ON_REVIEW', 'PUBLISH', 'REJECT']),
};

// User validation schemas
export const userSchemas = {
  signup: z.object({
    name: commonSchemas.name,
    email: commonSchemas.email,
    password: commonSchemas.password,
    userType: commonSchemas.userType,
    degree: z.string().optional(),
    year: commonSchemas.year.optional(),
    department: z.string().optional(),
    university: z.string().optional(),
    areaOfInterest: z.array(z.string()).optional(),
    position: z.string().optional(),
  }),
  
  update: z.object({
    name: commonSchemas.name.optional(),
    degree: z.string().optional(),
    year: commonSchemas.year.optional(),
    department: z.string().optional(),
    university: z.string().optional(),
    areaOfInterest: z.array(z.string()).optional(),
    position: z.string().optional(),
    facultyAcademicDetails: z.string().optional(),
    facultyResearchInterests: z.string().optional(),
    profileImage: z.string().optional(),
  }),
};

// Research paper validation schemas
export const paperSchemas = {
  create: z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
    abstract: z.string().min(1, 'Abstract is required').max(2000, 'Abstract too long'),
    filePath: z.string().min(1, 'File path is required'),
    keywords: commonSchemas.tags,
    facultyAdvisors: z.array(commonSchemas.id).min(1, 'At least one faculty advisor is required'),
  }),
  
  update: z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
    abstract: z.string().min(1, 'Abstract is required').max(2000, 'Abstract too long').optional(),
    filePath: z.string().optional(),
    keywords: commonSchemas.tags.optional(),
    status: commonSchemas.paperStatus.optional(),
    reviewerStatus: commonSchemas.reviewerStatus.optional(),
    reviewerId: commonSchemas.id.optional(),
  }),
};

// Ongoing project validation schemas
export const projectSchemas = {
  create: z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
    description: z.string().min(1, 'Description is required').max(2000, 'Description too long'),
    projectType: z.string().min(1, 'Project type is required'),
    projectTags: commonSchemas.tags,
    members: z.array(commonSchemas.id).min(1, 'At least one member is required'),
    facultyAdvisors: z.array(commonSchemas.id).min(1, 'At least one faculty advisor is required'),
    startDate: commonSchemas.dateString,
    endDate: commonSchemas.dateString.optional(),
    projectLink: commonSchemas.url.optional(),
    projectImage: z.string().optional(),
    reviewerId: commonSchemas.id.optional(),
  }),
  
  update: z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
    description: z.string().min(1, 'Description is required').max(2000, 'Description too long').optional(),
    projectType: z.string().optional(),
    projectTags: commonSchemas.tags.optional(),
    projectLink: commonSchemas.url.optional(),
    projectImage: z.string().optional(),
    status: commonSchemas.projectStatus.optional(),
    reviewerStatus: commonSchemas.reviewerStatus.optional(),
    reviewerId: commonSchemas.id.optional(),
    endDate: commonSchemas.dateString.optional(),
  }),
  
  studentUpdate: z.object({
    projectId: commonSchemas.id,
    studentUpdateComments: z.string().min(1, 'Update comments are required'),
    projectLink: commonSchemas.url.optional(),
    projectImage: z.string().optional(),
    description: z.string().optional(),
  }),
  
  reviewerFlag: z.object({
    projectId: commonSchemas.id,
    updateRequest: z.string().min(1, 'Update request is required'),
    updateDeadline: commonSchemas.dateString.optional(),
  }),
};

// Achievement validation schemas
export const achievementSchemas = {
  create: z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
    description: z.string().min(1, 'Description is required').max(2000, 'Description too long'),
    category: z.string().min(1, 'Category is required'),
    userId: commonSchemas.id,
    achievementDate: commonSchemas.dateString,
    image: z.string().optional(),
    tags: z.array(z.string()).optional(),
    homePageVisibility: z.boolean().optional(),
  }),
  
  update: z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
    description: z.string().min(1, 'Description is required').max(2000, 'Description too long').optional(),
    category: z.string().min(1, 'Category is required').optional(),
    achievementDate: commonSchemas.dateString.optional(),
    image: z.string().optional(),
    tags: z.array(z.string()).optional(),
    homePageVisibility: z.boolean().optional(),
    rejectionReason: z.string().optional(),
  }),
};

// Query parameter validation schemas
export const querySchemas = {
  pagination: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
  }),
  
  search: z.object({
    query: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    filter: z.record(z.string()).optional(),
  }),
  
  paperQuery: z.object({
    status: commonSchemas.paperStatus.optional(),
    reviewerStatus: commonSchemas.reviewerStatus.optional(),
    reviewer: commonSchemas.id.optional(),
    author: commonSchemas.id.optional(),
  }),
  
  projectQuery: z.object({
    status: commonSchemas.projectStatus.optional(),
    reviewerStatus: commonSchemas.reviewerStatus.optional(),
    reviewer: commonSchemas.id.optional(),
    member: commonSchemas.id.optional(),
  }),
};

// Validation helper functions
export const validateAndParse = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message,
      }));
      throw createValidationError(`Validation failed: ${formattedErrors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
};

export const validateQueryParams = (searchParams: URLSearchParams, schema: z.ZodSchema) => {
  const params = Object.fromEntries(searchParams.entries());
  return validateAndParse(schema, params);
};

export const validateRequestBody = async (request: Request, schema: z.ZodSchema) => {
  try {
    const body = await request.json();
    return validateAndParse(schema, body);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw createValidationError('Invalid JSON format');
    }
    throw error;
  }
};

// File validation
export const validateFile = (file: File, options: {
  maxSize?: number;
  allowedTypes?: string[];
  maxFiles?: number;
} = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    maxFiles = 1,
  } = options;

  if (file.size > maxSize) {
    throw createValidationError(`File size must be less than ${maxSize / (1024 * 1024)}MB`);
  }

  if (!allowedTypes.includes(file.type)) {
    throw createValidationError(`File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`);
  }

  return true;
};

// Custom validation rules
export const customValidations = {
  isValidAcademicYear: (year: number) => {
    const currentYear = new Date().getFullYear();
    return year >= 1900 && year <= currentYear + 10;
  },
  
  isValidUniversityEmail: (email: string) => {
    // Add your university email validation logic here
    return email.includes('@') && email.length > 5;
  },
  
  isValidProjectDuration: (startDate: string, endDate?: string) => {
    if (!endDate) return true;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return end > start;
  },
  
  isValidTagFormat: (tags: string[]) => {
    return tags.every(tag => tag.length > 0 && tag.length <= 50);
  },
};

// Usage examples:
// const userData = validateAndParse(userSchemas.signup, requestBody);
// const queryParams = validateQueryParams(new URL(request.url).searchParams, querySchemas.pagination);
// validateFile(uploadedFile, { maxSize: 10 * 1024 * 1024, allowedTypes: ['image/jpeg', 'image/png'] });
