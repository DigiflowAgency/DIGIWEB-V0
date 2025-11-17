import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

// Schema de validation pour update (tous les champs optionnels)
const reviewUpdateSchema = z.object({
  source: z.enum(['GOOGLE', 'PAGES_JAUNES', 'TRIPADVISOR', 'TRUSTPILOT']).optional(),
  company: z.enum(['DIGIFLOW_AGENCY', 'BE_HYPE']).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  author: z.string().min(1).optional(),
  content: z.string().optional().nullable(),
  reviewDate: z.string().datetime().optional(),
  response: z.string().optional().nullable(),
  respondedAt: z.string().datetime().optional().nullable(),
  externalId: z.string().optional().nullable(),
});

type RouteContext = {
  params: { id: string };
};

// GET /api/reviews/[id] - Récupérer un avis par ID
export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const review = await prisma.review.findUnique({
      where: { id: params.id },
    });

    if (!review) {
      return NextResponse.json(
        { error: 'Avis non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(review);
  } catch (error) {
    console.error(`Erreur GET /api/reviews/${params.id}:`, error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PUT /api/reviews/[id] - Mettre à jour un avis
export async function PUT(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que l'avis existe
    const existingReview = await prisma.review.findUnique({
      where: { id: params.id },
    });

    if (!existingReview) {
      return NextResponse.json(
        { error: 'Avis non trouvé' },
        { status: 404 }
      );
    }

    // Parser et valider le body
    const body = await request.json();
    const validatedData = reviewUpdateSchema.parse(body);

    // Préparer les données de mise à jour
    const updateData: Prisma.ReviewUpdateInput = { ...validatedData };

    // Convertir les dates string en Date si elles existent
    if (validatedData.reviewDate) {
      updateData.reviewDate = new Date(validatedData.reviewDate);
    }
    if (validatedData.respondedAt) {
      updateData.respondedAt = new Date(validatedData.respondedAt);
    }

    // Si une réponse est ajoutée, définir respondedAt automatiquement
    if (validatedData.response && !existingReview.response) {
      updateData.respondedAt = validatedData.respondedAt ? new Date(validatedData.respondedAt) : new Date();
    }

    // Mettre à jour l'avis
    const updatedReview = await prisma.review.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(updatedReview);
  } catch (error) {
    console.error(`Erreur PUT /api/reviews/${params.id}:`, error);

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

// DELETE /api/reviews/[id] - Supprimer un avis
export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que l'avis existe
    const existingReview = await prisma.review.findUnique({
      where: { id: params.id },
    });

    if (!existingReview) {
      return NextResponse.json(
        { error: 'Avis non trouvé' },
        { status: 404 }
      );
    }

    // Supprimer l'avis
    await prisma.review.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Avis supprimé avec succès' });
  } catch (error) {
    console.error(`Erreur DELETE /api/reviews/${params.id}:`, error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
