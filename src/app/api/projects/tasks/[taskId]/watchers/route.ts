import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/projects/tasks/[taskId]/watchers - Add watcher
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
    const body = await request.json().catch(() => ({}));
    const userId = body.userId || session.user.id;

    // Check if already watching
    const existing = await prisma.task_watchers.findFirst({
      where: { taskId, userId },
    });

    if (existing) {
      return NextResponse.json({ error: 'Déjà observateur' }, { status: 400 });
    }

    const watcher = await prisma.task_watchers.create({
      data: { taskId, userId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
      },
    });

    return NextResponse.json(watcher, { status: 201 });
  } catch (error) {
    console.error('Error adding watcher:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/projects/tasks/[taskId]/watchers - Remove watcher
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
    const userId = searchParams.get('userId') || session.user.id;

    const existing = await prisma.task_watchers.findFirst({
      where: { taskId, userId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Non observateur' }, { status: 404 });
    }

    await prisma.task_watchers.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({ message: 'Observateur retiré' });
  } catch (error) {
    console.error('Error removing watcher:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// GET /api/projects/tasks/[taskId]/watchers - Get watchers
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

    const watchers = await prisma.task_watchers.findMany({
      where: { taskId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
      },
    });

    return NextResponse.json(watchers);
  } catch (error) {
    console.error('Error fetching watchers:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
