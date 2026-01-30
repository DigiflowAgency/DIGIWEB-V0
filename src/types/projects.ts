// Project Management Types

// ============================================
// ENUMS
// ============================================

export type ProjectType = 'WEB' | 'MOBILE' | 'ECOMMERCE' | 'SAAS' | 'BRANDING' | 'MARKETING' | 'OTHER';
export type ProjectStatus = 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'REVIEW' | 'COMPLETED' | 'CANCELLED' | 'ARCHIVED';
export type ProjectMemberRole = 'OWNER' | 'LEAD' | 'MEMBER' | 'VIEWER';
export type EpicStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
export type SprintStatus = 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type TaskType = 'STORY' | 'FEATURE' | 'TASK' | 'BUG' | 'IMPROVEMENT' | 'SUBTASK';
export type TaskPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type DependencyType = 'BLOCKS' | 'RELATES_TO' | 'DUPLICATES';

// ============================================
// USER (minimal for project relations)
// ============================================

export interface ProjectUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string | null;
}

// ============================================
// PROJECT
// ============================================

export interface Project {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  type: ProjectType;
  status: ProjectStatus;
  budget?: number | null;
  spent: number;
  currency: string;
  startDate?: string | null;
  endDate?: string | null;
  deadline?: string | null;
  clientId?: string | null;
  ownerId: string;
  aiGenerated: boolean;
  aiPrompt?: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
  // Relations
  client?: ProjectClient | null;
  owner?: ProjectUser;
  members?: ProjectMember[];
  labels?: ProjectLabel[];
  statuses?: ProjectCustomStatus[];
  _count?: {
    tasks: number;
    epics: number;
    sprints: number;
    members: number;
  };
}

export interface ProjectClient {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
}

export interface CreateProjectData {
  name: string;
  description?: string;
  type?: ProjectType;
  status?: ProjectStatus;
  budget?: number;
  currency?: string;
  startDate?: string;
  endDate?: string;
  deadline?: string;
  clientId?: string;
  aiGenerated?: boolean;
  aiPrompt?: string;
}

export interface UpdateProjectData extends Partial<CreateProjectData> {
  status?: ProjectStatus;
  spent?: number;
}

// ============================================
// PROJECT MEMBERS
// ============================================

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: ProjectMemberRole;
  joinedAt: string;
  user?: ProjectUser;
}

export interface AddMemberData {
  userId: string;
  role?: ProjectMemberRole;
}

// ============================================
// PROJECT LABELS
// ============================================

export interface ProjectLabel {
  id: string;
  projectId: string;
  name: string;
  color: string;
}

export interface CreateLabelData {
  name: string;
  color?: string;
}

// ============================================
// PROJECT CUSTOM STATUSES (Kanban Columns)
// ============================================

export interface ProjectCustomStatus {
  id: string;
  projectId: string;
  name: string;
  color: string;
  position: number;
  isDefault: boolean;
  isDone: boolean;
  _count?: {
    tasks: number;
  };
}

export interface CreateStatusData {
  name: string;
  color?: string;
  position?: number;
  isDefault?: boolean;
  isDone?: boolean;
}

export interface ReorderStatusesData {
  statusIds: string[];
}

// ============================================
// EPICS
// ============================================

export interface Epic {
  id: string;
  projectId: string;
  code: string;
  title: string;
  description?: string | null;
  color: string;
  status: EpicStatus;
  startDate?: string | null;
  endDate?: string | null;
  progress: number;
  aiGenerated: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    tasks: number;
  };
  tasks?: Task[];
}

export interface CreateEpicData {
  title: string;
  description?: string;
  color?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateEpicData extends Partial<CreateEpicData> {
  status?: EpicStatus;
}

// ============================================
// SPRINTS
// ============================================

export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  goal?: string | null;
  status: SprintStatus;
  startDate: string;
  endDate: string;
  plannedPoints: number;
  completedPoints: number;
  createdAt: string;
  updatedAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  _count?: {
    tasks: number;
  };
  tasks?: Task[];
  retrospective?: SprintRetrospective | null;
}

