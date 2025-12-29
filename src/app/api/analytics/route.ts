import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Labels pour les stages
const STAGE_LABELS: Record<string, string> = {
  A_CONTACTER: 'A contacter',
  EN_DISCUSSION: 'En discussion',
  A_RELANCER: 'A relancer',
  RDV_PRIS: 'RDV pris',
  NEGO_HOT: 'Nego HOT',
  CLOSING: 'Closing',
  REFUSE: 'Refuse',
};

// Labels pour les objections
const OBJECTION_LABELS: Record<string, string> = {
  PRICE: 'Prix',
  TIMING: 'Timing',
  COMPETITOR: 'Concurrent',
  NO_NEED: 'Pas de besoin',
  OTHER: 'Autre',
};

// Labels pour les next actions
const NEXT_ACTION_LABELS: Record<string, string> = {
  CALLBACK: 'Rappeler',
  SEND_QUOTE: 'Envoyer devis',
  MEETING: 'RDV',
  FOLLOWUP: 'Relance',
  CLOSE: 'Closer',
};

// Helper: calculer variation en pourcentage
function calculateVariation(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

// GET /api/analytics - Analytics complets avec comparaison temporelle
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acces reserve aux administrateurs' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'month';

    // Calculer les dates de la periode actuelle et precedente
    const now = new Date();
    let currentStart: Date;
    let previousStart: Date;
    let previousEnd: Date;

    switch (period) {
      case 'week':
        currentStart = new Date(now);
        currentStart.setDate(now.getDate() - 7);
        previousEnd = new Date(currentStart);
        previousStart = new Date(previousEnd);
        previousStart.setDate(previousEnd.getDate() - 7);
        break;
      case 'month':
        currentStart = new Date(now);
        currentStart.setMonth(now.getMonth() - 1);
        previousEnd = new Date(currentStart);
        previousStart = new Date(previousEnd);
        previousStart.setMonth(previousEnd.getMonth() - 1);
        break;
      case 'quarter':
        currentStart = new Date(now);
        currentStart.setMonth(now.getMonth() - 3);
        previousEnd = new Date(currentStart);
        previousStart = new Date(previousEnd);
        previousStart.setMonth(previousEnd.getMonth() - 3);
        break;
      case 'year':
        currentStart = new Date(now);
        currentStart.setFullYear(now.getFullYear() - 1);
        previousEnd = new Date(currentStart);
        previousStart = new Date(previousEnd);
        previousStart.setFullYear(previousEnd.getFullYear() - 1);
        break;
      default:
        currentStart = new Date(0);
        previousStart = new Date(0);
        previousEnd = new Date(0);
    }

    const isAllTime = period === 'all';
    const currentDateFilter = isAllTime ? undefined : { gte: currentStart };
    const previousDateFilter = isAllTime ? undefined : { gte: previousStart, lt: previousEnd };

    // ========================================
    // 1. KPIs PERIODE ACTUELLE
    // ========================================

    // CA Genere (deals closes)
    const currentWonDeals = await prisma.deals.findMany({
      where: {
        closedAt: isAllTime ? { not: null } : { gte: currentStart, not: null },
      },
    });
    const currentCA = currentWonDeals.reduce((sum, d) => sum + d.value, 0);

    // CA Encaisse
    const currentEncaisse = await prisma.deals.findMany({
      where: {
        productionStage: 'ENCAISSE',
        closedAt: currentDateFilter,
      },
    });
    const currentCAEncaisse = currentEncaisse.reduce((sum, d) => sum + d.value, 0);

    // Nouveaux leads
    const currentLeads = await prisma.contacts.count({
      where: { createdAt: currentDateFilter },
    });

    // Devis envoyes
    const currentDevisEnvoyes = await prisma.quotes.count({
      where: {
        status: { in: ['ENVOYE', 'ACCEPTE', 'REFUSE'] },
        issuedAt: currentDateFilter,
      },
    });

    // Devis acceptes
    const currentDevisAcceptes = await prisma.quotes.count({
      where: {
        status: 'ACCEPTE',
        acceptedAt: currentDateFilter,
      },
    });

    // Taux conversion
    const totalContacts = await prisma.contacts.count();
    const totalWonDeals = await prisma.deals.count({ where: { closedAt: { not: null } } });
    const currentConversionRate = totalContacts > 0 ? (totalWonDeals / totalContacts) * 100 : 0;

    // Panier moyen
    const currentPanierMoyen = currentWonDeals.length > 0 ? currentCA / currentWonDeals.length : 0;

    // Deals actifs
    const currentActiveDeals = await prisma.deals.count({
      where: {
        closedAt: null,
        stage: { notIn: ['REFUSE'] },
      },
    });

    // Forecast CA
    const pipelineDeals = await prisma.deals.findMany({
      where: {
        closedAt: null,
        stage: { notIn: ['REFUSE'] },
      },
    });
    const currentForecastCA = pipelineDeals.reduce(
      (sum, d) => sum + (d.value * d.probability) / 100,
      0
    );

    // Temps moyen closing
    const closedDeals = await prisma.deals.findMany({
      where: {
        closedAt: isAllTime ? { not: null } : { gte: currentStart, not: null },
      },
      select: { createdAt: true, closedAt: true },
    });
    let currentTempsClosing = 0;
    if (closedDeals.length > 0) {
      const totalDays = closedDeals.reduce((sum, d) => {
        const days = Math.floor(
          (new Date(d.closedAt!).getTime() - new Date(d.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        );
        return sum + days;
      }, 0);
      currentTempsClosing = Math.round(totalDays / closedDeals.length);
    }

    // ========================================
    // 2. KPIs PERIODE PRECEDENTE (pour comparaison)
    // ========================================

    let previousCA = 0;
    let previousCAEncaisse = 0;
    let previousLeads = 0;
    let previousDevisEnvoyes = 0;
    let previousDevisAcceptes = 0;
    let previousPanierMoyen = 0;
    let previousTempsClosing = 0;

    if (!isAllTime) {
      const prevWonDeals = await prisma.deals.findMany({
        where: { closedAt: { gte: previousStart, lt: previousEnd } },
      });
      previousCA = prevWonDeals.reduce((sum, d) => sum + d.value, 0);
      previousPanierMoyen = prevWonDeals.length > 0 ? previousCA / prevWonDeals.length : 0;

      const prevEncaisse = await prisma.deals.findMany({
        where: {
          productionStage: 'ENCAISSE',
          closedAt: previousDateFilter,
        },
      });
      previousCAEncaisse = prevEncaisse.reduce((sum, d) => sum + d.value, 0);

      previousLeads = await prisma.contacts.count({
        where: { createdAt: previousDateFilter },
      });

      previousDevisEnvoyes = await prisma.quotes.count({
        where: {
          status: { in: ['ENVOYE', 'ACCEPTE', 'REFUSE'] },
          issuedAt: previousDateFilter,
        },
      });

      previousDevisAcceptes = await prisma.quotes.count({
        where: {
          status: 'ACCEPTE',
          acceptedAt: previousDateFilter,
        },
      });

      const prevClosedDeals = await prisma.deals.findMany({
        where: { closedAt: previousDateFilter },
        select: { createdAt: true, closedAt: true },
      });
      if (prevClosedDeals.length > 0) {
        const totalDays = prevClosedDeals.reduce((sum, d) => {
          const days = Math.floor(
            (new Date(d.closedAt!).getTime() - new Date(d.createdAt).getTime()) / (1000 * 60 * 60 * 24)
          );
          return sum + days;
        }, 0);
        previousTempsClosing = Math.round(totalDays / prevClosedDeals.length);
      }
    }

    // ========================================
    // 3. ACTIVITES DETAILLEES
    // ========================================

    const activitiesFilter = {
      scheduledAt: currentDateFilter,
    };

    // Appels
    const appels = await prisma.activities.findMany({
      where: { ...activitiesFilter, type: 'APPEL' },
    });
    const appelsRepondus = appels.filter((a) => a.outcome === 'ANSWERED').length;
    const appelsMessagerie = appels.filter((a) => a.outcome === 'VOICEMAIL').length;
    const appelsPasReponse = appels.filter((a) => a.outcome === 'NO_ANSWER').length;
    const appelsRappel = appels.filter((a) => a.outcome === 'CALLBACK').length;
    const appelsAvecDuree = appels.filter((a) => a.duration && a.outcome === 'ANSWERED');
    const dureeMoyenneAppel =
      appelsAvecDuree.length > 0
        ? Math.round(appelsAvecDuree.reduce((sum, a) => sum + (a.duration || 0), 0) / appelsAvecDuree.length)
        : 0;

    // RDV
    const rdv = await prisma.activities.findMany({
      where: { ...activitiesFilter, type: { in: ['REUNION', 'VISIO'] } },
    });
    const rdvEffectues = rdv.filter((a) => a.status === 'COMPLETEE').length;
    const rdvAnnules = rdv.filter((a) => a.status === 'ANNULEE').length;
    const rdvAvecDuree = rdv.filter((a) => a.duration && a.status === 'COMPLETEE');
    const dureeMoyenneRdv =
      rdvAvecDuree.length > 0
        ? Math.round(rdvAvecDuree.reduce((sum, a) => sum + (a.duration || 0), 0) / rdvAvecDuree.length)
        : 0;

    // Emails
    const emails = await prisma.activities.count({
      where: { ...activitiesFilter, type: 'EMAIL' },
    });

    // ========================================
    // 4. QUALIFICATION
    // ========================================

    const allActivities = await prisma.activities.findMany({
      where: activitiesFilter,
    });

    // Temperature
    const activitesAvecTemp = allActivities.filter((a) => a.temperature);
    const leadsHot = activitesAvecTemp.filter((a) => a.temperature === 'HOT').length;
    const leadsWarm = activitesAvecTemp.filter((a) => a.temperature === 'WARM').length;
    const leadsCold = activitesAvecTemp.filter((a) => a.temperature === 'COLD').length;

    // Budget
    const activitesAvecBudget = allActivities.filter((a) => a.budgetDiscussed !== null);
    const budgetDiscute = activitesAvecBudget.filter((a) => a.budgetDiscussed === true).length;
    const budgetNonDiscute = activitesAvecBudget.filter((a) => a.budgetDiscussed === false).length;

    // Decideur
    const activitesAvecDecideur = allActivities.filter((a) => a.decisionMaker !== null);
    const decideurIdentifie = activitesAvecDecideur.filter((a) => a.decisionMaker === true).length;
    const decideurNonIdentifie = activitesAvecDecideur.filter((a) => a.decisionMaker === false).length;

    // Objections
    const objectionsCounts: Record<string, number> = {};
    allActivities.forEach((a) => {
      if (a.mainObjection) {
        objectionsCounts[a.mainObjection] = (objectionsCounts[a.mainObjection] || 0) + 1;
      }
    });
    const totalObjections = Object.values(objectionsCounts).reduce((sum, c) => sum + c, 0);
    const objections = Object.entries(objectionsCounts).map(([type, count]) => ({
      type,
      label: OBJECTION_LABELS[type] || type,
      count,
      percentage: totalObjections > 0 ? Math.round((count / totalObjections) * 100) : 0,
    }));

    // Next actions
    const nextActionsCounts: Record<string, number> = {};
    allActivities.forEach((a) => {
      if (a.nextAction) {
        nextActionsCounts[a.nextAction] = (nextActionsCounts[a.nextAction] || 0) + 1;
      }
    });
    const nextActions = Object.entries(nextActionsCounts).map(([type, count]) => ({
      type,
      label: NEXT_ACTION_LABELS[type] || type,
      count,
    }));

    // ========================================
    // 5. PIPELINE
    // ========================================

    const dealsByStage = await prisma.deals.groupBy({
      by: ['stage'],
      where: {
        closedAt: null,
        stage: { notIn: ['REFUSE'] },
      },
      _count: { stage: true },
      _sum: { value: true },
    });

    const pipelineByStage = dealsByStage.map((s) => ({
      stage: s.stage,
      label: STAGE_LABELS[s.stage] || s.stage,
      count: s._count.stage,
      value: s._sum.value || 0,
    }));

    const pipelineTotal = {
      count: pipelineDeals.length,
      value: pipelineDeals.reduce((sum, d) => sum + d.value, 0),
      weighted: currentForecastCA,
      avgDeal: pipelineDeals.length > 0
        ? Math.round(pipelineDeals.reduce((sum, d) => sum + d.value, 0) / pipelineDeals.length)
        : 0,
    };

    // ========================================
    // 6. DEVIS DETAILLES
    // ========================================

    const devisEnvoyes = await prisma.quotes.count({
      where: { status: 'ENVOYE', issuedAt: currentDateFilter },
    });
    const devisAcceptes = await prisma.quotes.count({
      where: { status: 'ACCEPTE', acceptedAt: currentDateFilter },
    });
    const devisRefuses = await prisma.quotes.count({
      where: { status: 'REFUSE', issuedAt: currentDateFilter },
    });
    const devisExpires = await prisma.quotes.count({
      where: {
        OR: [
          { status: 'EXPIRE' },
          { expiresAt: { lt: now }, status: 'ENVOYE' },
        ],
        issuedAt: currentDateFilter,
      },
    });
    const devisEnAttente = await prisma.quotes.count({
      where: { status: 'BROUILLON', createdAt: currentDateFilter },
    });

    // Devis expirant cette semaine
    const nextWeek = new Date(now);
    nextWeek.setDate(now.getDate() + 7);
    const devisExpirantSemaine = await prisma.quotes.count({
      where: {
        status: 'ENVOYE',
        expiresAt: { gte: now, lt: nextWeek },
      },
    });

    // Valeur moyenne devis
    const allQuotes = await prisma.quotes.findMany({
      where: {
        status: { in: ['ENVOYE', 'ACCEPTE'] },
        issuedAt: currentDateFilter,
      },
      select: { total: true },
    });
    const valeurMoyenneDevis = allQuotes.length > 0
      ? Math.round(allQuotes.reduce((sum, q) => sum + q.total, 0) / allQuotes.length)
      : 0;

    // Temps moyen acceptation
    const acceptedQuotesWithDates = await prisma.quotes.findMany({
      where: {
        status: 'ACCEPTE',
        acceptedAt: currentDateFilter,
      },
      select: { issuedAt: true, acceptedAt: true },
    });
    let tempsMoyenAcceptation = 0;
    if (acceptedQuotesWithDates.length > 0) {
      const totalDays = acceptedQuotesWithDates.reduce((sum, q) => {
        if (q.issuedAt && q.acceptedAt) {
          const days = Math.floor(
            (new Date(q.acceptedAt).getTime() - new Date(q.issuedAt).getTime()) / (1000 * 60 * 60 * 24)
          );
          return sum + days;
        }
        return sum;
      }, 0);
      tempsMoyenAcceptation = Math.round(totalDays / acceptedQuotesWithDates.length);
    }

    const tauxAcceptationDevis = currentDevisEnvoyes > 0
      ? Math.round((currentDevisAcceptes / currentDevisEnvoyes) * 100)
      : 0;

    // ========================================
    // 7. FUNNEL CONVERSION
    // ========================================

    const funnelLeads = await prisma.contacts.count({
      where: { createdAt: currentDateFilter },
    });
    const funnelContacts = await prisma.contacts.count({
      where: {
        status: { in: ['PROSPECT', 'CLIENT'] },
        createdAt: currentDateFilter,
      },
    });
    const funnelRdvPris = await prisma.deals.count({
      where: {
        stage: { in: ['RDV_PRIS', 'NEGO_HOT', 'CLOSING'] },
        createdAt: currentDateFilter,
      },
    });
    const funnelDevisEnvoyes = currentDevisEnvoyes;
    const funnelSignatures = currentDevisAcceptes;

    const funnel = {
      leads: funnelLeads,
      contacts: funnelContacts,
      rdvPris: funnelRdvPris,
      devisEnvoyes: funnelDevisEnvoyes,
      signatures: funnelSignatures,
      taux: {
        leadToContact: funnelLeads > 0 ? Math.round((funnelContacts / funnelLeads) * 100) : 0,
        contactToRdv: funnelContacts > 0 ? Math.round((funnelRdvPris / funnelContacts) * 100) : 0,
        rdvToDevis: funnelRdvPris > 0 ? Math.round((funnelDevisEnvoyes / funnelRdvPris) * 100) : 0,
        devisToSignature: funnelDevisEnvoyes > 0 ? Math.round((funnelSignatures / funnelDevisEnvoyes) * 100) : 0,
        global: funnelLeads > 0 ? Math.round((funnelSignatures / funnelLeads) * 100) : 0,
      },
    };

    // ========================================
    // 8. EVOLUTION MENSUELLE (12 mois)
    // ========================================

    const monthlyEvolution = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now);
      monthStart.setMonth(now.getMonth() - i);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthStart.getMonth() + 1);

      const monthDeals = await prisma.deals.findMany({
        where: { closedAt: { gte: monthStart, lt: monthEnd } },
      });

      const monthLeads = await prisma.contacts.count({
        where: { createdAt: { gte: monthStart, lt: monthEnd } },
      });

      const monthDevis = await prisma.quotes.count({
        where: {
          status: { in: ['ENVOYE', 'ACCEPTE'] },
          issuedAt: { gte: monthStart, lt: monthEnd },
        },
      });

      monthlyEvolution.push({
        month: monthStart.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
        ca: monthDeals.reduce((sum, d) => sum + d.value, 0),
        leads: monthLeads,
        deals: monthDeals.length,
        devis: monthDevis,
      });
    }

    // ========================================
    // 9. EVOLUTION HEBDOMADAIRE (4 semaines)
    // ========================================

    const weeklyEvolution = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i + 1) * 7);
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      const weekCA = await prisma.deals.aggregate({
        where: { closedAt: { gte: weekStart, lt: weekEnd } },
        _sum: { value: true },
      });

      const weekAppels = await prisma.activities.count({
        where: {
          type: 'APPEL',
          scheduledAt: { gte: weekStart, lt: weekEnd },
        },
      });

      const weekRdv = await prisma.activities.count({
        where: {
          type: { in: ['REUNION', 'VISIO'] },
          status: 'COMPLETEE',
          completedAt: { gte: weekStart, lt: weekEnd },
        },
      });

      weeklyEvolution.push({
        week: `S${Math.ceil((now.getDate() - i * 7) / 7)}`,
        startDate: weekStart.toISOString().split('T')[0],
        ca: weekCA._sum.value || 0,
        appels: weekAppels,
        rdv: weekRdv,
      });
    }

    // ========================================
    // 10. ALERTES
    // ========================================

    const alerts: Array<{
      type: 'WARNING' | 'CRITICAL' | 'INFO';
      title: string;
      description: string;
      count?: number;
      link?: string;
    }> = [];

    // Deals a relancer (sans activite > 7 jours)
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    const dealsARelancer = await prisma.deals.findMany({
      where: {
        closedAt: null,
        stage: { notIn: ['REFUSE'] },
      },
      include: {
        activities: {
          where: { status: 'COMPLETEE' },
          orderBy: { completedAt: 'desc' },
          take: 1,
        },
      },
    });

    const dealsNeedingFollowup = dealsARelancer.filter((d) => {
      if (d.activities.length === 0) return true;
      const lastActivity = d.activities[0].completedAt;
      if (!lastActivity) return true;
      return new Date(lastActivity) < sevenDaysAgo;
    });

    if (dealsNeedingFollowup.length > 0) {
      alerts.push({
        type: 'WARNING',
        title: 'Deals a relancer',
        description: `${dealsNeedingFollowup.length} deal(s) sans contact depuis plus de 7 jours`,
        count: dealsNeedingFollowup.length,
        link: '/dashboard/crm/deals',
      });
    }

    // Devis expirant
    if (devisExpirantSemaine > 0) {
      alerts.push({
        type: 'WARNING',
        title: 'Devis expirant',
        description: `${devisExpirantSemaine} devis expire(nt) cette semaine`,
        count: devisExpirantSemaine,
        link: '/dashboard/sales/quotes',
      });
    }

    // Baisse CA significative
    if (!isAllTime && previousCA > 0) {
      const caVariation = calculateVariation(currentCA, previousCA);
      if (caVariation <= -20) {
        alerts.push({
          type: 'CRITICAL',
          title: 'Baisse CA significative',
          description: `CA en baisse de ${Math.abs(caVariation)}% vs periode precedente`,
          link: '/dashboard/analytics',
        });
      }
    }

    // RDV annules eleves
    const tauxAnnulation = rdv.length > 0 ? (rdvAnnules / rdv.length) * 100 : 0;
    if (tauxAnnulation > 20) {
      alerts.push({
        type: 'WARNING',
        title: 'RDV annules eleves',
        description: `Taux d'annulation de ${Math.round(tauxAnnulation)}%`,
      });
    }

    // ========================================
    // 11. INSIGHTS
    // ========================================

    // Meilleur jour de la semaine
    const dealsByDay = await prisma.deals.groupBy({
      by: ['closedAt'],
      where: { closedAt: { not: null } },
    });

    const daysCounts: Record<string, number> = {
      Lundi: 0,
      Mardi: 0,
      Mercredi: 0,
      Jeudi: 0,
      Vendredi: 0,
      Samedi: 0,
      Dimanche: 0,
    };

    const dealsWithClosedAt = await prisma.deals.findMany({
      where: { closedAt: { not: null } },
      select: { closedAt: true },
    });

    dealsWithClosedAt.forEach((d) => {
      if (d.closedAt) {
        const dayName = new Date(d.closedAt).toLocaleDateString('fr-FR', { weekday: 'long' });
        const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
        if (daysCounts[capitalizedDay] !== undefined) {
          daysCounts[capitalizedDay]++;
        }
      }
    });

    const totalDealsForDays = Object.values(daysCounts).reduce((sum, c) => sum + c, 0);
    const bestDayEntry = Object.entries(daysCounts).sort((a, b) => b[1] - a[1])[0];
    const bestDay = bestDayEntry ? bestDayEntry[0] : 'N/A';
    const bestDayPercentage = totalDealsForDays > 0 && bestDayEntry
      ? Math.round((bestDayEntry[1] / totalDealsForDays) * 100)
      : 0;

    // ========================================
    // 12. COMMERCIAUX AVEC DETAILS
    // ========================================

    const users = await prisma.users.findMany({
      where: {
        status: 'ACTIVE',
        role: { in: ['VENTE', 'ACCOUNT_MANAGEMENT'] },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatar: true,
      },
    });

    const commerciaux = await Promise.all(
      users.map(async (user) => {
        // Deals periode actuelle
        const userDeals = await prisma.deals.findMany({
          where: {
            OR: [
              { ownerId: user.id },
              { deal_assignees: { some: { userId: user.id } } },
            ],
            closedAt: isAllTime ? { not: null } : { gte: currentStart, not: null },
          },
          select: { id: true, value: true },
        });
        const uniqueDeals = Array.from(new Map(userDeals.map((d) => [d.id, d])).values());
        const ca = uniqueDeals.reduce((sum, d) => sum + d.value, 0);

        // Deals periode precedente (pour variation)
        let previousUserCA = 0;
        if (!isAllTime) {
          const prevUserDeals = await prisma.deals.findMany({
            where: {
              OR: [
                { ownerId: user.id },
                { deal_assignees: { some: { userId: user.id } } },
              ],
              closedAt: previousDateFilter,
            },
            select: { id: true, value: true },
          });
          const uniquePrevDeals = Array.from(new Map(prevUserDeals.map((d) => [d.id, d])).values());
          previousUserCA = uniquePrevDeals.reduce((sum, d) => sum + d.value, 0);
        }

        // Appels
        const userAppels = await prisma.activities.count({
          where: {
            assignedToId: user.id,
            type: 'APPEL',
            scheduledAt: currentDateFilter,
          },
        });

        // RDV
        const userRdv = await prisma.activities.count({
          where: {
            assignedToId: user.id,
            type: { in: ['REUNION', 'VISIO'] },
            status: 'COMPLETEE',
            completedAt: currentDateFilter,
          },
        });

        // Taux closing
        const userDealsTotal = await prisma.deals.count({
          where: {
            OR: [
              { ownerId: user.id },
              { deal_assignees: { some: { userId: user.id } } },
            ],
            closedAt: currentDateFilter,
          },
        });
        const userDealsWon = await prisma.deals.count({
          where: {
            OR: [
              { ownerId: user.id },
              { deal_assignees: { some: { userId: user.id } } },
            ],
            stage: 'CLOSING',
            closedAt: currentDateFilter,
          },
        });
        const tauxClosing = userDealsTotal > 0 ? Math.round((userDealsWon / userDealsTotal) * 100) : 0;

        // Sparkline (7 derniers jours)
        const sparkline: number[] = [];
        for (let j = 6; j >= 0; j--) {
          const dayStart = new Date(now);
          dayStart.setDate(now.getDate() - j);
          dayStart.setHours(0, 0, 0, 0);

          const dayEnd = new Date(dayStart);
          dayEnd.setDate(dayStart.getDate() + 1);

          const dayCA = await prisma.deals.aggregate({
            where: {
              OR: [
                { ownerId: user.id },
                { deal_assignees: { some: { userId: user.id } } },
              ],
              closedAt: { gte: dayStart, lt: dayEnd },
            },
            _sum: { value: true },
          });
          sparkline.push(dayCA._sum.value || 0);
        }

        return {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          avatar: user.avatar,
          ca,
          caVariation: calculateVariation(ca, previousUserCA),
          deals: uniqueDeals.length,
          appels: userAppels,
          rdv: userRdv,
          tauxClosing,
          sparkline,
        };
      })
    );

    commerciaux.sort((a, b) => b.ca - a.ca);

    // ========================================
    // REPONSE FINALE
    // ========================================

    const analytics = {
      period: {
        current: {
          start: currentStart.toISOString().split('T')[0],
          end: now.toISOString().split('T')[0],
          label: period === 'week' ? '7 derniers jours' :
                 period === 'month' ? '30 derniers jours' :
                 period === 'quarter' ? '3 derniers mois' :
                 period === 'year' ? '12 derniers mois' : 'Depuis le debut',
        },
        previous: isAllTime ? null : {
          start: previousStart.toISOString().split('T')[0],
          end: previousEnd.toISOString().split('T')[0],
        },
      },

      kpis: {
        current: {
          caGenere: currentCA,
          caEncaisse: currentCAEncaisse,
          leads: currentLeads,
          devisEnvoyes: currentDevisEnvoyes,
          conversionRate: Math.round(currentConversionRate * 10) / 10,
          panierMoyen: Math.round(currentPanierMoyen),
          activeDeals: currentActiveDeals,
          forecastCA: Math.round(currentForecastCA),
          tempsClosing: currentTempsClosing,
        },
        previous: isAllTime ? null : {
          caGenere: previousCA,
          caEncaisse: previousCAEncaisse,
          leads: previousLeads,
          devisEnvoyes: previousDevisEnvoyes,
          panierMoyen: Math.round(previousPanierMoyen),
          tempsClosing: previousTempsClosing,
        },
        variations: isAllTime ? null : {
          caGenere: calculateVariation(currentCA, previousCA),
          caEncaisse: calculateVariation(currentCAEncaisse, previousCAEncaisse),
          leads: calculateVariation(currentLeads, previousLeads),
          devisEnvoyes: calculateVariation(currentDevisEnvoyes, previousDevisEnvoyes),
          panierMoyen: calculateVariation(currentPanierMoyen, previousPanierMoyen),
          tempsClosing: calculateVariation(currentTempsClosing, previousTempsClosing),
        },
      },

      activities: {
        appels: {
          total: appels.length,
          repondus: appelsRepondus,
          messagerie: appelsMessagerie,
          pasReponse: appelsPasReponse,
          rappel: appelsRappel,
          tauxReponse: appels.length > 0 ? Math.round((appelsRepondus / appels.length) * 100) : 0,
          dureeMoyenne: dureeMoyenneAppel,
        },
        rdv: {
          total: rdv.length,
          effectues: rdvEffectues,
          annules: rdvAnnules,
          tauxHonore: rdv.length > 0 ? Math.round((rdvEffectues / rdv.length) * 100) : 0,
          dureeMoyenne: dureeMoyenneRdv,
        },
        emails: { total: emails },
      },

      qualification: {
        temperature: {
          hot: leadsHot,
          warm: leadsWarm,
          cold: leadsCold,
        },
        budget: {
          discute: budgetDiscute,
          nonDiscute: budgetNonDiscute,
        },
        decideur: {
          identifie: decideurIdentifie,
          nonIdentifie: decideurNonIdentifie,
        },
        objections,
        nextActions,
      },

      pipeline: {
        byStage: pipelineByStage,
        total: pipelineTotal,
      },

      devis: {
        envoyes: devisEnvoyes,
        acceptes: devisAcceptes,
        refuses: devisRefuses,
        expires: devisExpires,
        enAttente: devisEnAttente,
        tauxAcceptation: tauxAcceptationDevis,
        valeurMoyenne: valeurMoyenneDevis,
        tempsMoyenAcceptation,
        expirantSemaine: devisExpirantSemaine,
      },

      funnel,

      evolution: {
        monthly: monthlyEvolution,
        weekly: weeklyEvolution,
      },

      alerts,

      commerciaux,

      insights: {
        bestDay,
        bestDayPercentage,
        avgClosingTime: currentTempsClosing,
        closingTimeVariation: isAllTime ? 0 : calculateVariation(currentTempsClosing, previousTempsClosing),
      },
    };

    return NextResponse.json({ analytics });
  } catch (error) {
    console.error('Erreur GET /api/analytics:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
