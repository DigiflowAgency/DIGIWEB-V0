import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const goalUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  targetValue: z.number().optional().nullable(),
  currentValue: z.number().optional(),
  deadline: z.string().optional().nullable(),
  completed: z.boolean().optional(),
});

type RouteContext = {
  params: { id: string };
};

// GET /api/goals/[id] - Récupérer un objectif par ID
export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const goal = await prisma.goals.findUnique({
      where: { id: params.id },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!goal) {
      return NextResponse.json(
        { error: 'Objectif non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier les permissions
    if (goal.type === 'PERSONAL' && goal.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas accéder à cet objectif' },
        { status: 403 }
      );
    }

    return NextResponse.json(goal);
  } catch (error) {
    console.error(`Erreur GET /api/goals/${params.id}:`, error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PUT /api/goals/[id] - Mettre à jour un objectif
export async function PUT(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que l'objectif existe
    const existingGoal = await prisma.goals.findUnique({
      where: { id: params.id },
    });

    if (!existingGoal) {
      return NextResponse.json(
        { error: 'Objectif non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier les permissions
    if (existingGoal.type === 'SYSTEM' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Seuls les administrateurs peuvent modifier les objectifs système' },
        { status: 403 }
      );
    }

    if (existingGoal.type === 'PERSONAL' && existingGoal.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas modifier cet objectif' },
        { status: 403 }
      );
    }

    // Parser et valider le body
    const body = await request.json();
    const validatedData = goalUpdateSchema.parse(body);

    // Préparer les données de mise à jour
    const updateData: any = {};

    if (validatedData.title !== undefined) updateData.title = validatedData.title;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.targetValue !== undefined) updateData.targetValue = validatedData.targetValue;
    if (validatedData.currentValue !== undefined) updateData.currentValue = validatedData.currentValue;
    if (validatedData.deadline !== undefined) {
      updateData.deadline = validatedData.deadline ? new Date(validatedData.deadline) : null;
    }
    if (validatedData.completed !== undefined) {
      updateData.completed = validatedData.completed;
      if (validatedData.completed && !existingGoal.completedAt) {
        updateData.completedAt = new Date();
      } else if (!validatedData.completed) {
        updateData.completedAt = null;
      }
    }

    updateData.updatedAt = new Date();

    // Mettre à jour l'objectif
    const updatedGoal = await prisma.goals.update({
      where: { id: params.id },
      data: updateData,
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(updatedGoal);
  } catch (error) {
    console.error(`Erreur PUT /api/goals/${params.id}:`, error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// DELETE /api/goals/[id] - Supprimer un objectif
export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que l'objectif existe
    const existingGoal = await prisma.goals.findUnique({
      where: { id: params.id },
    });

    if (!existingGoal) {
      return NextResponse.json(
        { error: 'Objectif non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier les permissions
    if (existingGoal.type === 'SYSTEM' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Seuls les administrateurs peuvent supprimer les objectifs système' },
        { status: 403 }
      );
    }

    if (existingGoal.type === 'PERSONAL' && existingGoal.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas supprimer cet objectif' },
        { status: 403 }
      );
    }

    // Supprimer l'objectif
    await prisma.goals.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Objectif supprimé avec succès' });
  } catch (error) {
    console.error(`Erreur DELETE /api/goals/${params.id}:`, error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
