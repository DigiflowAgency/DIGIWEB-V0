import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createStatusSchema, updateStatusSchema, reorderStatusesSchema } from '@/lib/projects/validators';
import { z } from 'zod';

// GET /api/projects/[id]/statuses - List project statuses (kanban columns)
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

    const statuses = await prisma.project_statuses.findMany({
      where: { projectId: id },
      orderBy: { position: 'asc' },
      include: {
        _count: { select: { tasks: true } },
      },
    });

    return NextResponse.json(statuses);
  } catch (error) {
    console.error('Error fetching statuses:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/projects/[id]/statuses - Create a status
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = createStatusSchema.parse(body);

    // Get max position
    const maxPosition = await prisma.project_statuses.findFirst({
      where: { projectId: id },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    const position = data.position ?? (maxPosition?.position ?? -1) + 1;

    // If setting as default, unset existing default
    if (data.isDefault) {
      await prisma.project_statuses.updateMany({
        where: { projectId: id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const status = await prisma.project_statuses.create({
      data: {
        projectId: id,
        name: data.name,
        color: data.color,
        position,
        isDefault: data.isDefault,
        isDone: data.isDone,
      },
    });

    return NextResponse.json(status, { status: 201 });
  } catch (error) {
    console.error('Error creating status:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT /api/projects/[id]/statuses - Update or reorder statuses
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Check if it's a reorder request
    if (body.statusIds) {
      const { statusIds } = reorderStatusesSchema.parse(body);

      // Update positions in transaction
      await prisma.$transaction(
        statusIds.map((statusId, index) =>
          prisma.project_statuses.update({
            where: { id: statusId },
            data: { position: index },
          })
        )
      );

      const statuses = await prisma.project_statuses.findMany({
        where: { projectId: id },
        orderBy: { position: 'asc' },
        include: { _count: { select: { tasks: true } } },
      });

      return NextResponse.json(statuses);
    }

    // Single status update
    const { statusId, ...data } = body;
    const validated = updateStatusSchema.parse(data);

    if (!statusId) {
      return NextResponse.json({ error: 'ID du statut requis' }, { status: 400 });
    }

    // If setting as default, unset existing default
    if (validated.isDefault) {
      await prisma.project_statuses.updateMany({
        where: { projectId: id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const status = await prisma.project_statuses.update({
      where: { id: statusId },
      data: validated,
    });

    return NextResponse.json(status);
  } catch (error) {
    console.error('Error updating status:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/projects/[id]/statuses - Delete a status
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const statusId = searchParams.get('statusId');
    const moveToStatusId = searchParams.get('moveToStatusId');

    if (!statusId) {
      return NextResponse.json({ error: 'ID du statut requis' }, { status: 400 });
    }

    // Check if status has tasks
    const taskCount = await prisma.tasks.count({
      where: { statusId },
    });

    if (taskCount > 0) {
      if (!moveToStatusId) {
        return NextResponse.json({
          error: 'Ce statut contient des tâches. Spécifiez moveToStatusId pour les déplacer.',
          taskCount,
        }, { status: 400 });
      }

      // Move tasks to new status
      await prisma.tasks.updateMany({
        where: { statusId },
        data: { statusId: moveToStatusId },
      });
    }

    // Delete the status
    await prisma.project_statuses.delete({ where: { id: statusId } });

    // Reorder remaining statuses
    const remaining = await prisma.project_statuses.findMany({
      where: { projectId: id },
      orderBy: { position: 'asc' },
    });

    await prisma.$transaction(
      remaining.map((status, index) =>
        prisma.project_statuses.update({
          where: { id: status.id },
          data: { position: index },
        })
      )
    );

    return NextResponse.json({ message: 'Statut supprimé' });
  } catch (error) {
    console.error('Error deleting status:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
