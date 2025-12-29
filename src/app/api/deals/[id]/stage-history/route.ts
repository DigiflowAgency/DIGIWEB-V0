import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema de validation pour créer un historique de stage
const stageHistorySchema = z.object({
  fromStage: z.string().min(1),
  toStage: z.string().min(1),
  notes: z.string().optional().nullable(),
});

// GET /api/deals/[id]/stage-history - Liste l'historique des stages d'un deal
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id: dealId } = await params;

    // Vérifier que le deal existe
    const deal = await prisma.deals.findUnique({
      where: { id: dealId },
    });

    if (!deal) {
      return NextResponse.json({ error: 'Deal non trouvé' }, { status: 404 });
    }

    // Récupérer l'historique des stages
    const stageHistory = await prisma.deal_stage_history.findMany({
      where: { dealId },
      include: {
        changedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
      orderBy: { changedAt: 'desc' },
    });

    return NextResponse.json({ stageHistory });
  } catch (error) {
    console.error('Erreur GET /api/deals/[id]/stage-history:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/deals/[id]/stage-history - Ajouter un historique de stage
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id: dealId } = await params;

    // Vérifier que le deal existe
    const deal = await prisma.deals.findUnique({
      where: { id: dealId },
    });

    if (!deal) {
      return NextResponse.json({ error: 'Deal non trouvé' }, { status: 404 });
    }

    // Parser et valider le body
    const body = await request.json();
    const validatedData = stageHistorySchema.parse(body);

    // Créer l'historique
    const historyEntry = await prisma.deal_stage_history.create({
      data: {
        dealId,
        fromStage: validatedData.fromStage,
        toStage: validatedData.toStage,
        notes: validatedData.notes,
        changedById: session.user.id,
      },
      include: {
        changedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json(historyEntry, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /api/deals/[id]/stage-history:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
