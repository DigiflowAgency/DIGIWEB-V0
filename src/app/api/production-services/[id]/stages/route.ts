import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

type RouteContext = { params: Promise<{ id: string }> };

// Schema de validation pour création de stage
const createStageSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  description: z.string().optional(),
  color: z.string().optional(),
});

// GET /api/production-services/[id]/stages - Liste les stages d'un service
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await context.params;

    const stages = await prisma.production_service_stages.findMany({
      where: { serviceId: id },
      orderBy: { position: 'asc' },
    });

    return NextResponse.json({ stages });
  } catch (error) {
    console.error('Erreur GET /api/production-services/[id]/stages:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/production-services/[id]/stages - Créer un stage
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const validatedData = createStageSchema.parse(body);

    // Vérifier que le service existe
    const service = await prisma.production_services.findUnique({
      where: { id },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service non trouvé' }, { status: 404 });
    }

    // Calculer la prochaine position
    const maxPosition = await prisma.production_service_stages.aggregate({
      where: { serviceId: id },
      _max: { position: true },
    });
    const nextPosition = (maxPosition._max.position ?? -1) + 1;

    const stage = await prisma.production_service_stages.create({
      data: {
        serviceId: id,
        name: validatedData.name,
        description: validatedData.description,
        color: validatedData.color || '#E5E7EB',
        position: nextPosition,
      },
    });

    return NextResponse.json(stage, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /api/production-services/[id]/stages:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT /api/production-services/[id]/stages - Réordonner tous les stages
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { stageIds } = body as { stageIds: string[] };

    if (!Array.isArray(stageIds)) {
      return NextResponse.json({ error: 'stageIds doit être un tableau' }, { status: 400 });
    }

    // Mettre à jour les positions
    await Promise.all(
      stageIds.map((stageId, index) =>
        prisma.production_service_stages.update({
          where: { id: stageId },
          data: { position: index },
        })
      )
    );

    const stages = await prisma.production_service_stages.findMany({
      where: { serviceId: id },
      orderBy: { position: 'asc' },
    });

    return NextResponse.json({ stages });
  } catch (error) {
    console.error('Erreur PUT /api/production-services/[id]/stages:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
