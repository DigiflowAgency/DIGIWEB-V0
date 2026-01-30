// Project Management Calculations (Burndown, Velocity, etc.)

import type {
  Sprint,
  Task,
  BurndownDataPoint,
  VelocityDataPoint
} from '@/types/projects';

// ============================================
// BURNDOWN CHART CALCULATIONS
// ============================================

/**
 * Generate burndown chart data for a sprint
 */
export function calculateBurndownData(
  sprint: Sprint,
  tasks: Task[],
  doneStatusIds: string[]
): BurndownDataPoint[] {
  const startDate = new Date(sprint.startDate);
  const endDate = new Date(sprint.endDate);
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const totalPoints = sprint.plannedPoints;

  const data: BurndownDataPoint[] = [];
  const today = new Date();

  // Get tasks completed by date
  const completedByDate: Record<string, number> = {};
  tasks.forEach(task => {
    if (task.completedAt && doneStatusIds.includes(task.statusId)) {
      const dateKey = new Date(task.completedAt).toISOString().split('T')[0];
      completedByDate[dateKey] = (completedByDate[dateKey] || 0) + (task.storyPoints || 0);
    }
  });

  let cumulativeCompleted = 0;

  for (let day = 0; day <= totalDays; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + day);
    const dateKey = currentDate.toISOString().split('T')[0];

    // Ideal burndown (linear)
    const ideal = totalPoints - (totalPoints / totalDays) * day;

    // Actual burndown
    cumulativeCompleted += completedByDate[dateKey] || 0;
    const actual = currentDate <= today ? totalPoints - cumulativeCompleted : null;

    data.push({
      date: dateKey,
      ideal: Math.max(0, Math.round(ideal * 10) / 10),
      actual: actual !== null ? Math.max(0, actual) : totalPoints - cumulativeCompleted,
      completed: cumulativeCompleted,
    });
  }

  return data;
}

/**
 * Generate burnup chart data for a sprint
 */
export function calculateBurnupData(
  sprint: Sprint,
  tasks: Task[],
  doneStatusIds: string[]
): BurndownDataPoint[] {
  const startDate = new Date(sprint.startDate);
  const endDate = new Date(sprint.endDate);
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const totalPoints = sprint.plannedPoints;

  const data: BurndownDataPoint[] = [];
  const today = new Date();

  // Get tasks completed by date
  const completedByDate: Record<string, number> = {};
  tasks.forEach(task => {
    if (task.completedAt && doneStatusIds.includes(task.statusId)) {
      const dateKey = new Date(task.completedAt).toISOString().split('T')[0];
      completedByDate[dateKey] = (completedByDate[dateKey] || 0) + (task.storyPoints || 0);
    }
  });

  let cumulativeCompleted = 0;

  for (let day = 0; day <= totalDays; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + day);
    const dateKey = currentDate.toISOString().split('T')[0];

    // Ideal burnup (linear)
    const ideal = (totalPoints / totalDays) * day;

    // Actual burnup
    cumulativeCompleted += completedByDate[dateKey] || 0;
    const actual = currentDate <= today ? cumulativeCompleted : null;

    data.push({
      date: dateKey,
      ideal: Math.round(ideal * 10) / 10,
      actual: actual !== null ? actual : cumulativeCompleted,
      completed: cumulativeCompleted,
    });
  }

  return data;
}

// ============================================
// VELOCITY CALCULATIONS
// ============================================

/**
 * Calculate velocity data from completed sprints
 */
export function calculateVelocityData(
  sprints: Sprint[]
): VelocityDataPoint[] {
  return sprints
    .filter(s => s.status === 'COMPLETED')
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .map(sprint => ({
      sprintName: sprint.name,
      planned: sprint.plannedPoints,
      completed: sprint.completedPoints,
    }));
}

/**
 * Calculate average velocity from completed sprints
 */
export function calculateAverageVelocity(sprints: Sprint[]): number {
  const completedSprints = sprints.filter(s => s.status === 'COMPLETED');
  if (completedSprints.length === 0) return 0;

  const totalCompleted = completedSprints.reduce((sum, s) => sum + s.completedPoints, 0);
  return Math.round(totalCompleted / completedSprints.length);
}

/**
 * Calculate velocity trend (last 3 sprints avg vs previous 3)
 */
export function calculateVelocityTrend(sprints: Sprint[]): {
  current: number;
  previous: number;
  trend: 'up' | 'down' | 'stable';
  percentChange: number;
} {
  const completedSprints = sprints
    .filter(s => s.status === 'COMPLETED')
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

  if (completedSprints.length < 2) {
    return { current: 0, previous: 0, trend: 'stable', percentChange: 0 };
  }

  const recent = completedSprints.slice(0, Math.min(3, completedSprints.length));
  const previous = completedSprints.slice(3, Math.min(6, completedSprints.length));

  const currentAvg = recent.reduce((sum, s) => sum + s.completedPoints, 0) / recent.length;
  const previousAvg = previous.length > 0
    ? previous.reduce((sum, s) => sum + s.completedPoints, 0) / previous.length
    : currentAvg;

  const percentChange = previousAvg > 0
    ? Math.round(((currentAvg - previousAvg) / previousAvg) * 100)
    : 0;

  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (percentChange > 5) trend = 'up';
  else if (percentChange < -5) trend = 'down';

  return {
    current: Math.round(currentAvg),
    previous: Math.round(previousAvg),
    trend,
    percentChange,
  };
}

