import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Fonction pour calculer la commission mensuelle (progressive par tranches)
function calculateMonthlyCommission(revenue: number): number {
  let commission = 0;

  if (revenue <= 20000) {
    commission = revenue * 0.05;
  } else if (revenue <= 40000) {
    commission = (20000 * 0.05) + ((revenue - 20000) * 0.10);
  } else if (revenue <= 75000) {
    commission = (20000 * 0.05) + (20000 * 0.10) + ((revenue - 40000) * 0.15);
  } else {
    commission = (20000 * 0.05) + (20000 * 0.10) + (35000 * 0.15) + ((revenue - 75000) * 0.20);
  }

  return commission;
}

// Fonction pour calculer la réduction selon les objectifs
function calculateReduction(signatures: number, rdvCount: number, signaturesGoal: number = 4, rdvGoal: number = 20): number {
  const signaturesReached = signatures >= signaturesGoal;
  const rdvReached = rdvCount >= rdvGoal;

  if (signaturesReached && rdvReached) {
    return 0; // Pas de réduction, objectifs atteints
  } else if (signaturesReached || rdvReached) {
    return 0.5; // Un seul objectif atteint = 50% de réduction
  } else {
    return 1; // Aucun objectif = 100% de réduction
  }
}

// Fonction pour calculer le booster
function calculateBooster(previousMonthsBooster: number, objectivesReached: boolean): { boosterPercent: number; boosterMonthsCount: number } {
  if (!objectivesReached) {
    // Reset du booster si objectifs non atteints
    return { boosterPercent: 0, boosterMonthsCount: 0 };
  }

  // Si objectifs atteints, on ajoute 5% (max 15% = 3 mois)
  const newMonthsCount = Math.min(previousMonthsBooster + 1, 3);
  const newBoosterPercent = newMonthsCount * 0.05; // 5%, 10% ou 15%

  return { boosterPercent: newBoosterPercent, boosterMonthsCount: newMonthsCount };
}

// Fonction pour calculer la prime annuelle
function calculateYearlyBonus(yearlyRevenue: number): number {
  if (yearlyRevenue < 500000) {
    return yearlyRevenue * 0.01; // 1%
  } else {
    return yearlyRevenue * 0.02; // 2%
  }
}

// GET /api/sales-performance - Récupérer les performances
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || session.user.id;
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    // Vérifier les permissions (admin peut voir tous les commerciaux, sinon seulement soi-même)
    if (userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const where: any = { userId };

    if (month && year) {
      where.month = parseInt(month);
      where.year = parseInt(year);
    }

    const performances = await prisma.sales_performance.findMany({
      where,
      include: {
        users: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
      ],
    });

    return NextResponse.json({ performances });
  } catch (error) {
    console.error('Erreur GET /api/sales-performance:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/sales-performance - Mettre à jour les performances
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, month, year, monthlyRevenue, yearlyRevenue, signatures, rdvCount } = body;

    // Vérifier les permissions
    if (userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const now = new Date();
    const currentMonth = month || now.getMonth() + 1;
    const currentYear = year || now.getFullYear();

    // Récupérer la performance du mois précédent pour le booster
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    const previousPerformance = await prisma.sales_performance.findUnique({
      where: {
        userId_month_year: {
          userId: userId || session.user.id,
          month: previousMonth,
          year: previousYear,
        },
      },
    });

    const previousBoosterMonths = previousPerformance?.boosterMonthsCount || 0;

    // Calculer la commission mensuelle
    const commission = calculateMonthlyCommission(monthlyRevenue || 0);

    // Calculer la réduction selon les objectifs
    const reduction = calculateReduction(signatures || 0, rdvCount || 0);

    // Vérifier si les objectifs sont atteints
    const objectivesReached = reduction === 0;

    // Calculer le booster
    const { boosterPercent, boosterMonthsCount } = calculateBooster(previousBoosterMonths, objectivesReached);

    // Calculer la prime mensuelle finale
    const primeAfterReduction = commission * (1 - reduction);
    const finalMonthlyBonus = primeAfterReduction * (1 + boosterPercent);

    // Calculer la prime annuelle
    const yearlyBonus = calculateYearlyBonus(yearlyRevenue || 0);

    // Créer ou mettre à jour la performance
    const performance = await prisma.sales_performance.upsert({
      where: {
        userId_month_year: {
          userId: userId || session.user.id,
          month: currentMonth,
          year: currentYear,
        },
      },
      update: {
        monthlyRevenue: monthlyRevenue || 0,
        yearlyRevenue: yearlyRevenue || 0,
        signatures: signatures || 0,
        rdvCount: rdvCount || 0,
        monthlyCommission: commission,
        reductionPercent: reduction,
        boosterPercent,
        boosterMonthsCount,
        finalMonthlyBonus,
        yearlyBonus,
        objectivesReached,
        updatedAt: new Date(),
      },
      create: {
        id: `PERF-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        userId: userId || session.user.id,
        month: currentMonth,
        year: currentYear,
        monthlyRevenue: monthlyRevenue || 0,
        yearlyRevenue: yearlyRevenue || 0,
        signatures: signatures || 0,
        rdvCount: rdvCount || 0,
        monthlyCommission: commission,
        reductionPercent: reduction,
        boosterPercent,
        boosterMonthsCount,
        finalMonthlyBonus,
        yearlyBonus,
        objectivesReached,
      } as any,
      include: {
        users: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ performance });
  } catch (error) {
    console.error('Erreur POST /api/sales-performance:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