export interface CreateSprintData {
  name: string;
  goal?: string;
  startDate: string;
  endDate: string;
}

export interface UpdateSprintData extends Partial<CreateSprintData> {
  status?: SprintStatus;
  plannedPoints?: number;
}

export interface SprintRetrospective {
  id: string;
  sprintId: string;
  wentWell?: string | null;
  needsImprove?: string | null;
  actions?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRetrospectiveData {
  wentWell?: string;
  needsImprove?: string;
  actions?: string;
}

// ============================================
// BURNDOWN DATA
// ============================================

export interface BurndownDataPoint {
  date: string;
  ideal: number;
  actual: number;
  completed: number;
}

export interface VelocityDataPoint {
  sprintName: string;
  planned: number;
  completed: number;
}

// ============================================
// TASKS
// ============================================

export interface Task {
  id: string;
  projectId: string;
  epicId?: string | null;
  sprintId?: string | null;
  parentId?: string | null;
  statusId: string;
  code: string;
  type: TaskType;
  title: string;
  description?: string | null;
  acceptanceCriteria?: string | null;
  priority: TaskPriority;
  storyPoints?: number | null;
  estimatedHours?: number | null;
  loggedHours: number;
  startDate?: string | null;
  dueDate?: string | null;
  completedAt?: string | null;
  assigneeId?: string | null;
  reporterId: string;
  position: number;
  aiGenerated: boolean;
  aiEstimated: boolean;
  createdAt: string;
  updatedAt: string;
  // Relations
  project?: Project;
  epic?: Epic | null;
  sprint?: Sprint | null;
  parent?: Task | null;
  subtasks?: Task[];
  status?: ProjectCustomStatus;
  assignee?: ProjectUser | null;
  reporter?: ProjectUser;
  labels?: TaskLabel[];
  comments?: TaskComment[];
  attachments?: TaskAttachment[];
  timeEntries?: TimeEntry[];
  watchers?: TaskWatcher[];
  dependencies?: TaskDependency[];
  dependents?: TaskDependency[];
  _count?: {
    subtasks: number;
    comments: number;
    attachments: number;
  };
}

export interface CreateTaskData {
  title: string;
  type?: TaskType;
  description?: string;
  acceptanceCriteria?: string;
  priority?: TaskPriority;
  storyPoints?: number;
  estimatedHours?: number;
  startDate?: string;
  dueDate?: string;
  epicId?: string;
  sprintId?: string;
  parentId?: string;
  assigneeId?: string;
  labelIds?: string[];
}

export interface UpdateTaskData extends Partial<CreateTaskData> {
  statusId?: string;
  position?: number;
  loggedHours?: number;
}

export interface MoveTaskData {
  statusId?: string;
  sprintId?: string | null;
  position?: number;
}

// ============================================
// TASK LABELS
// ============================================

export interface TaskLabel {
  id: string;
  taskId: string;
  labelId: string;
  label?: ProjectLabel;
}

// ============================================
// TASK DEPENDENCIES
// ============================================

export interface TaskDependency {
  id: string;
  fromTaskId: string;
  toTaskId: string;
  type: DependencyType;
  fromTask?: Task;
  toTask?: Task;
}

export interface CreateDependencyData {
  toTaskId: string;
  type?: DependencyType;
}

// ============================================
// TASK COMMENTS
// ============================================

export interface TaskComment {
  id: string;
  taskId: string;
  authorId: string;
  content: string;
  parentId?: string | null;
  mentions?: string | null; // JSON array of user IDs
  createdAt: string;
  updatedAt: string;
  editedAt?: string | null;
  author?: ProjectUser;
  replies?: TaskComment[];
}

export interface CreateCommentData {
  content: string;
  parentId?: string;
  mentions?: string[];
}

export interface UpdateCommentData {
  content: string;
}

// ============================================
// TASK ATTACHMENTS
// ============================================

export interface TaskAttachment {
  id: string;
  taskId: string;
  name: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string;
  uploader?: ProjectUser;
}

// ============================================
// PROJECT ATTACHMENTS
// ============================================

export interface ProjectAttachment {
  id: string;
  projectId: string;
  name: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  category?: string | null;
  uploadedBy: string;
  uploadedAt: string;
  uploader?: ProjectUser;
}

// ============================================
// TIME ENTRIES
// ============================================

export interface TimeEntry {
  id: string;
  taskId: string;
  userId: string;
  hours: number;
  description?: string | null;
  date: string;
  createdAt: string;
  user?: ProjectUser;
}

export interface CreateTimeEntryData {
  hours: number;
  description?: string;
  date?: string;
}

// ============================================
// TASK HISTORY
// ============================================

export interface TaskHistoryEntry {
  id: string;
  taskId: string;
  userId: string;
  field: string;
  oldValue?: string | null;
  newValue?: string | null;
  createdAt: string;
  user?: ProjectUser;
}

// ============================================
// TASK WATCHERS
// ============================================

export interface TaskWatcher {
  id: string;
  taskId: string;
  userId: string;
  createdAt: string;
  user?: ProjectUser;
}

// ============================================
// KANBAN DATA
// ============================================

export interface KanbanColumn {
  id: string;
  name: string;
  color: string;
  position: number;
  isDefault: boolean;
  isDone: boolean;
  tasks: Task[];
}

export interface KanbanData {
  columns: KanbanColumn[];
  taskCount: number;
}

// ============================================
// BACKLOG DATA
// ============================================

export interface BacklogGroup {
  epic: Epic | null;
  tasks: Task[];
}

export interface BacklogData {
  groups: BacklogGroup[];
  unassignedTasks: Task[];
  totalTasks: number;
}

// ============================================
// TIMELINE/GANTT DATA
// ============================================

export interface TimelineTask {
  id: string;
  code: string;
  title: string;
  startDate: string;
  endDate: string;
  progress: number;
  type: TaskType;
  assignee?: ProjectUser | null;
  dependencies: string[]; // Task IDs that this task depends on
}

export interface TimelineData {
  tasks: TimelineTask[];
  epics: Epic[];
  minDate: string;
  maxDate: string;
}

// ============================================
// PROJECT STATS
// ============================================

export interface ProjectStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  progress: number;
  totalStoryPoints: number;
  completedStoryPoints: number;
  totalPoints?: number;
  completedPoints?: number;
  totalEpics: number;
  completedEpics: number;
  activeSprint?: Sprint | null;
  velocity: number;
  burndownData?: BurndownDataPoint[];
  tasksByStatus: { id?: string; status: string; name?: string; count: number; color: string }[];
  tasksByPriority: { priority: TaskPriority; count: number }[];
  tasksByAssignee: { user: ProjectUser | null; count: number }[];
  recentActivity: TaskHistoryEntry[];
}

