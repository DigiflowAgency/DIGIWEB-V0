// Project Management Validators (Zod schemas)

import { z } from 'zod';

// ============================================
// ENUMS
// ============================================

export const projectTypeSchema = z.enum(['WEB', 'MOBILE', 'ECOMMERCE', 'SAAS', 'BRANDING', 'MARKETING', 'OTHER']);
export const projectStatusSchema = z.enum(['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'REVIEW', 'COMPLETED', 'CANCELLED', 'ARCHIVED']);
export const memberRoleSchema = z.enum(['OWNER', 'LEAD', 'MEMBER', 'VIEWER']);
export const epicStatusSchema = z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED']);
export const sprintStatusSchema = z.enum(['PLANNING', 'ACTIVE', 'COMPLETED', 'CANCELLED']);
export const taskTypeSchema = z.enum(['STORY', 'FEATURE', 'TASK', 'BUG', 'IMPROVEMENT', 'SUBTASK']);
export const taskPrioritySchema = z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']);
export const dependencyTypeSchema = z.enum(['BLOCKS', 'RELATES_TO', 'DUPLICATES']);

// ============================================
// PROJECT SCHEMAS
// ============================================

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Le nom du projet est requis').max(200),
  description: z.string().max(5000).optional().nullable(),
  type: projectTypeSchema.optional().default('WEB'),
  status: projectStatusSchema.optional().default('PLANNING'),
  budget: z.number().min(0).optional().nullable(),
  currency: z.string().max(3).optional().default('EUR'),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  deadline: z.string().datetime().optional().nullable(),
  clientId: z.string().optional().nullable(),
  aiGenerated: z.boolean().optional().default(false),
  aiPrompt: z.string().max(10000).optional().nullable(),
});

export const updateProjectSchema = createProjectSchema.partial().extend({
  status: projectStatusSchema.optional(),
  spent: z.number().min(0).optional(),
});

// ============================================
// MEMBER SCHEMAS
// ============================================

export const addMemberSchema = z.object({
  userId: z.string().min(1, 'L\'utilisateur est requis'),
  role: memberRoleSchema.optional().default('MEMBER'),
});

export const updateMemberSchema = z.object({
  role: memberRoleSchema,
});

// ============================================
// LABEL SCHEMAS
// ============================================

export const createLabelSchema = z.object({
  name: z.string().min(1, 'Le nom du label est requis').max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Couleur invalide').optional().default('#8B5CF6'),
});

export const updateLabelSchema = createLabelSchema.partial();

// ============================================
// STATUS SCHEMAS
// ============================================

export const createStatusSchema = z.object({
  name: z.string().min(1, 'Le nom du statut est requis').max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Couleur invalide').optional().default('#E5E7EB'),
  position: z.number().int().min(0).optional(),
  isDefault: z.boolean().optional().default(false),
  isDone: z.boolean().optional().default(false),
});

export const updateStatusSchema = createStatusSchema.partial();

export const reorderStatusesSchema = z.object({
  statusIds: z.array(z.string()).min(1),
});

// ============================================
// EPIC SCHEMAS
// ============================================

export const createEpicSchema = z.object({
  title: z.string().min(1, 'Le titre est requis').max(200),
  description: z.string().max(5000).optional().nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Couleur invalide').optional().default('#8B5CF6'),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
});

export const updateEpicSchema = createEpicSchema.partial().extend({
  status: epicStatusSchema.optional(),
});

// ============================================
// SPRINT SCHEMAS
// ============================================

export const createSprintSchema = z.object({
  name: z.string().min(1, 'Le nom du sprint est requis').max(100),
  goal: z.string().max(1000).optional().nullable(),
  startDate: z.string().datetime({ message: 'Date de début invalide' }),
  endDate: z.string().datetime({ message: 'Date de fin invalide' }),
}).refine(data => new Date(data.endDate) > new Date(data.startDate), {
  message: 'La date de fin doit être après la date de début',
  path: ['endDate'],
});

export const updateSprintSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  goal: z.string().max(1000).optional().nullable(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: sprintStatusSchema.optional(),
  plannedPoints: z.number().int().min(0).optional(),
});

export const createRetrospectiveSchema = z.object({
  wentWell: z.string().max(5000).optional().nullable(),
  needsImprove: z.string().max(5000).optional().nullable(),
  actions: z.string().max(5000).optional().nullable(),
});

// ============================================
// TASK SCHEMAS
// ============================================

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Le titre est requis').max(200),
  type: taskTypeSchema.optional().default('TASK'),
  description: z.string().max(10000).optional().nullable(),
  acceptanceCriteria: z.string().max(5000).optional().nullable(),
  priority: taskPrioritySchema.optional().default('MEDIUM'),
  storyPoints: z.number().int().min(0).max(100).optional().nullable(),
  estimatedHours: z.number().min(0).max(1000).optional().nullable(),
  startDate: z.string().datetime().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  epicId: z.string().optional().nullable(),
  sprintId: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  labelIds: z.array(z.string()).optional(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  statusId: z.string().optional(),
  position: z.number().int().min(0).optional(),
  loggedHours: z.number().min(0).optional(),
});

export const moveTaskSchema = z.object({
  statusId: z.string().optional(),
  sprintId: z.string().optional().nullable(),
  position: z.number().int().min(0).optional(),
});

// ============================================
// DEPENDENCY SCHEMAS
// ============================================

export const createDependencySchema = z.object({
  toTaskId: z.string().min(1, 'La tâche cible est requise'),
  type: dependencyTypeSchema.optional().default('BLOCKS'),
});

// ============================================
// COMMENT SCHEMAS
// ============================================

export const createCommentSchema = z.object({
  content: z.string().min(1, 'Le contenu est requis').max(10000),
  parentId: z.string().optional().nullable(),
  mentions: z.array(z.string()).optional(),
});

export const updateCommentSchema = z.object({
  content: z.string().min(1, 'Le contenu est requis').max(10000),
});

// ============================================
// TIME ENTRY SCHEMAS
// ============================================

export const createTimeEntrySchema = z.object({
  hours: z.number().min(0.25).max(24),
  description: z.string().max(500).optional().nullable(),
  date: z.string().datetime().optional(),
});

// ============================================
// AI GENERATION SCHEMAS
// ============================================

export const aiGenerationModeSchema = z.enum(['new', 'import']);

export const aiGenerationSchema = z.object({
  prompt: z.string().min(10, 'Description trop courte').max(5000),
  projectType: projectTypeSchema.optional(),
  includeEstimates: z.boolean().optional().default(true),
  mode: aiGenerationModeSchema.optional().default('new'),
});

export const aiEstimateSchema = z.object({
  taskTitle: z.string().min(1).max(200),
  taskDescription: z.string().max(5000).optional(),
  taskType: taskTypeSchema.optional(),
});

// ============================================
// QUERY PARAMS SCHEMAS
// ============================================

export const projectsQuerySchema = z.object({
  search: z.string().optional(),
  status: projectStatusSchema.optional(),
  type: projectTypeSchema.optional(),
  ownerId: z.string().optional(),
  clientId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export const tasksQuerySchema = z.object({
  search: z.string().optional(),
  statusId: z.string().optional(),
  epicId: z.string().optional(),
  sprintId: z.string().optional(),
  assigneeId: z.string().optional(),
  priority: taskPrioritySchema.optional(),
  type: taskTypeSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});