// ============================================
// SPRINT PREDICTIONS
// ============================================

/**
 * Predict sprint completion based on current velocity
 */
export function predictSprintCompletion(
  sprint: Sprint,
  currentVelocity: number
): {
  onTrack: boolean;
  predictedCompletion: number;
  daysRemaining: number;
  requiredDailyPoints: number;
} {
  const startDate = new Date(sprint.startDate);
  const endDate = new Date(sprint.endDate);
  const now = new Date();

  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysElapsed = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, totalDays - daysElapsed);

  const pointsRemaining = sprint.plannedPoints - sprint.completedPoints;
  const dailyVelocity = daysElapsed > 0 ? sprint.completedPoints / daysElapsed : 0;

  const predictedCompletion = dailyVelocity > 0
    ? Math.round((sprint.completedPoints + dailyVelocity * daysRemaining))
    : sprint.completedPoints;

  const requiredDailyPoints = daysRemaining > 0
    ? Math.round(pointsRemaining / daysRemaining * 10) / 10
    : pointsRemaining;

  const onTrack = predictedCompletion >= sprint.plannedPoints * 0.9; // 90% threshold

  return {
    onTrack,
    predictedCompletion: Math.min(predictedCompletion, sprint.plannedPoints),
    daysRemaining,
    requiredDailyPoints,
  };
}

// ============================================
// PROJECT ESTIMATES
// ============================================

/**
 * Estimate project completion based on velocity and remaining work
 */
export function estimateProjectCompletion(
  totalPoints: number,
  completedPoints: number,
  velocity: number,
  sprintDurationDays: number = 14
): {
  remainingPoints: number;
  estimatedSprints: number;
  estimatedDays: number;
  estimatedDate: Date;
} {
  const remainingPoints = totalPoints - completedPoints;

  if (velocity <= 0 || remainingPoints <= 0) {
    return {
      remainingPoints,
      estimatedSprints: 0,
      estimatedDays: 0,
      estimatedDate: new Date(),
    };
  }

  const estimatedSprints = Math.ceil(remainingPoints / velocity);
  const estimatedDays = estimatedSprints * sprintDurationDays;
  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + estimatedDays);

  return {
    remainingPoints,
    estimatedSprints,
    estimatedDays,
    estimatedDate,
  };
}

// ============================================
// WORKLOAD DISTRIBUTION
// ============================================

/**
 * Calculate workload distribution by assignee
 */
export function calculateWorkloadByAssignee(
  tasks: Task[]
): Map<string | null, { count: number; points: number; hours: number }> {
  const workload = new Map<string | null, { count: number; points: number; hours: number }>();

  tasks.forEach(task => {
    const assigneeId = task.assigneeId ?? null;
    const current = workload.get(assigneeId) || { count: 0, points: 0, hours: 0 };

    workload.set(assigneeId, {
      count: current.count + 1,
      points: current.points + (task.storyPoints || 0),
      hours: current.hours + (task.estimatedHours || 0),
    });
  });

  return workload;
}

/**
 * Check if workload is balanced (no one has more than 150% of average)
 */
export function isWorkloadBalanced(
  workload: Map<string | null, { count: number; points: number; hours: number }>
): boolean {
  const values = Array.from(workload.values()).filter((_, k) => k !== null);
  if (values.length <= 1) return true;

  const avgPoints = values.reduce((sum, v) => sum + v.points, 0) / values.length;
  return values.every(v => v.points <= avgPoints * 1.5);
}

// ============================================
// CYCLE TIME CALCULATIONS
// ============================================

/**
 * Calculate average cycle time for tasks
 */
export function calculateAverageCycleTime(tasks: Task[]): number {
  const completedTasks = tasks.filter(t => t.completedAt && t.createdAt);

  if (completedTasks.length === 0) return 0;

  const totalDays = completedTasks.reduce((sum, task) => {
    const created = new Date(task.createdAt);
    const completed = new Date(task.completedAt!);
    const days = (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    return sum + days;
  }, 0);

  return Math.round(totalDays / completedTasks.length * 10) / 10;
}

/**
 * Calculate lead time (from request to completion)
 */
export function calculateLeadTime(tasks: Task[]): number {
  // Similar to cycle time but could include additional pre-work time
  return calculateAverageCycleTime(tasks);
}
