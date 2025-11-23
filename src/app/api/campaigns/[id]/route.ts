import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

// Schema de validation pour update (tous les champs optionnels)
const campaignUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(['EMAIL', 'SOCIAL_MEDIA', 'PAID_ADS', 'EVENT']).optional(),
  status: z.enum(['BROUILLON', 'PLANIFIEE', 'ACTIVE', 'TERMINEE']).optional(),
  budget: z.number().positive().optional().nullable(),
  spent: z.number().min(0).optional(),
  reach: z.number().int().min(0).optional(),
  clicks: z.number().int().min(0).optional(),
  conversions: z.number().int().min(0).optional(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
});

type RouteContext = {
  params: { id: string };
};

// GET /api/campaigns/[id] - Récupérer une campagne par ID
export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const campaign = await prisma.campaigns.findUnique({
      where: { id: params.id },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campagne non trouvée' },
        { status: 404 }
      );
    }

    return NextResponse.json(campaign);
  } catch (error) {
    console.error(`Erreur GET /api/campaigns/${params.id}:`, error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PUT /api/campaigns/[id] - Mettre à jour une campagne
export async function PUT(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que la campagne existe
    const existingCampaign = await prisma.campaigns.findUnique({
      where: { id: params.id },
    });

    if (!existingCampaign) {
      return NextResponse.json(
        { error: 'Campagne non trouvée' },
        { status: 404 }
      );
    }

    // Parser et valider le body
    const body = await request.json();
    const validatedData = campaignUpdateSchema.parse(body);

    // Préparer les données de mise à jour
    const updateData: Prisma.campaignsUpdateInput = { ...validatedData };

    // Convertir les dates string en Date si elles existent
    if (validatedData.startDate) {
      updateData.startDate = new Date(validatedData.startDate);
    }
    if (validatedData.endDate) {
      updateData.endDate = new Date(validatedData.endDate);
    }

    // Mettre à jour la campagne
    const updatedCampaign = await prisma.campaigns.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(updatedCampaign);
  } catch (error) {
    console.error(`Erreur PUT /api/campaigns/${params.id}:`, error);

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

// DELETE /api/campaigns/[id] - Supprimer une campagne
export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que la campagne existe
    const existingCampaign = await prisma.campaigns.findUnique({
      where: { id: params.id },
    });

    if (!existingCampaign) {
      return NextResponse.json(
        { error: 'Campagne non trouvée' },
        { status: 404 }
      );
    }

    // Supprimer la campagne
    await prisma.campaigns.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Campagne supprimée avec succès' });
  } catch (error) {
    console.error(`Erreur DELETE /api/campaigns/${params.id}:`, error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
