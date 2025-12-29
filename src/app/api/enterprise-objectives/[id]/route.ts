import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Types
type MetricType = 'CA_MENSUEL' | 'CA_GENERE' | 'NOUVEAUX_DEALS' | 'RDV_REALISES' | 'APPELS_EFFECTUES' | 'DEVIS_ENVOYES' | 'TAUX_CONVERSION' | 'CUSTOM';

// Schema de validation pour update
const updateSchema = z.object({
  targetValue: z.number().min(0).optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

// Helpers pour les dates de periode
function getStartDate(year: number, month: number | null, period: string): Date {
  if (period === 'MONTHLY' && month) {
    return new Date(year, month - 1, 1, 0, 0, 0, 0);
  } else if (period === 'QUARTERLY' && month) {
    const quarterMonth = (month - 1) * 3;
    return new Date(year, quarterMonth, 1, 0, 0, 0, 0);
  } else {
    return new Date(year, 0, 1, 0, 0, 0, 0);
  }
}

function getEndDate(year: number, month: number | null, period: string): Date {
  if (period === 'MONTHLY' && month) {
    return new Date(year, month, 0, 23, 59, 59, 999);
  } else if (period === 'QUARTERLY' && month) {
    const quarterMonth = month * 3;
    return new Date(year, quarterMonth, 0, 23, 59, 59, 999);
  } else {
    return new Date(year, 11, 31, 23, 59, 59, 999);
  }
}

// Calcul automatique des valeurs actuelles
async function calculateCurrentValue(
  metricType: MetricType,
  year: number,
  month: number | null,
  period: string
): Promise<number> {
  const startDate = getStartDate(year, month, period);
  const endDate = getEndDate(year, month, period);

  switch (metricType) {
    case 'CA_MENSUEL': {
      const result = await prisma.deals.aggregate({
        _sum: { value: true },
        where: {
          productionStage: 'ENCAISSE',
          closedAt: { gte: startDate, lte: endDate },
        },
      });
      return result._sum.value || 0;
    }

    case 'CA_GENERE': {
      const result = await prisma.deals.aggregate({
        _sum: { value: true },
        where: {
          stage: 'CLOSING',
          createdAt: { gte: startDate, lte: endDate },
        },
      });
      return result._sum.value || 0;
    }

    case 'NOUVEAUX_DEALS': {
      return prisma.deals.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      });
    }

    case 'RDV_REALISES': {
      return prisma.activities.count({
        where: {
          type: { in: ['REUNION', 'VISIO'] },
          status: 'COMPLETEE',
          scheduledAt: { gte: startDate, lte: endDate },
        },
      });
    }

    case 'APPELS_EFFECTUES': {
      return prisma.activities.count({
        where: {
          type: 'APPEL',
          createdAt: { gte: startDate, lte: endDate },
        },
      });
    }

    case 'DEVIS_ENVOYES': {
      return prisma.quotes.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      });
    }

    case 'TAUX_CONVERSION': {
      const totalDeals = await prisma.deals.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      });
      const wonDeals = await prisma.deals.count({
        where: {
          stage: 'CLOSING',
          createdAt: { gte: startDate, lte: endDate },
        },
      });
      return totalDeals > 0 ? Math.round((wonDeals / totalDeals) * 100) : 0;
    }

    case 'CUSTOM':
    default:
      return 0;
  }
}

// GET /api/enterprise-objectives/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const objective = await prisma.enterprise_objectives.findUnique({
      where: { id: params.id },
    });

    if (!objective) {
      return NextResponse.json({ error: 'Objectif non trouve' }, { status: 404 });
    }

    // Calculer la valeur actuelle
    const currentValue = await calculateCurrentValue(
      objective.metricType as MetricType,
      objective.year,
      objective.month,
      objective.period
    );

    const percentage = objective.targetValue > 0
      ? Math.round((currentValue / objective.targetValue) * 100 * 10) / 10
      : 0;

    return NextResponse.json({
      ...objective,
      currentValue,
      percentage,
      remaining: Math.max(0, objective.targetValue - currentValue),
    });
  } catch (error) {
    console.error('Erreur GET /api/enterprise-objectives/[id]:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT /api/enterprise-objectives/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    // Verifier que l'utilisateur est admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Seuls les administrateurs peuvent modifier les objectifs entreprise' },
        { status: 403 }
      );
    }

    // Verifier que l'objectif existe
    const existing = await prisma.enterprise_objectives.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Objectif non trouve' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = updateSchema.parse(body);

    // Mettre a jour l'objectif
    const objective = await prisma.enterprise_objectives.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        calculatedAt: new Date(),
      },
    });

    // Calculer la valeur actuelle
    const currentValue = await calculateCurrentValue(
      objective.metricType as MetricType,
      objective.year,
      objective.month,
      objective.period
    );

    return NextResponse.json({
      ...objective,
      currentValue,
      percentage: objective.targetValue > 0
        ? Math.round((currentValue / objective.targetValue) * 100 * 10) / 10
        : 0,
    });
  } catch (error) {
    console.error('Erreur PUT /api/enterprise-objectives/[id]:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Donnees invalides', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/enterprise-objectives/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    // Verifier que l'utilisateur est admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Seuls les administrateurs peuvent supprimer les objectifs entreprise' },
        { status: 403 }
      );
    }

    // Verifier que l'objectif existe
    const existing = await prisma.enterprise_objectives.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Objectif non trouve' }, { status: 404 });
    }

    await prisma.enterprise_objectives.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur DELETE /api/enterprise-objectives/[id]:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
