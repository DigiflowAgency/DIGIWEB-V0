import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/projects/[id]/sprints/[sprintId]/details - Get detailed sprint data
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; sprintId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id: projectId, sprintId } = await params;

    // Get sprint with tasks
    const sprint = await prisma.sprints.findUnique({
      where: { id: sprintId },
      include: {
        tasks: {
          where: { parentId: null }, // Exclude subtasks
          include: {
            assignee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
              },
            },
            epic: {
              select: {
                id: true,
                title: true,
                color: true,
              },
            },
            status: true,
            _count: {
              select: {
                subtasks: true,
                comments: true,
              },
            },
          },
          orderBy: [
            { status: { position: 'asc' } },
            { priority: 'asc' },
            { position: 'asc' },
          ],
        },
      },
    });

    if (!sprint) {
      return NextResponse.json({ error: 'Sprint non trouvé' }, { status: 404 });
    }

    // Get project statuses
    const statuses = await prisma.project_statuses.findMany({
      where: { projectId },
      orderBy: { position: 'asc' },
    });

    // Calculate stats
    const doneStatusIds = statuses.filter(s => s.isDone).map(s => s.id);
    const inProgressStatusIds = statuses
      .filter(s => !s.isDone && !s.isDefault)
      .map(s => s.id);

    const totalTasks = sprint.tasks.length;
    const completedTasks = sprint.tasks.filter(t => doneStatusIds.includes(t.statusId)).length;
    const inProgressTasks = sprint.tasks.filter(t => inProgressStatusIds.includes(t.statusId)).length;
    const todoTasks = totalTasks - completedTasks - inProgressTasks;

    const totalPoints = sprint.tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    const completedPoints = sprint.tasks
      .filter(t => doneStatusIds.includes(t.statusId))
      .reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    const remainingPoints = totalPoints - completedPoints;

    // Calculate days
    const startDate = new Date(sprint.startDate);
    const endDate = new Date(sprint.endDate);
    const today = new Date();

    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysElapsed = Math.max(0, Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

    const dailyBurnRate = daysRemaining > 0 ? remainingPoints / daysRemaining : 0;

    return NextResponse.json({
      sprint: {
        ...sprint,
        startDate: sprint.startDate.toISOString(),
        endDate: sprint.endDate.toISOString(),
        createdAt: sprint.createdAt.toISOString(),
        updatedAt: sprint.updatedAt.toISOString(),
        startedAt: sprint.startedAt?.toISOString() || null,
        completedAt: sprint.completedAt?.toISOString() || null,
        tasks: sprint.tasks.map(task => ({
          ...task,
          createdAt: task.createdAt.toISOString(),
          updatedAt: task.updatedAt.toISOString(),
          completedAt: task.completedAt?.toISOString() || null,
          startDate: task.startDate?.toISOString() || null,
          dueDate: task.dueDate?.toISOString() || null,
        })),
      },
      statuses: statuses.map(s => ({
        ...s,
      })),
      stats: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        todoTasks,
        totalPoints,
        completedPoints,
        remainingPoints,
        daysRemaining,
        daysElapsed,
        totalDays,
        dailyBurnRate,
      },
    });
  } catch (error) {
    console.error('Error fetching sprint details:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