// ============================================
// AI GENERATION
// ============================================

export interface AIGeneratedEpic {
  title: string;
  description: string;
  color?: string;
  stories: AIGeneratedTask[];
}

export interface AIGeneratedTask {
  title: string;
  description?: string;
  type: TaskType;
  priority?: TaskPriority;
  storyPoints?: number;
  acceptanceCriteria?: string;
  subtasks?: AIGeneratedTask[];
}

export interface AIGenerationRequest {
  prompt: string;
  projectType?: ProjectType;
  includeEstimates?: boolean;
}

export interface AIGenerationResponse {
  projectName?: string;
  projectDescription?: string;
  epics: AIGeneratedEpic[];
  estimatedTotalPoints?: number;
}

export interface AIEstimateRequest {
  taskTitle: string;
  taskDescription?: string;
  taskType?: TaskType;
}

export interface AIEstimateResponse {
  storyPoints: number;
  estimatedHours: number;
  confidence: number;
  reasoning: string;
}

// ============================================
// AI IMPORT (for existing projects)
// ============================================

export type AITaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export interface AIImportTask {
  title: string;
  description?: string;
  type: TaskType;
  priority: TaskPriority;
  storyPoints?: number;
  status: AITaskStatus;
  completedAt?: string; // ISO date if completed
  subtasks?: AIImportTask[];
}

