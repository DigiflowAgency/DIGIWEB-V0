import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createTimeEntrySchema } from '@/lib/projects/validators';
import { z } from 'zod';

// GET /api/projects/tasks/[taskId]/time - Get time entries
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

    const entries = await prisma.task_time_entries.findMany({
      where: { taskId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);

    return NextResponse.json({ entries, totalHours });
  } catch (error) {
    console.error('Error fetching time entries:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/projects/tasks/[taskId]/time - Log time
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
    const data = createTimeEntrySchema.parse(body);

    const entry = await prisma.task_time_entries.create({
      data: {
        taskId,
        userId: session.user.id,
        hours: data.hours,
        description: data.description,
        date: data.date ? new Date(data.date) : new Date(),
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
      },
    });

    // Update task logged hours
    const totalHours = await prisma.task_time_entries.aggregate({
      where: { taskId },
      _sum: { hours: true },
    });

    await prisma.tasks.update({
      where: { id: taskId },
      data: { loggedHours: totalHours._sum.hours || 0 },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error('Error logging time:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/projects/tasks/[taskId]/time - Delete time entry
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
    const entryId = searchParams.get('entryId');

    if (!entryId) {
      return NextResponse.json({ error: 'ID de l\'entrée requis' }, { status: 400 });
    }

    // Check ownership
    const existing = await prisma.task_time_entries.findUnique({
      where: { id: entryId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Entrée non trouvée' }, { status: 404 });
    }

    if (existing.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    await prisma.task_time_entries.delete({ where: { id: entryId } });

    // Update task logged hours
    const totalHours = await prisma.task_time_entries.aggregate({
      where: { taskId },
      _sum: { hours: true },
    });

    await prisma.tasks.update({
      where: { id: taskId },
      data: { loggedHours: totalHours._sum.hours || 0 },
    });

    return NextResponse.json({ message: 'Entrée supprimée' });
  } catch (error) {
    console.error('Error deleting time entry:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
