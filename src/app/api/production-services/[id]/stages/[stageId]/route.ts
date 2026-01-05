import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

type RouteContext = { params: Promise<{ id: string; stageId: string }> };

// Schema de validation pour mise à jour
const updateStageSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  color: z.string().optional(),
  position: z.number().optional(),
});

// PATCH /api/production-services/[id]/stages/[stageId] - Modifier un stage
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { stageId } = await context.params;
    const body = await request.json();
    const validatedData = updateStageSchema.parse(body);

    const stage = await prisma.production_service_stages.update({
      where: { id: stageId },
      data: validatedData,
    });

    return NextResponse.json(stage);
  } catch (error) {
    console.error('Erreur PATCH /api/production-services/[id]/stages/[stageId]:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/production-services/[id]/stages/[stageId] - Supprimer un stage
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { stageId } = await context.params;

    // Vérifier si des deals utilisent ce stage
    const dealsCount = await prisma.deals.count({
      where: { productionStageId: stageId },
    });

    if (dealsCount > 0) {
      return NextResponse.json(
        { error: `Ce stage est utilisé par ${dealsCount} deal(s). Veuillez d'abord les déplacer.` },
        { status: 400 }
      );
    }

    await prisma.production_service_stages.delete({
      where: { id: stageId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur DELETE /api/production-services/[id]/stages/[stageId]:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