export interface AIImportEpic {
  title: string;
  description?: string;
  color?: string;
  status: AITaskStatus;
  progress?: number; // 0-100 calculated
  tasks: AIImportTask[];
}

export interface AIImportStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
}

export interface AIImportResponse {
  projectName?: string;
  projectDescription?: string;
  projectProgress: number; // 0-100 global progress
  epics: AIImportEpic[];
  stats: AIImportStats;
  estimatedTotalPoints?: number;
}

export type AIGenerationMode = 'new' | 'import';

export interface AIGenerationRequestWithMode extends AIGenerationRequest {
  mode?: AIGenerationMode;
}

// ============================================
// API RESPONSES
// ============================================

export interface ProjectsResponse {
  projects: Project[];
  stats: {
    total: number;
    planning: number;
    inProgress: number;
    completed: number;
  };
}

export interface ProjectDetailResponse extends Project {
  members: ProjectMember[];
  labels: ProjectLabel[];
  statuses: ProjectCustomStatus[];
}

// ============================================
// PHASE 6: GITHUB & RELEASES
// ============================================

export type ReleaseStatus = 'DRAFT' | 'PUBLISHED';

export interface ProjectRepository {
  id: string;
  projectId: string;
  githubOwner: string;
  githubRepo: string;
  githubUrl: string;
  defaultBranch: string;
  accessToken?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectRelease {
  id: string;
  projectId: string;
  version: string;
  title: string;
  content: string;
  githubReleaseId?: string | null;
  githubReleaseUrl?: string | null;
  commitSha?: string | null;
  authorId: string;
  author?: ProjectUser;
  status: ReleaseStatus;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReleaseData {
  version: string;
  title: string;
  content: string;
  commitSha?: string;
}

export interface UpdateReleaseData extends Partial<CreateReleaseData> {
  status?: ReleaseStatus;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  author?: {
    login: string;
    avatar_url: string;
  } | null;
  html_url: string;
}

export interface GitHubPullRequest {
  number: number;
  title: string;
  state: string;
  user: {
    login: string;
    avatar_url: string;
  };
  created_at: string;
  merged_at?: string | null;
  html_url: string;
}

export interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  html_url: string;
}

export interface ConnectRepositoryData {
  githubOwner: string;
  githubRepo: string;
  accessToken?: string;
}

// ============================================
// PHASE 7: IMPROVEMENT PROPOSALS
// ============================================

export type ImprovementStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'INFO_REQUESTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'IMPLEMENTED';

export type ImprovementCategory =
  | 'UX'
  | 'PERFORMANCE'
  | 'FEATURE'
  | 'BUG_FIX'
  | 'SECURITY'
  | 'DOCUMENTATION'
  | 'OTHER';

export interface ImprovementProposal {
  id: string;
  code: string;
  projectId: string;
  authorId: string;
  author?: ProjectUser;
  title: string;
  description: string;
  context?: string | null;
  benefits?: string | null;
  status: ImprovementStatus;
  priority?: string | null;
  category?: string | null;
  reviewerId?: string | null;
  reviewer?: ProjectUser | null;
  reviewNote?: string | null;
  reviewedAt?: string | null;
  epicId?: string | null;
  epic?: Epic | null;
  submittedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  comments?: ImprovementComment[];
  votes?: ImprovementVote[];
  _count?: {
    comments: number;
    votes: number;
  };
  voteScore?: number;
}

export interface ImprovementComment {
  id: string;
  proposalId: string;
  authorId: string;
  author?: ProjectUser;
  content: string;
  isInternal: boolean;
  createdAt: string;
}

export interface ImprovementVote {
  id: string;
  proposalId: string;
  userId: string;
  user?: ProjectUser;
  value: number;
  createdAt: string;
}

export interface CreateImprovementData {
  title: string;
  description: string;
  context?: string;
  benefits?: string;
  priority?: string;
  category?: string;
}

export interface UpdateImprovementData extends Partial<CreateImprovementData> {
  status?: ImprovementStatus;
}

export interface ReviewImprovementData {
  action: 'approve' | 'reject' | 'request_info';
  reviewNote?: string;
}
