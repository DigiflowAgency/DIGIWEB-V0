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
  // Nouveau: assignation a un utilisateur specifique
  assignToUserId: z.string().optional().nullable(),
  metricType: z.string().optional().nullable(),
});

// GET /api/goals - Recuperer tous les objectifs
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    // Construire la query
    const where: any = {};

    // Les objectifs systeme sont visibles par tous
    // Les objectifs personnels (y compris assignes) sont visibles uniquement par leur proprietaire
    if (type === 'PERSONAL') {
      where.type = 'PERSONAL';
      where.userId = session.user.id;
    } else if (type === 'SYSTEM') {
      where.type = 'SYSTEM';
    } else {
      // Par defaut, montrer les objectifs systeme + les objectifs personnels/assignes de l'utilisateur
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
        assignedBy: {
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

// POST /api/goals - Creer un nouvel objectif
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = goalSchema.parse(body);

    // Verifier les permissions
    if (validatedData.type === 'SYSTEM' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Seuls les administrateurs peuvent creer des objectifs systeme' },
        { status: 403 }
      );
    }

    // Si on assigne a un utilisateur, verifier que c'est un admin
    if (validatedData.assignToUserId && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Seuls les administrateurs peuvent assigner des objectifs' },
        { status: 403 }
      );
    }

    // Determiner le userId
    let targetUserId = null;
    let assignedById = null;

    if (validatedData.assignToUserId) {
      // Objectif assigne par un admin a un commercial
      targetUserId = validatedData.assignToUserId;
      assignedById = session.user.id;
    } else if (validatedData.type === 'PERSONAL') {
      // Objectif personnel cree par l'utilisateur lui-meme
      targetUserId = session.user.id;
    }

    // Creer l'objectif
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
        userId: targetUserId,
        assignedById: assignedById,
        metricType: validatedData.metricType || null,
      },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        assignedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Si l'objectif est assigne, envoyer une notification
    if (validatedData.assignToUserId && assignedById) {
      await prisma.notifications.create({
        data: {
          id: `NOTIF-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          userId: validatedData.assignToUserId,
          type: 'SYSTEM',
          title: 'Nouvel objectif assigne',
          message: `${session.user.name || 'Un administrateur'} vous a assigne un nouvel objectif: "${validatedData.title}"${validatedData.targetValue ? ` (Cible: ${validatedData.targetValue})` : ''}`,
          link: '/dashboard/objectives',
        },
      });
    }

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /api/goals:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Donnees invalides', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
