import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

// Schema de validation Zod pour SocialPost
const socialPostSchema = z.object({
  content: z.string().min(1, 'Le contenu est requis'),
  platform: z.enum(['FACEBOOK', 'LINKEDIN', 'INSTAGRAM', 'TWITTER']),
  status: z.enum(['BROUILLON', 'PLANIFIE', 'PUBLIE']).optional(),
  likes: z.number().int().min(0).optional(),
  comments: z.number().int().min(0).optional(),
  shares: z.number().int().min(0).optional(),
  reach: z.number().int().min(0).optional(),
  scheduledAt: z.string().datetime().optional().nullable(),
  publishedAt: z.string().datetime().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  videoUrl: z.string().url().optional().nullable(),
});

// GET /api/social-posts - Liste tous les posts
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
    const status = searchParams.get('status');
    const platform = searchParams.get('platform');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    // Construire la query Prisma
    const where: Prisma.SocialPostWhereInput = {};

    // Filtre par texte de recherche
    if (search) {
      where.OR = [
        { content: { contains: search } },
      ];
    }

    // Filtre par statut
    if (status && ['BROUILLON', 'PLANIFIE', 'PUBLIE'].includes(status)) {
      where.status = status as 'BROUILLON' | 'PLANIFIE' | 'PUBLIE';
    }

    // Filtre par plateforme
    if (platform && ['FACEBOOK', 'LINKEDIN', 'INSTAGRAM', 'TWITTER'].includes(platform)) {
      where.platform = platform as 'FACEBOOK' | 'LINKEDIN' | 'INSTAGRAM' | 'TWITTER';
    }

    // Récupérer les posts
    const posts = await prisma.socialPost.findMany({
      where,
      orderBy: [
        { createdAt: 'desc' },
      ],
      take: limit,
    });

    // Calculer des stats
    const stats = {
      total: await prisma.socialPost.count({ where }),
      publie: await prisma.socialPost.count({ where: { ...where, status: 'PUBLIE' } }),
      planifie: await prisma.socialPost.count({ where: { ...where, status: 'PLANIFIE' } }),
      brouillon: await prisma.socialPost.count({ where: { ...where, status: 'BROUILLON' } }),
      totalLikes: await prisma.socialPost.aggregate({
        where,
        _sum: { likes: true },
      }).then(result => result._sum.likes || 0),
      totalComments: await prisma.socialPost.aggregate({
        where,
        _sum: { comments: true },
      }).then(result => result._sum.comments || 0),
      totalShares: await prisma.socialPost.aggregate({
        where,
        _sum: { shares: true },
      }).then(result => result._sum.shares || 0),
      totalReach: await prisma.socialPost.aggregate({
        where,
        _sum: { reach: true },
      }).then(result => result._sum.reach || 0),
    };

    return NextResponse.json({
      posts,
      stats,
    });
  } catch (error) {
    console.error('Erreur GET /api/social-posts:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST /api/social-posts - Créer un nouveau post
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Parser et valider le body
    const body = await request.json();
    const validatedData = socialPostSchema.parse(body);

    // Convertir les dates string en Date si elles existent
    const data: Prisma.SocialPostCreateInput = { ...validatedData };
    if (validatedData.scheduledAt) {
      data.scheduledAt = new Date(validatedData.scheduledAt);
    }
    if (validatedData.publishedAt) {
      data.publishedAt = new Date(validatedData.publishedAt);
    }

    // Créer le post
    const post = await prisma.socialPost.create({
      data,
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /api/social-posts:', error);

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
