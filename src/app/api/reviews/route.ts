import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

// Schema de validation Zod pour Review
const reviewSchema = z.object({
  source: z.enum(['GOOGLE', 'PAGES_JAUNES', 'TRIPADVISOR', 'TRUSTPILOT']),
  company: z.enum(['DIGIFLOW_AGENCY', 'BE_HYPE']),
  rating: z.number().int().min(1).max(5),
  author: z.string().min(1, 'L\'auteur est requis'),
  content: z.string().optional().nullable(),
  reviewDate: z.string().datetime(),
  response: z.string().optional().nullable(),
  respondedAt: z.string().datetime().optional().nullable(),
  externalId: z.string().optional().nullable(),
});

// GET /api/reviews - Liste tous les avis
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Paramètres de recherche/filtrage
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const source = searchParams.get('source');
    const company = searchParams.get('company');
    const rating = searchParams.get('rating') ? parseInt(searchParams.get('rating')!) : undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    // Construire la query Prisma
    const where: Prisma.ReviewWhereInput = {};

    // Filtre par texte de recherche
    if (search) {
      where.OR = [
        { author: { contains: search } },
        { content: { contains: search } },
      ];
    }

    // Filtre par source
    if (source && ['GOOGLE', 'PAGES_JAUNES', 'TRIPADVISOR', 'TRUSTPILOT'].includes(source)) {
      where.source = source as 'GOOGLE' | 'PAGES_JAUNES' | 'TRIPADVISOR' | 'TRUSTPILOT';
    }

    // Filtre par entreprise
    if (company && ['DIGIFLOW_AGENCY', 'BE_HYPE'].includes(company)) {
      where.company = company as 'DIGIFLOW_AGENCY' | 'BE_HYPE';
    }

    // Filtre par note
    if (rating && rating >= 1 && rating <= 5) {
      where.rating = rating;
    }

    // Récupérer les avis
    const reviews = await prisma.review.findMany({
      where,
      orderBy: [
        { reviewDate: 'desc' },
      ],
      take: limit,
    });

    // Calculer des stats
    const allReviews = await prisma.review.findMany({ where });
    const avgRating = allReviews.length > 0
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
      : 0;

    const stats = {
      total: allReviews.length,
      avgRating: Number(avgRating.toFixed(1)),
      rating5: allReviews.filter(r => r.rating === 5).length,
      rating4: allReviews.filter(r => r.rating === 4).length,
      rating3: allReviews.filter(r => r.rating === 3).length,
      rating2: allReviews.filter(r => r.rating === 2).length,
      rating1: allReviews.filter(r => r.rating === 1).length,
      withResponse: allReviews.filter(r => r.response !== null).length,
      satisfactionRate: allReviews.length > 0
        ? Math.round((allReviews.filter(r => r.rating >= 4).length / allReviews.length) * 100)
        : 0,
      bySource: {
        google: allReviews.filter(r => r.source === 'GOOGLE').length,
        pagesJaunes: allReviews.filter(r => r.source === 'PAGES_JAUNES').length,
        tripadvisor: allReviews.filter(r => r.source === 'TRIPADVISOR').length,
        trustpilot: allReviews.filter(r => r.source === 'TRUSTPILOT').length,
      },
    };

    return NextResponse.json({
      reviews,
      stats,
    });
  } catch (error) {
    console.error('Erreur GET /api/reviews:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST /api/reviews - Créer un nouvel avis
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Parser et valider le body
    const body = await request.json();
    const validatedData = reviewSchema.parse(body);

    // Convertir les dates string en Date
    const data: Prisma.ReviewCreateInput = {
      ...validatedData,
      reviewDate: new Date(validatedData.reviewDate),
    };

    if (validatedData.respondedAt) {
      data.respondedAt = new Date(validatedData.respondedAt);
    }

    // Créer l'avis
    const review = await prisma.review.create({
      data,
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /api/reviews:', error);

    // Erreur de validation Zod
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
