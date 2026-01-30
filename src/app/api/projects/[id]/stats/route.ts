import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateAverageVelocity } from '@/lib/projects/calculations';

// GET /api/projects/[id]/stats - Get project statistics
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;

    // Get done status IDs
    const doneStatuses = await prisma.project_statuses.findMany({
      where: { projectId: id, isDone: true },
      select: { id: true },
    });
    const doneStatusIds = doneStatuses.map(s => s.id);

    // Get all statuses with task counts
    const statuses = await prisma.project_statuses.findMany({
      where: { projectId: id },
      orderBy: { position: 'asc' },
      include: {
        _count: { select: { tasks: true } },
      },
    });

    // Get tasks
    const tasks = await prisma.tasks.findMany({
      where: { projectId: id, parentId: null },
      select: {
        id: true,
        statusId: true,
        priority: true,
        storyPoints: true,
        assigneeId: true,
      },
    });

    // Get epics
    const epics = await prisma.epics.findMany({
      where: { projectId: id },
      select: { id: true, status: true },
    });

    // Get active sprint
    const activeSprint = await prisma.sprints.findFirst({
      where: { projectId: id, status: 'ACTIVE' },
      include: { _count: { select: { tasks: true } } },
    });

    // Get completed sprints for velocity
    const completedSprints = await prisma.sprints.findMany({
      where: { projectId: id, status: 'COMPLETED' },
      orderBy: { completedAt: 'desc' },
      take: 5,
    });

    // Get recent activity
    const recentActivity = await prisma.task_history.findMany({
      where: { task: { projectId: id } },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
        task: { select: { code: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Calculate stats
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => doneStatusIds.includes(t.statusId)).length;
    const totalStoryPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    const completedStoryPoints = tasks
      .filter(t => doneStatusIds.includes(t.statusId))
      .reduce((sum, t) => sum + (t.storyPoints || 0), 0);

    const totalEpics = epics.length;
    const completedEpics = epics.filter(e => e.status === 'DONE').length;

    // Convert sprints for type compatibility (function only uses status and completedPoints)
    const velocity = calculateAverageVelocity(completedSprints as any);

    // Tasks by status
    const tasksByStatus = statuses.map(s => ({
      status: s.name,
      count: s._count.tasks,
      color: s.color,
    }));

    // Tasks by priority
    const priorities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const;
    const tasksByPriority = priorities.map(priority => ({
      priority,
      count: tasks.filter(t => t.priority === priority).length,
    }));

    // Tasks by assignee
    const assigneeIds = Array.from(new Set(tasks.map(t => t.assigneeId).filter(Boolean))) as string[];
    const assignees = await prisma.users.findMany({
      where: { id: { in: assigneeIds } },
      select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
    });

    const tasksByAssignee = [
      ...assignees.map(user => ({
        user,
        count: tasks.filter(t => t.assigneeId === user.id).length,
      })),
      {
        user: null,
        count: tasks.filter(t => !t.assigneeId).length,
      },
    ];

    return NextResponse.json({
      totalTasks,
      completedTasks,
      totalStoryPoints,
      completedStoryPoints,
      totalEpics,
      completedEpics,
      activeSprint,
      velocity,
      tasksByStatus,
      tasksByPriority,
      tasksByAssignee,
      recentActivity,
    });
  } catch (error) {
    console.error('Error fetching project stats:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
