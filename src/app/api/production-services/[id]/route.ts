import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

type RouteContext = { params: Promise<{ id: string }> };

// Schema de validation pour mise à jour
const updateServiceSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  color: z.string().optional(),
  position: z.number().optional(),
});

// GET /api/production-services/[id] - Récupérer un service
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await context.params;

    const service = await prisma.production_services.findUnique({
      where: { id },
      include: {
        stages: {
          orderBy: { position: 'asc' },
        },
        _count: {
          select: { deals: true },
        },
      },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service non trouvé' }, { status: 404 });
    }

    return NextResponse.json(service);
  } catch (error) {
    console.error('Erreur GET /api/production-services/[id]:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH /api/production-services/[id] - Modifier un service
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const validatedData = updateServiceSchema.parse(body);

    const service = await prisma.production_services.update({
      where: { id },
      data: validatedData,
      include: {
        stages: {
          orderBy: { position: 'asc' },
        },
      },
    });

    return NextResponse.json(service);
  } catch (error) {
    console.error('Erreur PATCH /api/production-services/[id]:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/production-services/[id] - Supprimer un service
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await context.params;

    // Vérifier si des deals utilisent ce service
    const dealsCount = await prisma.deals.count({
      where: { productionServiceId: id },
    });

    if (dealsCount > 0) {
      return NextResponse.json(
        { error: `Ce service est utilisé par ${dealsCount} deal(s). Veuillez d'abord les réassigner.` },
        { status: 400 }
      );
    }

    await prisma.production_services.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur DELETE /api/production-services/[id]:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
