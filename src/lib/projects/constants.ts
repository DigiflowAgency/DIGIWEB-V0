// Project Management Constants

import type {
  ProjectType,
  ProjectStatus,
  ProjectMemberRole,
  EpicStatus,
  SprintStatus,
  TaskType,
  TaskPriority,
  DependencyType
} from '@/types/projects';

// ============================================
// PROJECT TYPES
// ============================================

export const PROJECT_TYPES: { value: ProjectType; label: string; description: string }[] = [
  { value: 'WEB', label: 'Site Web', description: 'Site vitrine, institutionnel ou corporate' },
  { value: 'ECOMMERCE', label: 'E-commerce', description: 'Boutique en ligne, marketplace' },
  { value: 'MOBILE', label: 'Application Mobile', description: 'App iOS, Android ou hybride' },
  { value: 'SAAS', label: 'SaaS', description: 'Application web en mode SaaS' },
  { value: 'BRANDING', label: 'Branding', description: 'Identité visuelle, charte graphique' },
  { value: 'MARKETING', label: 'Marketing', description: 'Campagne marketing, SEO, Ads' },
  { value: 'OTHER', label: 'Autre', description: 'Autre type de projet' },
];

export const PROJECT_TYPE_COLORS: Record<ProjectType, string> = {
  WEB: 'bg-blue-100 text-blue-700',
  ECOMMERCE: 'bg-green-100 text-green-700',
  MOBILE: 'bg-purple-100 text-purple-700',
  SAAS: 'bg-indigo-100 text-indigo-700',
  BRANDING: 'bg-pink-100 text-pink-700',
  MARKETING: 'bg-orange-100 text-orange-700',
  OTHER: 'bg-gray-100 text-gray-700',
};

// ============================================
// PROJECT STATUSES
// ============================================

export const PROJECT_STATUSES: { value: ProjectStatus; label: string; color: string }[] = [
  { value: 'PLANNING', label: 'Planification', color: 'bg-gray-100 text-gray-700' },
  { value: 'IN_PROGRESS', label: 'En cours', color: 'bg-blue-100 text-blue-700' },
  { value: 'ON_HOLD', label: 'En pause', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'REVIEW', label: 'En revue', color: 'bg-purple-100 text-purple-700' },
  { value: 'COMPLETED', label: 'Terminé', color: 'bg-green-100 text-green-700' },
  { value: 'CANCELLED', label: 'Annulé', color: 'bg-red-100 text-red-700' },
  { value: 'ARCHIVED', label: 'Archivé', color: 'bg-slate-100 text-slate-700' },
];

// ============================================
// MEMBER ROLES
// ============================================

export const MEMBER_ROLES: { value: ProjectMemberRole; label: string; description: string }[] = [
  { value: 'OWNER', label: 'Propriétaire', description: 'Accès complet, peut supprimer le projet' },
  { value: 'LEAD', label: 'Lead', description: 'Peut gérer les sprints et assigner des tâches' },
  { value: 'MEMBER', label: 'Membre', description: 'Peut créer et modifier des tâches' },
  { value: 'VIEWER', label: 'Observateur', description: 'Accès en lecture seule' },
];

// ============================================
// EPIC STATUSES
// ============================================

export const EPIC_STATUSES: { value: EpicStatus; label: string; color: string }[] = [
  { value: 'TODO', label: 'À faire', color: 'bg-gray-100 text-gray-700' },
  { value: 'IN_PROGRESS', label: 'En cours', color: 'bg-blue-100 text-blue-700' },
  { value: 'DONE', label: 'Terminé', color: 'bg-green-100 text-green-700' },
  { value: 'CANCELLED', label: 'Annulé', color: 'bg-red-100 text-red-700' },
];

// ============================================
// SPRINT STATUSES
// ============================================

