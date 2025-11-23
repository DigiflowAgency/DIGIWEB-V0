import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/analytics - Récupérer tous les KPIs (admin seulement)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que l'utilisateur est admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès réservé aux administrateurs' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'month'; // month, quarter, year, all

    // Calculer les dates selon la période
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate = new Date(0); // Tout
    }

    // 1. CA TOTAL GÉNÉRÉ (deals gagnés)
    const wonDeals = await prisma.deals.findMany({
      where: {
        closedAt: period !== 'all' ? { gte: startDate, not: null } : { not: null },
      },
    });
    const totalRevenue = wonDeals.reduce((sum, deal) => sum + deal.value, 0);

    // 2. CA ENCAISSÉ
    const encaissedDeals = await prisma.deals.findMany({
      where: {
        productionStage: 'ENCAISSE',
        closedAt: period !== 'all' ? { gte: startDate } : undefined,
      },
    });
    const encaissedRevenue = encaissedDeals.reduce((sum, deal) => sum + deal.value, 0);

    // 3. NOUVEAUX LEADS (contacts créés)
    const newLeads = await prisma.contacts.count({
      where: {
        createdAt: period !== 'all' ? { gte: startDate } : undefined,
      },
    });

    // 4. PROPOSITIONS ENVOYÉES (devis envoyés)
    const sentQuotes = await prisma.quotes.count({
      where: {
        status: { in: ['ENVOYE', 'ACCEPTE'] },
        issuedAt: period !== 'all' ? { gte: startDate } : undefined,
      },
    });

    // 5. TAUX DE CONVERSION (leads → deals gagnés)
    const totalContacts = await prisma.contacts.count();
    const totalWonDeals = await prisma.deals.count({
      where: { closedAt: { not: null } },
    });
    const conversionRate = totalContacts > 0 ? (totalWonDeals / totalContacts) * 100 : 0;

    // 6. PANIER MOYEN
    const averageBasket = wonDeals.length > 0 ? totalRevenue / wonDeals.length : 0;

    // 7. ACTIVITÉS RÉALISÉES
    const completedActivities = await prisma.activities.count({
      where: {
        status: 'COMPLETEE',
        completedAt: period !== 'all' ? { gte: startDate } : undefined,
      },
    });

    // 8. DEALS EN COURS (pipeline actuel)
    const activeDeals = await prisma.deals.count({
      where: {
        AND: [
          { closedAt: null },
          { stage: { not: 'REFUSE' } },
        ],
      },
    });

    // 9. PRÉVISIONS CA (deals en cours × probabilité)
    const pipelineDeals = await prisma.deals.findMany({
      where: {
        AND: [
          { closedAt: null },
          { stage: { not: 'REFUSE' } },
        ],
      },
    });
    const forecastRevenue = pipelineDeals.reduce(
      (sum, deal) => sum + (deal.value * deal.probability) / 100,
      0
    );

    // 10. RÉPARTITION PAR STAGE
    const dealsByStage = await prisma.deals.groupBy({
      by: ['stage'],
      _count: { stage: true },
      _sum: { value: true },
    });

    // 11. PERFORMANCE PAR COMMERCIAL
    const userPerformance = await prisma.users.findMany({
      where: {
        status: 'ACTIVE',
        role: { in: ['VENTE', 'ACCOUNT_MANAGEMENT'] },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatar: true,
        deals: {
          where: {
            closedAt: period !== 'all' ? { gte: startDate, not: null } : { not: null },
          },
          select: {
            value: true,
          },
        },
        contacts: {
          where: {
            createdAt: period !== 'all' ? { gte: startDate } : undefined,
          },
          select: {
            id: true,
          },
        },
        activities: {
          where: {
            status: 'COMPLETEE',
            completedAt: period !== 'all' ? { gte: startDate } : undefined,
          },
          select: {
            id: true,
          },
        },
      },
    });

    const performance = userPerformance.map((user) => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      avatar: user.avatar,
      revenue: user.deals.reduce((sum, deal) => sum + deal.value, 0),
      dealsCount: user.deals.length,
      leadsCount: user.contacts.length,
      activitiesCount: user.activities.length,
    })).sort((a, b) => b.revenue - a.revenue);

    // 12. ÉVOLUTION MENSUELLE (12 derniers mois)
    const monthlyEvolution = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now);
      monthStart.setMonth(now.getMonth() - i);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthStart.getMonth() + 1);

      const monthDeals = await prisma.deals.findMany({
        where: {
          closedAt: {
            gte: monthStart,
            lt: monthEnd,
          },
        },
      });

      const monthLeads = await prisma.contacts.count({
        where: {
          createdAt: {
            gte: monthStart,
            lt: monthEnd,
          },
        },
      });

      monthlyEvolution.push({
        month: monthStart.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
        revenue: monthDeals.reduce((sum, deal) => sum + deal.value, 0),
        deals: monthDeals.length,
        leads: monthLeads,
      });
    }

    // 13. TEMPS MOYEN DE CLOSING
    const closedDealsWithDuration = await prisma.deals.findMany({
      where: {
        closedAt: { not: null },
        createdAt: period !== 'all' ? { gte: startDate } : undefined,
      },
      select: {
        createdAt: true,
        closedAt: true,
      },
    });

    let averageClosingTime = 0;
    if (closedDealsWithDuration.length > 0) {
      const totalDays = closedDealsWithDuration.reduce((sum, deal) => {
        const created = new Date(deal.createdAt);
        const closed = new Date(deal.closedAt!);
        const days = Math.floor((closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        return sum + days;
      }, 0);
      averageClosingTime = Math.round(totalDays / closedDealsWithDuration.length);
    }

    // 14. ACTIVITÉS PAR TYPE
    const activitiesByType = await prisma.activities.groupBy({
      by: ['type'],
      where: {
        status: 'COMPLETEE',
        completedAt: period !== 'all' ? { gte: startDate } : undefined,
      },
      _count: { type: true },
    });

    // 15. DEVIS - Taux d'acceptation
    const totalQuotes = await prisma.quotes.count({
      where: {
        issuedAt: period !== 'all' ? { gte: startDate } : undefined,
      },
    });
    const acceptedQuotes = await prisma.quotes.count({
      where: {
        status: 'ACCEPTE',
        acceptedAt: period !== 'all' ? { gte: startDate } : undefined,
      },
    });
    const quoteAcceptanceRate = totalQuotes > 0 ? (acceptedQuotes / totalQuotes) * 100 : 0;

    const analytics = {
      period,
      kpis: {
        totalRevenue,
        encaissedRevenue,
        newLeads,
        sentQuotes,
        conversionRate,
        averageBasket,
        completedActivities,
        activeDeals,
        forecastRevenue,
        averageClosingTime,
        quoteAcceptanceRate,
      },
      dealsByStage,
      performance,
      monthlyEvolution,
      activitiesByType,
    };

    return NextResponse.json({ analytics });
  } catch (error) {
    console.error('Erreur GET /api/analytics:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
