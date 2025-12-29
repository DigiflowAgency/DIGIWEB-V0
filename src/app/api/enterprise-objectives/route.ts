import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Types
type MetricType = 'CA_MENSUEL' | 'CA_GENERE' | 'NOUVEAUX_DEALS' | 'RDV_REALISES' | 'APPELS_EFFECTUES' | 'DEVIS_ENVOYES' | 'TAUX_CONVERSION' | 'CUSTOM';

// Schema de validation
const objectiveSchema = z.object({
  metricType: z.enum(['CA_MENSUEL', 'CA_GENERE', 'NOUVEAUX_DEALS', 'RDV_REALISES', 'APPELS_EFFECTUES', 'DEVIS_ENVOYES', 'TAUX_CONVERSION', 'CUSTOM']),
  period: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']).default('MONTHLY'),
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12).optional().nullable(),
  quarter: z.number().int().min(1).max(4).optional().nullable(),
  targetValue: z.number().min(0),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
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

// Calcul de projection fin de periode
function calculateProjection(current: number, daysPassed: number, totalDays: number): number {
  if (daysPassed === 0) return current;
  const dailyRate = current / daysPassed;
  return Math.round(dailyRate * totalDays);
}

// GET /api/enterprise-objectives
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : null;
    const period = searchParams.get('period') || 'MONTHLY';

    // Construire le filtre
    const where: any = {
      year,
      isActive: true,
    };

    if (period === 'MONTHLY' && month) {
      where.period = 'MONTHLY';
      where.month = month;
    } else if (period === 'QUARTERLY') {
      where.period = 'QUARTERLY';
    } else if (period === 'YEARLY') {
      where.period = 'YEARLY';
    }

    // Recuperer les objectifs
    const objectives = await prisma.enterprise_objectives.findMany({
      where,
      orderBy: { metricType: 'asc' },
    });

    // Calculer les valeurs actuelles et enrichir les donnees
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const dayOfMonth = now.getDate();
    const totalDaysInMonth = new Date(year, month || currentMonth, 0).getDate();

    const enrichedObjectives = await Promise.all(
      objectives.map(async (obj) => {
        const currentValue = await calculateCurrentValue(
          obj.metricType as MetricType,
          obj.year,
          obj.month,
          obj.period
        );

        const percentage = obj.targetValue > 0
          ? Math.round((currentValue / obj.targetValue) * 100 * 10) / 10
          : 0;

        const remaining = Math.max(0, obj.targetValue - currentValue);

        // Projection seulement pour le mois en cours
        let projection = null;
        if (obj.period === 'MONTHLY' && obj.year === currentYear && obj.month === currentMonth) {
          projection = calculateProjection(currentValue, dayOfMonth, totalDaysInMonth);
        }

        return {
          ...obj,
          currentValue,
          percentage,
          remaining,
          projection,
        };
      })
    );

    // Resume
    const totalObjectives = enrichedObjectives.length;
    const completedObjectives = enrichedObjectives.filter(o => o.percentage >= 100).length;
    const averageCompletion = totalObjectives > 0
      ? Math.round(enrichedObjectives.reduce((sum, o) => sum + o.percentage, 0) / totalObjectives * 10) / 10
      : 0;

    return NextResponse.json({
      objectives: enrichedObjectives,
      summary: {
        totalObjectives,
        completedObjectives,
        averageCompletion,
      },
    });
  } catch (error) {
    console.error('Erreur GET /api/enterprise-objectives:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/enterprise-objectives
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    // Verifier que l'utilisateur est admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Seuls les administrateurs peuvent creer des objectifs entreprise' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = objectiveSchema.parse(body);

    // Verifier si un objectif existe deja pour ce type/periode
    const existing = await prisma.enterprise_objectives.findFirst({
      where: {
        metricType: validatedData.metricType,
        period: validatedData.period,
        year: validatedData.year,
        month: validatedData.month,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Un objectif existe deja pour ce type et cette periode' },
        { status: 409 }
      );
    }

    // Creer l'objectif
    const objective = await prisma.enterprise_objectives.create({
      data: {
        metricType: validatedData.metricType,
        period: validatedData.period,
        year: validatedData.year,
        month: validatedData.month,
        quarter: validatedData.quarter,
        targetValue: validatedData.targetValue,
        title: validatedData.title,
        description: validatedData.description,
      },
    });

    // Calculer la valeur actuelle
    const currentValue = await calculateCurrentValue(
      objective.metricType as MetricType,
      objective.year,
      objective.month,
      objective.period
    );

    return NextResponse.json(
      {
        ...objective,
        currentValue,
        percentage: objective.targetValue > 0
          ? Math.round((currentValue / objective.targetValue) * 100 * 10) / 10
          : 0,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erreur POST /api/enterprise-objectives:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Donnees invalides', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
