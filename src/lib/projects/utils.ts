// Project Management Utilities

import type {
  Project,
  Task,
  Epic,
  Sprint,
  ProjectStatus,
  EpicStatus,
  TaskPriority,
  TaskType
} from '@/types/projects';
import {
  PROJECT_STATUSES,
  EPIC_STATUSES,
  TASK_TYPES,
  TASK_PRIORITIES,
  PROJECT_TYPES
} from './constants';

// ============================================
// CODE GENERATION
// ============================================

/**
 * Generate a unique project code
 */
export function generateProjectCode(existingCodes: string[]): string {
  const prefix = 'PROJ';
  let maxNum = 0;

  existingCodes.forEach(code => {
    const match = code.match(/^PROJ-(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  });

  return `${prefix}-${String(maxNum + 1).padStart(3, '0')}`;
}

/**
 * Generate a unique epic code for a project
 */
export function generateEpicCode(projectCode: string, existingCodes: string[]): string {
  let maxNum = 0;

  existingCodes.forEach(code => {
    const match = code.match(/^EPIC-(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  });

  return `EPIC-${String(maxNum + 1).padStart(3, '0')}`;
}

/**
 * Generate a unique task code for a project
 */
export function generateTaskCode(projectCode: string, existingCodes: string[]): string {
  let maxNum = 0;
  const prefix = projectCode.split('-')[0] || 'TASK';

  existingCodes.forEach(code => {
    const match = code.match(/-(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  });

  return `${prefix}-${String(maxNum + 1).padStart(3, '0')}`;
}

// ============================================
// LABEL HELPERS
// ============================================

export function getProjectStatusLabel(status: ProjectStatus): string {
  return PROJECT_STATUSES.find(s => s.value === status)?.label || status;
}

export function getProjectStatusColor(status: ProjectStatus): string {
  return PROJECT_STATUSES.find(s => s.value === status)?.color || 'bg-gray-100 text-gray-700';
}

export function getProjectTypeLabel(type: string): string {
  return PROJECT_TYPES.find(t => t.value === type)?.label || type;
}

export function getEpicStatusLabel(status: EpicStatus): string {
  return EPIC_STATUSES.find(s => s.value === status)?.label || status;
}

export function getEpicStatusColor(status: EpicStatus): string {
  return EPIC_STATUSES.find(s => s.value === status)?.color || 'bg-gray-100 text-gray-700';
}

export function getTaskTypeLabel(type: TaskType): string {
  return TASK_TYPES.find(t => t.value === type)?.label || type;
}

export function getTaskTypeIcon(type: TaskType): string {
  return TASK_TYPES.find(t => t.value === type)?.icon || '✓';
}

export function getTaskTypeColor(type: TaskType): string {
  return TASK_TYPES.find(t => t.value === type)?.color || 'bg-gray-100 text-gray-700';
}

export function getTaskPriorityLabel(priority: TaskPriority): string {
  return TASK_PRIORITIES.find(p => p.value === priority)?.label || priority;
}

export function getTaskPriorityColor(priority: TaskPriority): string {
  return TASK_PRIORITIES.find(p => p.value === priority)?.color || 'bg-gray-100 text-gray-700';
}

export function getTaskPriorityIcon(priority: TaskPriority): string {
  return TASK_PRIORITIES.find(p => p.value === priority)?.icon || '⚪';
}

// ============================================
// PROGRESS CALCULATIONS
// ============================================

/**
 * Calculate epic progress based on its tasks
 */
export function calculateEpicProgress(tasks: Task[], doneStatusIds: string[]): number {
  if (tasks.length === 0) return 0;

  const completedTasks = tasks.filter(t => doneStatusIds.includes(t.statusId));
  return Math.round((completedTasks.length / tasks.length) * 100);
}

/**
 * Calculate project completion percentage
 */
export function calculateProjectProgress(tasks: Task[], doneStatusIds: string[]): number {
  if (tasks.length === 0) return 0;

  const completedTasks = tasks.filter(t => doneStatusIds.includes(t.statusId));
  return Math.round((completedTasks.length / tasks.length) * 100);
}

/**
 * Calculate sprint completion percentage by story points
 */
export function calculateSprintProgress(sprint: Sprint): number {
  if (sprint.plannedPoints === 0) return 0;
  return Math.round((sprint.completedPoints / sprint.plannedPoints) * 100);
}

// ============================================
// DATE HELPERS
// ============================================

/**
 * Format date for display
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format date for input fields
 */
export function formatDateForInput(date: string | Date | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

/**
 * Calculate days remaining until deadline
 */
export function getDaysRemaining(deadline: string | Date | null | undefined): number | null {
  if (!deadline) return null;
  const now = new Date();
  const d = new Date(deadline);
  const diff = d.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Check if a date is overdue
 */
export function isOverdue(date: string | Date | null | undefined): boolean {
  if (!date) return false;
  return new Date(date) < new Date();
}

/**
 * Get sprint day number (1-indexed)
 */
export function getSprintDay(sprint: Sprint): number {
  const start = new Date(sprint.startDate);
  const now = new Date();
  const diff = now.getTime() - start.getTime();
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Get sprint total days
 */
export function getSprintTotalDays(sprint: Sprint): number {
  const start = new Date(sprint.startDate);
  const end = new Date(sprint.endDate);
  const diff = end.getTime() - start.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ============================================
// SORTING
// ============================================

/**
 * Sort tasks by priority (critical first)
 */
export function sortByPriority(tasks: Task[]): Task[] {
  const priorityOrder: Record<TaskPriority, number> = {
    CRITICAL: 0,
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3,
  };

  return [...tasks].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

/**
 * Sort tasks by position within status column
 */
export function sortByPosition(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => a.position - b.position);
}

// ============================================
// FILTERING
// ============================================

/**
 * Filter tasks by search query
 */
export function filterTasksBySearch(tasks: Task[], query: string): Task[] {
  if (!query.trim()) return tasks;

  const lowerQuery = query.toLowerCase();
  return tasks.filter(task =>
    task.title.toLowerCase().includes(lowerQuery) ||
    task.code.toLowerCase().includes(lowerQuery) ||
    task.description?.toLowerCase().includes(lowerQuery)
  );
}

// ============================================
// AVATAR HELPERS
// ============================================

/**
 * Get initials from user name
 */
export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

/**
 * Get avatar color based on user ID (consistent colors)
 */
export function getAvatarColor(userId: string): string {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-orange-500',
    'bg-cyan-500',
  ];

  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

// ============================================
// BUDGET HELPERS
// ============================================

/**
 * Format currency
 */
export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Calculate budget remaining
 */
export function getBudgetRemaining(project: Project): number {
  if (!project.budget) return 0;
  return project.budget - project.spent;
}

/**
 * Get budget usage percentage
 */
export function getBudgetUsagePercent(project: Project): number {
  if (!project.budget || project.budget === 0) return 0;
  return Math.round((project.spent / project.budget) * 100);
}

// ============================================
// STORY POINTS HELPERS
// ============================================

/**
 * Get Fibonacci story points options
 */
export function getFibonacciPoints(): number[] {
  return [1, 2, 3, 5, 8, 13, 21, 34];
}

/**
 * Calculate total story points from tasks
 */
export function getTotalStoryPoints(tasks: Task[]): number {
  return tasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);
}

/**
 * Calculate completed story points
 */
export function getCompletedStoryPoints(tasks: Task[], doneStatusIds: string[]): number {
  return tasks
    .filter(t => doneStatusIds.includes(t.statusId))
    .reduce((sum, task) => sum + (task.storyPoints || 0), 0);
}

// ============================================
// MENTION PARSING
// ============================================

/**
 * Extract @mentions from text
 */
export function extractMentions(text: string): string[] {
  const matches = text.match(/@\[([^\]]+)\]\(([^)]+)\)/g) || [];
  return matches.map(match => {
    const idMatch = match.match(/\(([^)]+)\)/);
    return idMatch ? idMatch[1] : '';
  }).filter(Boolean);
}

/**
 * Replace @mentions with formatted text
 */
export function formatMentions(text: string): string {
  return text.replace(/@\[([^\]]+)\]\(([^)]+)\)/g, '<span class="mention">@$1</span>');
}
