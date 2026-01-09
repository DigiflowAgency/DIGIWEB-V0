import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

type RouteContext = { params: { id: string } };

// Schema de validation
const addServiceSchema = z.object({
  serviceId: z.string().min(1),
  stageId: z.string().optional().nullable(),
});

const updateStageSchema = z.object({
  serviceId: z.string().min(1),
  stageId: z.string().nullable(),
});

// GET /api/deals/[id]/services - Récupérer les services d'un deal
export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const assignments = await prisma.deal_service_assignments.findMany({
      where: { dealId: params.id },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            color: true,
            stages: {
              select: {
                id: true,
                name: true,
                color: true,
                position: true,
              },
              orderBy: { position: 'asc' },
            },
          },
        },
        stage: {
          select: {
            id: true,
            name: true,
            color: true,
            position: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error(`Erreur GET /api/deals/${params.id}/services:`, error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/deals/[id]/services - Ajouter un service au deal
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
    const { serviceId, stageId } = addServiceSchema.parse(body);

    // Vérifier que le deal existe
    const deal = await prisma.deals.findUnique({ where: { id: params.id } });
    if (!deal) {
      return NextResponse.json({ error: 'Deal non trouvé' }, { status: 404 });
    }

    // Vérifier que le service existe
    const service = await prisma.production_services.findUnique({
      where: { id: serviceId },
      include: { stages: { orderBy: { position: 'asc' } } },
    });
    if (!service) {
      return NextResponse.json({ error: 'Service non trouvé' }, { status: 400 });
    }

    // Déterminer le stageId initial (premier stage si non fourni)
    const initialStageId = stageId || service.stages[0]?.id || null;

    // Créer l'assignation (upsert pour éviter les doublons)
    const assignment = await prisma.deal_service_assignments.upsert({
      where: {
        dealId_serviceId: { dealId: params.id, serviceId },
      },
      create: {
        dealId: params.id,
        serviceId,
        stageId: initialStageId,
      },
      update: {
        stageId: initialStageId,
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            color: true,
            stages: {
              select: {
                id: true,
                name: true,
                color: true,
                position: true,
              },
              orderBy: { position: 'asc' },
            },
          },
        },
        stage: {
          select: {
            id: true,
            name: true,
            color: true,
            position: true,
          },
        },
      },
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    console.error(`Erreur POST /api/deals/${params.id}/services:`, error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH /api/deals/[id]/services - Mettre à jour le stage d'un service
export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { serviceId, stageId } = updateStageSchema.parse(body);

    // Vérifier que l'assignation existe
    const existing = await prisma.deal_service_assignments.findUnique({
      where: {
        dealId_serviceId: { dealId: params.id, serviceId },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Assignation non trouvée' },
        { status: 404 }
      );
    }

    const assignment = await prisma.deal_service_assignments.update({
      where: {
        dealId_serviceId: { dealId: params.id, serviceId },
      },
      data: { stageId },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        stage: {
          select: {
            id: true,
            name: true,
            color: true,
            position: true,
          },
        },
      },
    });

    return NextResponse.json(assignment);
  } catch (error) {
    console.error(`Erreur PATCH /api/deals/${params.id}/services:`, error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/deals/[id]/services?serviceId=xxx - Retirer un service du deal
export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId');

    if (!serviceId) {
      return NextResponse.json(
        { error: 'serviceId requis' },
        { status: 400 }
      );
    }

    // Vérifier que l'assignation existe
    const existing = await prisma.deal_service_assignments.findUnique({
      where: {
        dealId_serviceId: { dealId: params.id, serviceId },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Assignation non trouvée' },
        { status: 404 }
      );
    }

    await prisma.deal_service_assignments.delete({
      where: {
        dealId_serviceId: { dealId: params.id, serviceId },
      },
    });

    return NextResponse.json({ message: 'Service retiré du deal' });
  } catch (error) {
    console.error(`Erreur DELETE /api/deals/${params.id}/services:`, error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
