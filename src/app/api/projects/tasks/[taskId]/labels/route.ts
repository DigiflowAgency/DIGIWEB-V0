import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/projects/tasks/[taskId]/labels - Add label to task
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
    const { labelId } = await request.json();

    if (!labelId) {
      return NextResponse.json({ error: 'labelId requis' }, { status: 400 });
    }

    // Check if already assigned
    const existing = await prisma.task_labels.findFirst({
      where: { taskId, labelId },
    });

    if (existing) {
      return NextResponse.json({ error: 'Label déjà assigné' }, { status: 400 });
    }

    const taskLabel = await prisma.task_labels.create({
      data: { taskId, labelId },
      include: { label: true },
    });

    // Log history
    const label = await prisma.project_labels.findUnique({ where: { id: labelId } });
    await prisma.task_history.create({
      data: {
        taskId,
        userId: session.user.id,
        field: 'labels',
        oldValue: null,
        newValue: `Ajout: ${label?.name}`,
      },
    });

    return NextResponse.json(taskLabel, { status: 201 });
  } catch (error) {
    console.error('Error adding label:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/projects/tasks/[taskId]/labels - Remove label from task
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
    const { labelId } = await request.json();

    if (!labelId) {
      return NextResponse.json({ error: 'labelId requis' }, { status: 400 });
    }

    const existing = await prisma.task_labels.findFirst({
      where: { taskId, labelId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Label non trouvé' }, { status: 404 });
    }

    await prisma.task_labels.delete({
      where: { id: existing.id },
    });

    // Log history
    const label = await prisma.project_labels.findUnique({ where: { id: labelId } });
    await prisma.task_history.create({
      data: {
        taskId,
        userId: session.user.id,
        field: 'labels',
        oldValue: `Suppression: ${label?.name}`,
        newValue: null,
      },
    });

    return NextResponse.json({ message: 'Label retiré' });
  } catch (error) {
    console.error('Error removing label:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
