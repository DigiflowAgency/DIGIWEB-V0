import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { addMemberSchema, updateMemberSchema } from '@/lib/projects/validators';
import { z } from 'zod';

// GET /api/projects/[id]/members - List project members
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

    const members = await prisma.project_members.findMany({
      where: { projectId: id },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
      },
      orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/projects/[id]/members - Add a member
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
    const data = addMemberSchema.parse(body);

    // Check project exists and user has access to add members
    const project = await prisma.projects.findUnique({
      where: { id },
      include: { members: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Projet non trouvé' }, { status: 404 });
    }

    const currentMember = project.members.find(m => m.userId === session.user.id);
    const canManageMembers =
      session.user.role === 'ADMIN' ||
      project.ownerId === session.user.id ||
      currentMember?.role === 'OWNER' ||
      currentMember?.role === 'LEAD';

    if (!canManageMembers) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    // Check if user is already a member
    const existingMember = project.members.find(m => m.userId === data.userId);
    if (existingMember) {
      return NextResponse.json({ error: 'Utilisateur déjà membre du projet' }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.users.findUnique({ where: { id: data.userId } });
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const member = await prisma.project_members.create({
      data: {
        projectId: id,
        userId: data.userId,
        role: data.role,
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
      },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error('Error adding member:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT /api/projects/[id]/members - Update a member's role
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
    const { memberId, ...data } = body;
    const validated = updateMemberSchema.parse(data);

    if (!memberId) {
      return NextResponse.json({ error: 'ID du membre requis' }, { status: 400 });
    }

    // Check project and permissions
    const project = await prisma.projects.findUnique({
      where: { id },
      include: { members: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Projet non trouvé' }, { status: 404 });
    }

    const currentMember = project.members.find(m => m.userId === session.user.id);
    const canManageMembers =
      session.user.role === 'ADMIN' ||
      project.ownerId === session.user.id ||
      currentMember?.role === 'OWNER';

    if (!canManageMembers) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const member = await prisma.project_members.update({
      where: { id: memberId },
      data: { role: validated.role },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
      },
    });

    return NextResponse.json(member);
  } catch (error) {
    console.error('Error updating member:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/projects/[id]/members - Remove a member
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
    const memberId = searchParams.get('memberId');

    if (!memberId) {
      return NextResponse.json({ error: 'ID du membre requis' }, { status: 400 });
    }

    // Check project and permissions
    const project = await prisma.projects.findUnique({
      where: { id },
      include: { members: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Projet non trouvé' }, { status: 404 });
    }

    const memberToRemove = project.members.find(m => m.id === memberId);
    if (!memberToRemove) {
      return NextResponse.json({ error: 'Membre non trouvé' }, { status: 404 });
    }

    // Cannot remove project owner
    if (memberToRemove.userId === project.ownerId) {
      return NextResponse.json({ error: 'Impossible de retirer le propriétaire du projet' }, { status: 400 });
    }

    const currentMember = project.members.find(m => m.userId === session.user.id);
    const canManageMembers =
      session.user.role === 'ADMIN' ||
      project.ownerId === session.user.id ||
      currentMember?.role === 'OWNER' ||
      currentMember?.role === 'LEAD';

    // Members can remove themselves
    const isSelf = memberToRemove.userId === session.user.id;

    if (!canManageMembers && !isSelf) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    await prisma.project_members.delete({ where: { id: memberId } });

    return NextResponse.json({ message: 'Membre retiré' });
  } catch (error) {
    console.error('Error removing member:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
