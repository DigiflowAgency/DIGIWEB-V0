import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createDependencySchema = z.object({
  toTaskId: z.string().min(1),
  type: z.enum(['BLOCKS', 'RELATES_TO', 'DUPLICATES']).default('BLOCKS'),
});

// POST /api/projects/tasks/[taskId]/dependencies - Add dependency
export async function POST(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { taskId } = await params;
    const body = await request.json();
    const data = createDependencySchema.parse(body);

    // Check if dependency already exists
    const existing = await prisma.task_dependencies.findFirst({
      where: {
        fromTaskId: taskId,
        toTaskId: data.toTaskId,
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'Dépendance existante' }, { status: 400 });
    }

    // Check for circular dependency
    const reverse = await prisma.task_dependencies.findFirst({
      where: {
        fromTaskId: data.toTaskId,
        toTaskId: taskId,
      },
    });

    if (reverse) {
      return NextResponse.json({ error: 'Dépendance circulaire détectée' }, { status: 400 });
    }

    // Can't depend on itself
    if (taskId === data.toTaskId) {
      return NextResponse.json({ error: 'Une tâche ne peut pas dépendre d\'elle-même' }, { status: 400 });
    }

    const dependency = await prisma.task_dependencies.create({
      data: {
        fromTaskId: taskId,
        toTaskId: data.toTaskId,
        type: data.type,
      },
      include: {
        toTask: {
          select: { id: true, code: true, title: true, status: true },
        },
      },
    });

    // Log history
    const toTask = await prisma.tasks.findUnique({ where: { id: data.toTaskId } });
    await prisma.task_history.create({
      data: {
        taskId,
        userId: session.user.id,
        field: 'dependencies',
        oldValue: null,
        newValue: `Ajout: ${data.type} ${toTask?.code}`,
      },
    });

    return NextResponse.json(dependency, { status: 201 });
  } catch (error) {
    console.error('Error adding dependency:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/projects/tasks/[taskId]/dependencies - Remove dependency
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { taskId } = await params;
    const { searchParams } = new URL(request.url);
    const dependencyId = searchParams.get('dependencyId');

    if (!dependencyId) {
      return NextResponse.json({ error: 'dependencyId requis' }, { status: 400 });
    }

    const existing = await prisma.task_dependencies.findUnique({
      where: { id: dependencyId },
      include: { toTask: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Dépendance non trouvée' }, { status: 404 });
    }

    if (existing.fromTaskId !== taskId) {
      return NextResponse.json({ error: 'Dépendance non associée à cette tâche' }, { status: 403 });
    }

    await prisma.task_dependencies.delete({
      where: { id: dependencyId },
    });

    // Log history
    await prisma.task_history.create({
      data: {
        taskId,
        userId: session.user.id,
        field: 'dependencies',
        oldValue: `Suppression: ${existing.type} ${existing.toTask?.code}`,
        newValue: null,
      },
    });

    return NextResponse.json({ message: 'Dépendance supprimée' });
  } catch (error) {
    console.error('Error removing dependency:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// GET /api/projects/tasks/[taskId]/dependencies - Get dependencies
export async function GET(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { taskId } = await params;

    const [dependencies, dependents] = await Promise.all([
      prisma.task_dependencies.findMany({
        where: { fromTaskId: taskId },
        include: {
          toTask: {
            select: { id: true, code: true, title: true, status: true },
          },
        },
      }),
      prisma.task_dependencies.findMany({
        where: { toTaskId: taskId },
        include: {
          fromTask: {
            select: { id: true, code: true, title: true, status: true },
          },
        },
      }),
    ]);

    return NextResponse.json({ dependencies, dependents });
  } catch (error) {
    console.error('Error fetching dependencies:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
