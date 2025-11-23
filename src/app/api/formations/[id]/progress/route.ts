import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateProgressSchema = z.object({
  progress: z.number().min(0).max(100),
  status: z.enum(['NON_COMMENCEE', 'EN_COURS', 'COMPLETEE']).optional(),
  quizScore: z.number().optional(),
});

type RouteContext = {
  params: { id: string };
};

// POST /api/formations/[id]/progress - Mettre à jour la progression
export async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateProgressSchema.parse(body);

    // Vérifier que la formation existe
    const formation = await prisma.formations.findUnique({
      where: { id: params.id },
    });

    if (!formation) {
      return NextResponse.json(
        { error: 'Formation non trouvée' },
        { status: 404 }
      );
    }

    const now = new Date();

    // Déterminer le statut en fonction de la progression
    let status = validatedData.status;
    if (!status) {
      if (validatedData.progress === 0) {
        status = 'NON_COMMENCEE';
      } else if (validatedData.progress === 100) {
        status = 'COMPLETEE';
      } else {
        status = 'EN_COURS';
      }
    }

    // Chercher si la progression existe déjà
    const existingProgress = await prisma.formation_progress.findUnique({
      where: {
        userId_formationId: {
          userId: session.user.id,
          formationId: params.id,
        },
      },
    });

    let progress;

    if (existingProgress) {
      // Mettre à jour
      progress = await prisma.formation_progress.update({
        where: {
          userId_formationId: {
            userId: session.user.id,
            formationId: params.id,
          },
        },
        data: {
          progress: validatedData.progress,
          status,
          lastViewedAt: now,
          completedAt: status === 'COMPLETEE' ? now : existingProgress.completedAt,
          quizScore: validatedData.quizScore !== undefined ? validatedData.quizScore : existingProgress.quizScore,
        },
      });
    } else {
      // Créer
      progress = await prisma.formation_progress.create({
        data: {
          id: `FPROG-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          userId: session.user.id,
          formationId: params.id,
          progress: validatedData.progress,
          status,
          startedAt: now,
          lastViewedAt: now,
          completedAt: status === 'COMPLETEE' ? now : null,
          quizScore: validatedData.quizScore || null,
        },
      });
    }

    return NextResponse.json({ progress });
  } catch (error) {
    console.error(`Erreur POST /api/formations/${params.id}/progress:`, error);

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
