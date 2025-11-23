import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

// Schema de validation Zod pour Campaign
const campaignSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  type: z.enum(['EMAIL', 'SOCIAL_MEDIA', 'PAID_ADS', 'EVENT']),
  status: z.enum(['BROUILLON', 'PLANIFIEE', 'ACTIVE', 'TERMINEE']).optional(),
  budget: z.number().positive().optional().nullable(),
  spent: z.number().min(0).optional(),
  reach: z.number().int().min(0).optional(),
  clicks: z.number().int().min(0).optional(),
  conversions: z.number().int().min(0).optional(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
});

// GET /api/campaigns - Liste toutes les campagnes
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
    const type = searchParams.get('type');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    // Construire la query Prisma
    const where: Prisma.campaignsWhereInput = {};

    // Filtre par texte de recherche
    if (search) {
      where.OR = [
        { name: { contains: search } },
      ];
    }

    // Filtre par statut
    if (status && ['BROUILLON', 'PLANIFIEE', 'ACTIVE', 'TERMINEE'].includes(status)) {
      where.status = status as 'BROUILLON' | 'PLANIFIEE' | 'ACTIVE' | 'TERMINEE';
    }

    // Filtre par type
    if (type && ['EMAIL', 'SOCIAL_MEDIA', 'PAID_ADS', 'EVENT'].includes(type)) {
      where.type = type as 'EMAIL' | 'SOCIAL_MEDIA' | 'PAID_ADS' | 'EVENT';
    }

    // Récupérer les campagnes
    const campaigns = await prisma.campaigns.findMany({
      where,
      orderBy: [
        { createdAt: 'desc' },
      ],
      take: limit,
    });

    // Calculer des stats
    const stats = {
      total: await prisma.campaigns.count({ where }),
      active: await prisma.campaigns.count({ where: { ...where, status: 'ACTIVE' } }),
      planifiee: await prisma.campaigns.count({ where: { ...where, status: 'PLANIFIEE' } }),
      terminee: await prisma.campaigns.count({ where: { ...where, status: 'TERMINEE' } }),
      totalBudget: await prisma.campaigns.aggregate({
        where,
        _sum: { budget: true },
      }).then(result => result._sum.budget || 0),
      totalSpent: await prisma.campaigns.aggregate({
        where,
        _sum: { spent: true },
      }).then(result => result._sum.spent || 0),
      totalReach: await prisma.campaigns.aggregate({
        where,
        _sum: { reach: true },
      }).then(result => result._sum.reach || 0),
      totalClicks: await prisma.campaigns.aggregate({
        where,
        _sum: { clicks: true },
      }).then(result => result._sum.clicks || 0),
      totalConversions: await prisma.campaigns.aggregate({
        where,
        _sum: { conversions: true },
      }).then(result => result._sum.conversions || 0),
    };

    return NextResponse.json({
      campaigns,
      stats,
    });
  } catch (error) {
    console.error('Erreur GET /api/campaigns:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST /api/campaigns - Créer une nouvelle campagne
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Parser et valider le body
    const body = await request.json();
    const validatedData = campaignSchema.parse(body);

    // Convertir les dates string en Date si elles existent
    const data: any = { ...validatedData };
    if (validatedData.startDate) {
      data.startDate = new Date(validatedData.startDate);
    }
    if (validatedData.endDate) {
      data.endDate = new Date(validatedData.endDate);
    }

    // Créer la campagne
    const campaign = await prisma.campaigns.create({
      data: data as any,
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /api/campaigns:', error);

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
