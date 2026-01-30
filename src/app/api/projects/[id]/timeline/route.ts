import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/projects/[id]/timeline - Get timeline/Gantt data
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

    // Get tasks with dates
    const tasks = await prisma.tasks.findMany({
      where: {
        projectId: id,
        parentId: null,
        OR: [
          { startDate: { not: null } },
          { dueDate: { not: null } },
        ],
      },
      include: {
        status: true,
        assignee: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
        dependencies: {
          select: { toTaskId: true },
        },
      },
      orderBy: { startDate: 'asc' },
    });

    // Get epics with dates
    const epics = await prisma.epics.findMany({
      where: {
        projectId: id,
        OR: [
          { startDate: { not: null } },
          { endDate: { not: null } },
        ],
      },
      orderBy: { startDate: 'asc' },
    });

    // Calculate progress for each task
    const timelineTasks = tasks.map(task => {
      const isComplete = doneStatusIds.includes(task.statusId);
      return {
        id: task.id,
        code: task.code,
        title: task.title,
        startDate: task.startDate?.toISOString() || task.createdAt.toISOString(),
        endDate: task.dueDate?.toISOString() || task.startDate?.toISOString() || task.createdAt.toISOString(),
        progress: isComplete ? 100 : 0,
        type: task.type,
        assignee: task.assignee,
        dependencies: task.dependencies.map(d => d.toTaskId),
      };
    });

    // Calculate min/max dates
    const allDates = [
      ...tasks.flatMap(t => [t.startDate, t.dueDate]).filter(Boolean),
      ...epics.flatMap(e => [e.startDate, e.endDate]).filter(Boolean),
    ] as Date[];

    const minDate = allDates.length > 0
      ? new Date(Math.min(...allDates.map(d => d.getTime()))).toISOString()
      : new Date().toISOString();

    const maxDate = allDates.length > 0
      ? new Date(Math.max(...allDates.map(d => d.getTime()))).toISOString()
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days from now

    return NextResponse.json({
      tasks: timelineTasks,
      epics,
      minDate,
      maxDate,
    });
  } catch (error) {
    console.error('Error fetching timeline:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
