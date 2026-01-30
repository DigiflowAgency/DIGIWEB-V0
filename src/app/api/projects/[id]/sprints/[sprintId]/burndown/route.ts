import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateBurndownData, calculateBurnupData } from '@/lib/projects/calculations';

// GET /api/projects/[id]/sprints/[sprintId]/burndown - Get burndown chart data
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; sprintId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id, sprintId } = await params;
    const { searchParams } = new URL(request.url);
    const chartType = searchParams.get('type') || 'burndown';

    const sprint = await prisma.sprints.findUnique({
      where: { id: sprintId },
    });

    if (!sprint) {
      return NextResponse.json({ error: 'Sprint non trouvé' }, { status: 404 });
    }

    // Get done statuses
    const doneStatuses = await prisma.project_statuses.findMany({
      where: { projectId: id, isDone: true },
      select: { id: true },
    });
    const doneStatusIds = doneStatuses.map(s => s.id);

    // Get sprint tasks
    const tasks = await prisma.tasks.findMany({
      where: { sprintId },
      select: {
        id: true,
        statusId: true,
        storyPoints: true,
        completedAt: true,
      },
    });

    // Convert Prisma dates to ISO strings for calculation functions
    const sprintForCalc = {
      ...sprint,
      startDate: sprint.startDate.toISOString(),
      endDate: sprint.endDate.toISOString(),
      createdAt: sprint.createdAt.toISOString(),
      updatedAt: sprint.updatedAt.toISOString(),
      startedAt: sprint.startedAt?.toISOString() || null,
      completedAt: sprint.completedAt?.toISOString() || null,
    };

    const tasksForCalc = tasks.map(t => ({
      ...t,
      completedAt: t.completedAt?.toISOString() || null,
    }));

    const data = chartType === 'burnup'
      ? calculateBurnupData(sprintForCalc as any, tasksForCalc as any, doneStatusIds)
      : calculateBurndownData(sprintForCalc as any, tasksForCalc as any, doneStatusIds);

    return NextResponse.json({
      sprint: {
        id: sprint.id,
        name: sprint.name,
        startDate: sprint.startDate,
        endDate: sprint.endDate,
        plannedPoints: sprint.plannedPoints,
        completedPoints: sprint.completedPoints,
        status: sprint.status,
      },
      data,
    });
  } catch (error) {
    console.error('Error fetching burndown data:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
