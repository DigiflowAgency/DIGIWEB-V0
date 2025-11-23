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

// Fonction pour calculer les détails par tranches (pour affichage)
function getCommissionBreakdown(revenue: number) {
  const breakdown = [];

  if (revenue > 0) {
    const tranche1 = Math.min(revenue, 20000);
    breakdown.push({
      tranche: '0 - 20 000 €',
      rate: '5%',
      amount: tranche1,
      commission: tranche1 * 0.05,
    });
  }

  if (revenue > 20000) {
    const tranche2 = Math.min(revenue - 20000, 20000);
    breakdown.push({
      tranche: '20 001 - 40 000 €',
      rate: '10%',
      amount: tranche2,
      commission: tranche2 * 0.10,
    });
  }

  if (revenue > 40000) {
    const tranche3 = Math.min(revenue - 40000, 35000);
    breakdown.push({
      tranche: '40 001 - 75 000 €',
      rate: '15%',
      amount: tranche3,
      commission: tranche3 * 0.15,
    });
  }

  if (revenue > 75000) {
    const tranche4 = revenue - 75000;
    breakdown.push({
      tranche: '> 75 000 €',
      rate: '20%',
      amount: tranche4,
      commission: tranche4 * 0.20,
    });
  }

  return breakdown;
}

// POST /api/sales-performance/calculate - Calculer les primes en temps réel
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const {
      monthlyRevenue = 0,
      yearlyRevenue = 0,
      signatures = 0,
      rdvCount = 0,
      signaturesGoal = 4,
      rdvGoal = 20,
    } = body;

    // Récupérer la performance du mois précédent pour le booster
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    const previousPerformance = await prisma.sales_performance.findUnique({
      where: {
        userId_month_year: {
          userId: session.user.id,
          month: previousMonth,
          year: previousYear,
        },
      },
    });

    const previousBoosterMonths = previousPerformance?.boosterMonthsCount || 0;

    // Calculer la commission mensuelle
    const commission = calculateMonthlyCommission(monthlyRevenue);
    const commissionBreakdown = getCommissionBreakdown(monthlyRevenue);

    // Calculer la réduction selon les objectifs
    const signaturesReached = signatures >= signaturesGoal;
    const rdvReached = rdvCount >= rdvGoal;
    const objectivesReached = signaturesReached && rdvReached;

    let reduction = 0;
    let reductionMessage = '';

    if (objectivesReached) {
      reduction = 0;
      reductionMessage = '✅ Objectifs atteints - Prime pleine';
    } else if (signaturesReached || rdvReached) {
      reduction = 0.5;
      reductionMessage = '⚠ Objectifs partiellement atteints - Prime réduite de 50%';
    } else {
      reduction = 1;
      reductionMessage = '❌ Objectifs non atteints - Prime à 0%';
    }

    // Calculer le booster
    let boosterPercent = 0;
    let boosterMonthsCount = 0;
    let boosterMessage = '';

    if (objectivesReached) {
      boosterMonthsCount = Math.min(previousBoosterMonths + 1, 3);
      boosterPercent = boosterMonthsCount * 0.05;
      boosterMessage = `🚀 Booster actif : +${(boosterPercent * 100).toFixed(0)}% (${boosterMonthsCount}/3 mois)`;
    } else {
      boosterMessage = '❌ Booster réinitialisé (objectifs non atteints)';
    }

    // Calculer la prime mensuelle finale
    const primeAfterReduction = commission * (1 - reduction);
    const finalMonthlyBonus = primeAfterReduction * (1 + boosterPercent);

    // Calculer la prime annuelle
    let yearlyBonus = 0;
    let yearlyBonusRate = 0;

    if (yearlyRevenue < 500000) {
      yearlyBonusRate = 1;
      yearlyBonus = yearlyRevenue * 0.01;
    } else {
      yearlyBonusRate = 2;
      yearlyBonus = yearlyRevenue * 0.02;
    }

    return NextResponse.json({
      calculation: {
        // Objectifs
        objectives: {
          signatures: {
            current: signatures,
            goal: signaturesGoal,
            reached: signaturesReached,
            percentage: Math.min((signatures / signaturesGoal) * 100, 100),
          },
          rdv: {
            current: rdvCount,
            goal: rdvGoal,
            reached: rdvReached,
            percentage: Math.min((rdvCount / rdvGoal) * 100, 100),
          },
          allReached: objectivesReached,
        },
        // Commission
        commission: {
          monthlyRevenue,
          totalCommission: commission,
          breakdown: commissionBreakdown,
        },
        // Réduction
        reduction: {
          percent: reduction * 100,
          message: reductionMessage,
          amountDeducted: commission * reduction,
        },
        // Booster
        booster: {
          percent: boosterPercent * 100,
          monthsCount: boosterMonthsCount,
          message: boosterMessage,
          amountAdded: primeAfterReduction * boosterPercent,
        },
        // Prime mensuelle
        monthlyBonus: {
          baseCommission: commission,
          afterReduction: primeAfterReduction,
          final: finalMonthlyBonus,
        },
        // Prime annuelle
        yearlyBonus: {
          yearlyRevenue,
          rate: yearlyBonusRate,
          bonus: yearlyBonus,
          nextThreshold: yearlyRevenue < 500000 ? 500000 : null,
          percentToNextThreshold: yearlyRevenue < 500000 ? (yearlyRevenue / 500000) * 100 : 100,
        },
      },
    });
  } catch (error) {
    console.error('Erreur POST /api/sales-performance/calculate:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
