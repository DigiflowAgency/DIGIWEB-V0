import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createLabelSchema, updateLabelSchema } from '@/lib/projects/validators';
import { z } from 'zod';

// GET /api/projects/[id]/labels - List project labels
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

    const labels = await prisma.project_labels.findMany({
      where: { projectId: id },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(labels);
  } catch (error) {
    console.error('Error fetching labels:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/projects/[id]/labels - Create a label
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
    const data = createLabelSchema.parse(body);

    // Check project exists
    const project = await prisma.projects.findUnique({
      where: { id },
      include: { members: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Projet non trouvé' }, { status: 404 });
    }

    // Check if label name already exists
    const existing = await prisma.project_labels.findFirst({
      where: { projectId: id, name: data.name },
    });

    if (existing) {
      return NextResponse.json({ error: 'Ce label existe déjà' }, { status: 400 });
    }

    const label = await prisma.project_labels.create({
      data: {
        projectId: id,
        name: data.name,
        color: data.color,
      },
    });

    return NextResponse.json(label, { status: 201 });
  } catch (error) {
    console.error('Error creating label:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT /api/projects/[id]/labels - Update a label
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
    const { labelId, ...data } = body;
    const validated = updateLabelSchema.parse(data);

    if (!labelId) {
      return NextResponse.json({ error: 'ID du label requis' }, { status: 400 });
    }

    const label = await prisma.project_labels.update({
      where: { id: labelId },
      data: validated,
    });

    return NextResponse.json(label);
  } catch (error) {
    console.error('Error updating label:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/projects/[id]/labels - Delete a label
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const labelId = searchParams.get('labelId');

    if (!labelId) {
      return NextResponse.json({ error: 'ID du label requis' }, { status: 400 });
    }

    await prisma.project_labels.delete({ where: { id: labelId } });

    return NextResponse.json({ message: 'Label supprimé' });
  } catch (error) {
    console.error('Error deleting label:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
