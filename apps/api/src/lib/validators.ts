import { z } from 'zod'

// ============================================
// Snippets Schemas
// ============================================

export const createSnippetSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(1000).optional(),
  instructions: z.string().optional(),
  language: z.string().min(1, 'Language is required'),
  isPublic: z.boolean().optional().default(false),
  tagIds: z.array(z.string()).optional(),
  files: z.array(z.object({
    filename: z.string().min(1, 'Filename is required'),
    content: z.string(),
    language: z.string().min(1, 'File language is required'),
    order: z.number().int().min(0).optional(),
  })).optional(),
  variables: z.array(z.object({
    name: z.string().min(1, 'Variable name is required'),
    defaultValue: z.string(),
    description: z.string().optional(),
    order: z.number().int().min(0).optional(),
  })).optional(),
})

export const updateSnippetSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional().nullable(),
  instructions: z.string().optional().nullable(),
  language: z.string().min(1).optional(),
  isPublic: z.boolean().optional(),
  isFavorite: z.boolean().optional(),
  tagIds: z.array(z.string()).optional(),
})

export const snippetQuerySchema = z.object({
  language: z.string().optional(),
  tag: z.string().optional(),
  favorite: z.string().optional().transform(val => val === 'true'),
  public: z.string().optional().transform(val => val === 'true'),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'title']).optional().default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 50),
  offset: z.string().optional().transform(val => val ? parseInt(val, 10) : 0),
})

// ============================================
// Files Schemas
// ============================================

export const createFileSchema = z.object({
  filename: z.string().min(1, 'Filename is required'),
  content: z.string(),
  language: z.string().min(1, 'Language is required'),
  order: z.number().int().min(0).optional(),
})

export const updateFileSchema = z.object({
  filename: z.string().min(1).optional(),
  content: z.string().optional(),
  language: z.string().min(1).optional(),
  order: z.number().int().min(0).optional(),
})

export const reorderFilesSchema = z.object({
  fileIds: z.array(z.string()).min(1, 'At least one file ID is required'),
})

// ============================================
// Variables Schemas
// ============================================

export const createVariableSchema = z.object({
  name: z.string().min(1, 'Variable name is required'),
  defaultValue: z.string(),
  description: z.string().optional(),
  order: z.number().int().min(0).optional(),
})

export const updateVariableSchema = z.object({
  name: z.string().min(1).optional(),
  defaultValue: z.string().optional(),
  description: z.string().optional().nullable(),
  order: z.number().int().min(0).optional(),
})

// ============================================
// Tags Schemas
// ============================================

export const createTagSchema = z.object({
  name: z.string().min(1, 'Tag name is required').max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
})

export const updateTagSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional().nullable(),
})

// ============================================
// Public/Explore Schemas
// ============================================

export const exploreQuerySchema = z.object({
  language: z.string().optional(),
  tag: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['starCount', 'createdAt', 'forkCount']).optional().default('starCount'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
  offset: z.string().optional().transform(val => val ? parseInt(val, 10) : 0),
})

export const usernameSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores'),
})

export const userSearchSchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 10),
})

// ============================================
// Type exports for use in route handlers
// ============================================

export type CreateSnippetInput = z.infer<typeof createSnippetSchema>
export type UpdateSnippetInput = z.infer<typeof updateSnippetSchema>
export type SnippetQueryInput = z.infer<typeof snippetQuerySchema>
export type CreateFileInput = z.infer<typeof createFileSchema>
export type UpdateFileInput = z.infer<typeof updateFileSchema>
export type ReorderFilesInput = z.infer<typeof reorderFilesSchema>
export type CreateVariableInput = z.infer<typeof createVariableSchema>
export type UpdateVariableInput = z.infer<typeof updateVariableSchema>
export type CreateTagInput = z.infer<typeof createTagSchema>
export type UpdateTagInput = z.infer<typeof updateTagSchema>
export type ExploreQueryInput = z.infer<typeof exploreQuerySchema>
export type UsernameInput = z.infer<typeof usernameSchema>
export type UserSearchInput = z.infer<typeof userSearchSchema>
