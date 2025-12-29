import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema de validation
const reorderSchema = z.object({
  stageIds: z.array(z.string()).min(1),
});

// POST /api/pipeline-stages/reorder - Réordonner les stages
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que l'utilisateur est admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Seuls les administrateurs peuvent réordonner les stages' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = reorderSchema.parse(body);

    // Mettre à jour les positions
    const updates = validatedData.stageIds.map((id, index) =>
      prisma.pipeline_stages.update({
        where: { id },
        data: { position: index + 1 },
      })
    );

    await prisma.$transaction(updates);

    // Récupérer les stages mis à jour
    const stages = await prisma.pipeline_stages.findMany({
      orderBy: { position: 'asc' },
    });

    return NextResponse.json({ stages });
  } catch (error) {
    console.error('Erreur POST /api/pipeline-stages/reorder:', error);

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