export const SPRINT_STATUSES: { value: SprintStatus; label: string; color: string }[] = [
  { value: 'PLANNING', label: 'Planification', color: 'bg-gray-100 text-gray-700' },
  { value: 'ACTIVE', label: 'Actif', color: 'bg-blue-100 text-blue-700' },
  { value: 'COMPLETED', label: 'Terminé', color: 'bg-green-100 text-green-700' },
  { value: 'CANCELLED', label: 'Annulé', color: 'bg-red-100 text-red-700' },
];

// ============================================
// TASK TYPES
// ============================================

export const TASK_TYPES: { value: TaskType; label: string; icon: string; color: string }[] = [
  { value: 'STORY', label: 'Story', icon: '📖', color: 'bg-green-100 text-green-700' },
  { value: 'FEATURE', label: 'Feature', icon: '✨', color: 'bg-purple-100 text-purple-700' },
  { value: 'TASK', label: 'Tâche', icon: '✓', color: 'bg-blue-100 text-blue-700' },
  { value: 'BUG', label: 'Bug', icon: '🐛', color: 'bg-red-100 text-red-700' },
  { value: 'IMPROVEMENT', label: 'Amélioration', icon: '📈', color: 'bg-orange-100 text-orange-700' },
  { value: 'SUBTASK', label: 'Sous-tâche', icon: '↳', color: 'bg-gray-100 text-gray-700' },
];

// ============================================
// TASK PRIORITIES
// ============================================

export const TASK_PRIORITIES: { value: TaskPriority; label: string; color: string; icon: string }[] = [
  { value: 'CRITICAL', label: 'Critique', color: 'bg-red-100 text-red-700', icon: '🔴' },
  { value: 'HIGH', label: 'Haute', color: 'bg-orange-100 text-orange-700', icon: '🟠' },
  { value: 'MEDIUM', label: 'Moyenne', color: 'bg-yellow-100 text-yellow-700', icon: '🟡' },
  { value: 'LOW', label: 'Basse', color: 'bg-green-100 text-green-700', icon: '🟢' },
];

// ============================================
// DEPENDENCY TYPES
// ============================================

export const DEPENDENCY_TYPES: { value: DependencyType; label: string; description: string }[] = [
  { value: 'BLOCKS', label: 'Bloque', description: 'Cette tâche bloque une autre tâche' },
  { value: 'RELATES_TO', label: 'Lié à', description: 'Cette tâche est liée à une autre' },
  { value: 'DUPLICATES', label: 'Duplique', description: 'Cette tâche est un doublon' },
];

// ============================================
// STORY POINTS (Fibonacci)
// ============================================

export const STORY_POINTS = [1, 2, 3, 5, 8, 13, 21, 34];

// ============================================
// DEFAULT KANBAN STATUSES
// ============================================

export const DEFAULT_KANBAN_STATUSES = [
  { name: 'À faire', color: '#E5E7EB', position: 0, isDefault: true, isDone: false },
  { name: 'En cours', color: '#93C5FD', position: 1, isDefault: false, isDone: false },
  { name: 'En revue', color: '#C4B5FD', position: 2, isDefault: false, isDone: false },
  { name: 'Terminé', color: '#86EFAC', position: 3, isDefault: false, isDone: true },
];

// ============================================
// DEFAULT LABELS
// ============================================

export const DEFAULT_LABELS = [
  { name: 'Frontend', color: '#3B82F6' },
  { name: 'Backend', color: '#10B981' },
  { name: 'Design', color: '#EC4899' },
  { name: 'Documentation', color: '#8B5CF6' },
  { name: 'Tests', color: '#F59E0B' },
  { name: 'DevOps', color: '#6366F1' },
];

// ============================================
// EPIC COLORS
// ============================================

export const EPIC_COLORS = [
  '#8B5CF6', // Violet
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#F97316', // Orange
];

// ============================================
// SPRINT DURATION OPTIONS
// ============================================

export const SPRINT_DURATIONS = [
  { value: 7, label: '1 semaine' },
  { value: 14, label: '2 semaines' },
  { value: 21, label: '3 semaines' },
  { value: 28, label: '4 semaines' },
];
