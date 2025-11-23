import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema de validation pour Goal
const goalSchema = z.object({
  type: z.enum(['PERSONAL', 'SYSTEM']),
  title: z.string().min(1, 'Le titre est requis'),
  description: z.string().optional().nullable(),
  targetValue: z.number().optional().nullable(),
  currentValue: z.number().optional().default(0),
  deadline: z.string().optional().nullable(),
  completed: z.boolean().optional().default(false),
});

// GET /api/goals - Récupérer tous les objectifs
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    // Construire la query
    const where: any = {};

    // Les objectifs système sont visibles par tous
    // Les objectifs personnels sont visibles uniquement par leur créateur
    if (type === 'PERSONAL') {
      where.type = 'PERSONAL';
      where.userId = session.user.id;
    } else if (type === 'SYSTEM') {
      where.type = 'SYSTEM';
    } else {
      // Par défaut, montrer les objectifs système + les objectifs personnels de l'utilisateur
      where.OR = [
        { type: 'SYSTEM' },
        { type: 'PERSONAL', userId: session.user.id },
      ];
    }

    const goals = await prisma.goals.findMany({
      where,
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
      orderBy: [
        { completed: 'asc' },
        { deadline: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({ goals });
  } catch (error) {
    console.error('Erreur GET /api/goals:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST /api/goals - Créer un nouvel objectif
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = goalSchema.parse(body);

    // Vérifier les permissions
    if (validatedData.type === 'SYSTEM' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Seuls les administrateurs peuvent créer des objectifs système' },
        { status: 403 }
      );
    }

    // Créer l'objectif
    const goal = await prisma.goals.create({
      data: {
        id: `GOAL-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        type: validatedData.type,
        title: validatedData.title,
        description: validatedData.description || null,
        targetValue: validatedData.targetValue || null,
        currentValue: validatedData.currentValue || 0,
        deadline: validatedData.deadline ? new Date(validatedData.deadline) : null,
        completed: validatedData.completed || false,
        userId: validatedData.type === 'PERSONAL' ? session.user.id : null,
      } as any,
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

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /api/goals:', error);

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
