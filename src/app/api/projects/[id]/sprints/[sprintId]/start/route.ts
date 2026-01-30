import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/projects/[id]/sprints/[sprintId]/start - Start a sprint
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

    // Check for existing active sprint
    const activeSprint = await prisma.sprints.findFirst({
      where: {
        projectId: id,
        status: 'ACTIVE',
        id: { not: sprintId },
      },
    });

    if (activeSprint) {
      return NextResponse.json({
        error: 'Un sprint est déjà actif. Terminez-le avant d\'en démarrer un nouveau.',
      }, { status: 400 });
    }

    // Calculate planned points from sprint tasks
    const tasks = await prisma.tasks.findMany({
      where: { sprintId },
      select: { storyPoints: true },
    });

    const plannedPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);

    const sprint = await prisma.sprints.update({
      where: { id: sprintId },
      data: {
        status: 'ACTIVE',
        startedAt: new Date(),
        plannedPoints,
      },
      include: {
        _count: { select: { tasks: true } },
      },
    });

    return NextResponse.json(sprint);
  } catch (error) {
    console.error('Error starting sprint:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
