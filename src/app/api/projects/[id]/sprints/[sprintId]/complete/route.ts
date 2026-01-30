import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/projects/[id]/sprints/[sprintId]/complete - Complete a sprint
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; sprintId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id, sprintId } = await params;
    const body = await request.json().catch(() => ({}));
    const { moveIncompleteTo } = body; // null = backlog, or next sprint ID

    // Get project's done statuses
    const doneStatuses = await prisma.project_statuses.findMany({
      where: { projectId: id, isDone: true },
      select: { id: true },
    });
    const doneStatusIds = doneStatuses.map(s => s.id);

    // Get sprint tasks
    const tasks = await prisma.tasks.findMany({
      where: { sprintId },
      select: { id: true, statusId: true, storyPoints: true },
    });

    // Calculate completed points
    const completedPoints = tasks
      .filter(t => doneStatusIds.includes(t.statusId))
      .reduce((sum, t) => sum + (t.storyPoints || 0), 0);

    // Move incomplete tasks
    const incompleteTasks = tasks.filter(t => !doneStatusIds.includes(t.statusId));

    if (incompleteTasks.length > 0) {
      await prisma.tasks.updateMany({
        where: { id: { in: incompleteTasks.map(t => t.id) } },
        data: { sprintId: moveIncompleteTo || null },
      });
    }

    // Update sprint
    const sprint = await prisma.sprints.update({
      where: { id: sprintId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        completedPoints,
      },
      include: {
        _count: { select: { tasks: true } },
        retrospective: true,
      },
    });

    return NextResponse.json({
      sprint,
      summary: {
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => doneStatusIds.includes(t.statusId)).length,
        incompleteTasks: incompleteTasks.length,
        completedPoints,
        movedTo: moveIncompleteTo || 'backlog',
      },
    });
  } catch (error) {
    console.error('Error completing sprint:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
