import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateProjectSchema } from '@/lib/projects/validators';
import { z } from 'zod';

// GET /api/projects/[id] - Get project details
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

    const project = await prisma.projects.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
        client: {
          select: { id: true, name: true, email: true, phone: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
            },
          },
        },
        labels: true,
        statuses: {
          orderBy: { position: 'asc' },
          include: {
            _count: { select: { tasks: true } },
          },
        },
        _count: {
          select: { tasks: true, epics: true, sprints: true, members: true },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Projet non trouvé' }, { status: 404 });
    }

    // Check access
    const isMember = project.members.some(m => m.userId === session.user.id);
    const isOwner = project.ownerId === session.user.id;
    const isAdmin = session.user.role === 'ADMIN';

    if (!isMember && !isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT /api/projects/[id] - Update project
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
    const data = updateProjectSchema.parse(body);

    // Check project exists and user has access
    const existing = await prisma.projects.findUnique({
      where: { id },
      include: {
        members: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Projet non trouvé' }, { status: 404 });
    }

    const member = existing.members.find(m => m.userId === session.user.id);
    const canEdit =
      session.user.role === 'ADMIN' ||
      existing.ownerId === session.user.id ||
      member?.role === 'OWNER' ||
      member?.role === 'LEAD';

    if (!canEdit) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const project = await prisma.projects.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.type && { type: data.type }),
        ...(data.status && { status: data.status }),
        ...(data.budget !== undefined && { budget: data.budget }),
        ...(data.spent !== undefined && { spent: data.spent }),
        ...(data.currency && { currency: data.currency }),
        ...(data.startDate !== undefined && { startDate: data.startDate ? new Date(data.startDate) : null }),
        ...(data.endDate !== undefined && { endDate: data.endDate ? new Date(data.endDate) : null }),
        ...(data.deadline !== undefined && { deadline: data.deadline ? new Date(data.deadline) : null }),
        ...(data.clientId !== undefined && { clientId: data.clientId }),
      },
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
        client: {
          select: { id: true, name: true, email: true, phone: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
            },
          },
        },
        labels: true,
        statuses: {
          orderBy: { position: 'asc' },
        },
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/projects/[id] - Archive or delete project
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
    const permanent = searchParams.get('permanent') === 'true';

    // Check project exists and user has access
    const existing = await prisma.projects.findUnique({
      where: { id },
      include: { members: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Projet non trouvé' }, { status: 404 });
    }

    const isOwner = existing.ownerId === session.user.id;
    const isAdmin = session.user.role === 'ADMIN';
    const memberRole = existing.members.find(m => m.userId === session.user.id)?.role;

    if (!isOwner && !isAdmin && memberRole !== 'OWNER') {
      return NextResponse.json({ error: 'Seul le propriétaire peut supprimer le projet' }, { status: 403 });
    }

    if (permanent && isAdmin) {
      // Permanent delete (admin only)
      await prisma.projects.delete({ where: { id } });
      return NextResponse.json({ message: 'Projet supprimé définitivement' });
    }

    // Archive (soft delete)
    await prisma.projects.update({
      where: { id },
      data: {
        status: 'ARCHIVED',
        archivedAt: new Date(),
      },
    });

    return NextResponse.json({ message: 'Projet archivé' });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
