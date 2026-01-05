import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema de validation pour création de service
const createServiceSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  description: z.string().optional(),
  color: z.string().optional(),
  stages: z.array(z.object({
    name: z.string().min(1),
    color: z.string().optional(),
  })).optional(),
});

// GET /api/production-services - Liste tous les services
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const services = await prisma.production_services.findMany({
      include: {
        stages: {
          orderBy: { position: 'asc' },
        },
        _count: {
          select: { deals: true },
        },
      },
      orderBy: { position: 'asc' },
    });

    return NextResponse.json({ services });
  } catch (error) {
    console.error('Erreur GET /api/production-services:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/production-services - Créer un service
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createServiceSchema.parse(body);

    // Calculer la prochaine position
    const maxPosition = await prisma.production_services.aggregate({
      _max: { position: true },
    });
    const nextPosition = (maxPosition._max.position ?? -1) + 1;

    // Créer le service avec ses stages
    const service = await prisma.production_services.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        color: validatedData.color || '#8B5CF6',
        position: nextPosition,
        stages: validatedData.stages && validatedData.stages.length > 0
          ? {
              create: validatedData.stages.map((stage, index) => ({
                name: stage.name,
                color: stage.color || '#E5E7EB',
                position: index,
              })),
            }
          : undefined,
      },
      include: {
        stages: {
          orderBy: { position: 'asc' },
        },
      },
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /api/production-services:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
