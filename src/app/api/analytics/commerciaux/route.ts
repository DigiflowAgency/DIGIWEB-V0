import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Types pour les métriques
interface UserMetrics {
  id: string;
  name: string;
  avatar: string | null;
  // Activités
  appels: number;
  appelsRepondus: number;
  rdvPris: number;
  rdvEffectues: number;
  emails: number;
  // Deals
  devisEnvoyes: number;
  ventesSignees: number;
  caSignee: number;
  dealsEnCours: number;
  dealsPerdus: number;
  // Taux
  tauxAppelsRepondus: number;
  tauxRdvHonores: number;
  tauxClosing: number;
  panierMoyen: number;
}

interface GlobalMetrics {
  // Totaux
  totalAppels: number;
  totalAppelsRepondus: number;
  totalRdvPris: number;
  totalRdvEffectues: number;
  totalDevisEnvoyes: number;
  totalVentes: number;
  totalCA: number;
  // Taux globaux
  tauxAppelsRepondus: number;
  tauxRdvHonores: number;
  tauxDevisAcceptes: number;
  tauxClosing: number;
  panierMoyen: number;
}

interface QualificationMetrics {
  // Temperature des leads
  leadsHot: number;
  leadsWarm: number;
  leadsCold: number;
  // Budget & Decision
  budgetDiscuteOui: number;
  budgetDiscuteNon: number;
  decisionMakerOui: number;
  decisionMakerNon: number;
  // Objections
  objections: { type: string; count: number }[];
  // Outcomes
  outcomes: { type: string; count: number }[];
  // Alertes
  dealsARelancer: number;
  delaiMoyenRelance: number;
}

// GET /api/analytics/commerciaux - KPIs détaillés par commercial (admin only)
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
    const period = searchParams.get('period') || 'month';
    const userId = searchParams.get('userId'); // Optionnel: filtrer par commercial

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
        startDate = new Date(0);
    }

    const dateFilter = period !== 'all' ? { gte: startDate } : undefined;

    // Récupérer les commerciaux
    const users = await prisma.users.findMany({
      where: userId
        ? { id: userId }
        : {
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

    // Calculer les métriques pour chaque commercial
    const userMetrics: UserMetrics[] = await Promise.all(
      users.map(async (user) => {
        // === ACTIVITÉS ===

        // Appels totaux
        const appels = await prisma.activities.count({
          where: {
            assignedToId: user.id,
            type: 'APPEL',
            scheduledAt: dateFilter,
          },
        });

        // Appels répondus (avec outcome = ANSWERED)
        const appelsRepondus = await prisma.activities.count({
          where: {
            assignedToId: user.id,
            type: 'APPEL',
            outcome: 'ANSWERED',
            scheduledAt: dateFilter,
          },
        });

        // RDV pris (planifiés)
        const rdvPris = await prisma.activities.count({
          where: {
            assignedToId: user.id,
            type: { in: ['REUNION', 'VISIO'] },
            scheduledAt: dateFilter,
          },
        });

        // RDV effectués (complétés)
        const rdvEffectues = await prisma.activities.count({
          where: {
            assignedToId: user.id,
            type: { in: ['REUNION', 'VISIO'] },
            status: 'COMPLETEE',
            completedAt: dateFilter,
          },
        });

        // Emails envoyés
        const emails = await prisma.activities.count({
          where: {
            assignedToId: user.id,
            type: 'EMAIL',
            status: 'COMPLETEE',
            completedAt: dateFilter,
          },
        });

        // === DEALS ===

        // Devis envoyés (via quotes OU deals avec proposalSentAt)
        const devisViaQuotes = await prisma.quotes.count({
          where: {
            ownerId: user.id,
            status: { in: ['ENVOYE', 'ACCEPTE', 'REFUSE'] },
            issuedAt: dateFilter,
          },
        });

        const devisViaDeals = await prisma.deals.count({
          where: {
            OR: [
              { ownerId: user.id },
              { deal_assignees: { some: { userId: user.id } } },
            ],
            proposalSentAt: dateFilter ? { gte: startDate } : { not: null },
          },
        });

        const devisEnvoyes = devisViaQuotes + devisViaDeals;

        // Ventes signées (CLOSING)
        const ventesSignees = await prisma.deals.count({
          where: {
            OR: [
              { ownerId: user.id },
              { deal_assignees: { some: { userId: user.id } } },
            ],
            stage: 'CLOSING',
            closedAt: dateFilter,
          },
        });

        // CA signé
        const dealsCA = await prisma.deals.aggregate({
          where: {
            OR: [
              { ownerId: user.id },
              { deal_assignees: { some: { userId: user.id } } },
            ],
            stage: 'CLOSING',
            closedAt: dateFilter,
          },
          _sum: { value: true },
        });
        const caSignee = dealsCA._sum.value || 0;

        // Deals en cours
        const dealsEnCours = await prisma.deals.count({
          where: {
            OR: [
              { ownerId: user.id },
              { deal_assignees: { some: { userId: user.id } } },
            ],
            closedAt: null,
            stage: { notIn: ['REFUSE', 'CLOSING'] },
          },
        });

        // Deals perdus
        const dealsPerdus = await prisma.deals.count({
          where: {
            OR: [
              { ownerId: user.id },
              { deal_assignees: { some: { userId: user.id } } },
            ],
            stage: 'REFUSE',
            closedAt: dateFilter,
          },
        });

        // === TAUX ===
        const tauxAppelsRepondus = appels > 0 ? (appelsRepondus / appels) * 100 : 0;
        const tauxRdvHonores = rdvPris > 0 ? (rdvEffectues / rdvPris) * 100 : 0;

        // Taux de closing = ventes / (ventes + perdus)
        const totalClosedDeals = ventesSignees + dealsPerdus;
        const tauxClosing = totalClosedDeals > 0 ? (ventesSignees / totalClosedDeals) * 100 : 0;

        const panierMoyen = ventesSignees > 0 ? caSignee / ventesSignees : 0;

        return {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          avatar: user.avatar,
          appels,
          appelsRepondus,
          rdvPris,
          rdvEffectues,
          emails,
          devisEnvoyes,
          ventesSignees,
          caSignee,
          dealsEnCours,
          dealsPerdus,
          tauxAppelsRepondus,
          tauxRdvHonores,
          tauxClosing,
          panierMoyen,
        };
      })
    );

    // Trier par CA décroissant
    userMetrics.sort((a, b) => b.caSignee - a.caSignee);

    // === MÉTRIQUES GLOBALES ===
    const globalMetrics: GlobalMetrics = {
      totalAppels: userMetrics.reduce((sum, u) => sum + u.appels, 0),
      totalAppelsRepondus: userMetrics.reduce((sum, u) => sum + u.appelsRepondus, 0),
      totalRdvPris: userMetrics.reduce((sum, u) => sum + u.rdvPris, 0),
      totalRdvEffectues: userMetrics.reduce((sum, u) => sum + u.rdvEffectues, 0),
      totalDevisEnvoyes: userMetrics.reduce((sum, u) => sum + u.devisEnvoyes, 0),
      totalVentes: userMetrics.reduce((sum, u) => sum + u.ventesSignees, 0),
      totalCA: userMetrics.reduce((sum, u) => sum + u.caSignee, 0),
      tauxAppelsRepondus: 0,
      tauxRdvHonores: 0,
      tauxDevisAcceptes: 0,
      tauxClosing: 0,
      panierMoyen: 0,
    };

    // Calculer les taux globaux
    globalMetrics.tauxAppelsRepondus =
      globalMetrics.totalAppels > 0
        ? (globalMetrics.totalAppelsRepondus / globalMetrics.totalAppels) * 100
        : 0;

    globalMetrics.tauxRdvHonores =
      globalMetrics.totalRdvPris > 0
        ? (globalMetrics.totalRdvEffectues / globalMetrics.totalRdvPris) * 100
        : 0;

    // Taux acceptation devis
    const totalQuotes = await prisma.quotes.count({
      where: { issuedAt: dateFilter },
    });
    const acceptedQuotes = await prisma.quotes.count({
      where: { status: 'ACCEPTE', acceptedAt: dateFilter },
    });
    globalMetrics.tauxDevisAcceptes = totalQuotes > 0 ? (acceptedQuotes / totalQuotes) * 100 : 0;

    // Taux closing global
    const totalWonDeals = await prisma.deals.count({
      where: { stage: 'CLOSING', closedAt: dateFilter },
    });
    const totalLostDeals = await prisma.deals.count({
      where: { stage: 'REFUSE', closedAt: dateFilter },
    });
    const totalClosedDeals = totalWonDeals + totalLostDeals;
    globalMetrics.tauxClosing = totalClosedDeals > 0 ? (totalWonDeals / totalClosedDeals) * 100 : 0;

    globalMetrics.panierMoyen =
      globalMetrics.totalVentes > 0 ? globalMetrics.totalCA / globalMetrics.totalVentes : 0;

    // === ÉVOLUTION HEBDOMADAIRE (4 dernières semaines) ===
    const weeklyEvolution = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i + 1) * 7);
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      const weekVentes = await prisma.deals.count({
        where: { stage: 'CLOSING', closedAt: { gte: weekStart, lt: weekEnd } },
      });

      const weekCA = await prisma.deals.aggregate({
        where: { stage: 'CLOSING', closedAt: { gte: weekStart, lt: weekEnd } },
        _sum: { value: true },
      });

      const weekAppels = await prisma.activities.count({
        where: { type: 'APPEL', scheduledAt: { gte: weekStart, lt: weekEnd } },
      });

      const weekRdv = await prisma.activities.count({
        where: {
          type: { in: ['REUNION', 'VISIO'] },
          status: 'COMPLETEE',
          completedAt: { gte: weekStart, lt: weekEnd },
        },
      });

      weeklyEvolution.push({
        week: `S${Math.ceil((now.getDate() - (i * 7)) / 7)}`,
        startDate: weekStart.toISOString().split('T')[0],
        ventes: weekVentes,
        ca: weekCA._sum.value || 0,
        appels: weekAppels,
        rdv: weekRdv,
      });
    }

    // === RAISONS DE PERTE (si disponibles) ===
    const lostReasons = await prisma.deals.groupBy({
      by: ['lostReason'],
      where: {
        stage: 'REFUSE',
        lostReason: { not: null },
        closedAt: dateFilter,
      },
      _count: { lostReason: true },
    });

    // === MÉTRIQUES DE QUALIFICATION (NOUVEAU) ===

    // Temperature des leads
    const leadsHot = await prisma.activities.count({
      where: { temperature: 'HOT', scheduledAt: dateFilter },
    });
    const leadsWarm = await prisma.activities.count({
      where: { temperature: 'WARM', scheduledAt: dateFilter },
    });
    const leadsCold = await prisma.activities.count({
      where: { temperature: 'COLD', scheduledAt: dateFilter },
    });

    // Budget discute
    const budgetDiscuteOui = await prisma.activities.count({
      where: { budgetDiscussed: true, scheduledAt: dateFilter },
    });
    const budgetDiscuteNon = await prisma.activities.count({
      where: { budgetDiscussed: false, scheduledAt: dateFilter },
    });

    // Decision maker identifie
    const decisionMakerOui = await prisma.activities.count({
      where: { decisionMaker: true, scheduledAt: dateFilter },
    });
    const decisionMakerNon = await prisma.activities.count({
      where: { decisionMaker: false, scheduledAt: dateFilter },
    });

    // Objections par type
    const objectionsGrouped = await prisma.activities.groupBy({
      by: ['mainObjection'],
      where: {
        mainObjection: { not: null },
        scheduledAt: dateFilter,
      },
      _count: { mainObjection: true },
    });

    // Outcomes par type
    const outcomesGrouped = await prisma.activities.groupBy({
      by: ['outcome'],
      where: {
        outcome: { not: null },
        scheduledAt: dateFilter,
      },
      _count: { outcome: true },
    });

    // Prochaines actions planifiees
    const nextActionsGrouped = await prisma.activities.groupBy({
      by: ['nextAction'],
      where: {
        nextAction: { not: null },
        scheduledAt: dateFilter,
      },
      _count: { nextAction: true },
    });

    // Deals a relancer (sans activite depuis plus de 7 jours)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dealsActifs = await prisma.deals.findMany({
      where: {
        closedAt: null,
        stage: { notIn: ['REFUSE', 'CLOSING'] },
      },
      select: {
        id: true,
        activities: {
          where: { status: 'COMPLETEE' },
          orderBy: { completedAt: 'desc' },
          take: 1,
          select: { completedAt: true },
        },
      },
    });

    let dealsARelancer = 0;
    let totalDelaiRelance = 0;
    let countDelai = 0;

    for (const deal of dealsActifs) {
      if (deal.activities.length > 0 && deal.activities[0].completedAt) {
        const lastActivity = new Date(deal.activities[0].completedAt);
        const daysSince = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSince > 7) {
          dealsARelancer++;
        }
        totalDelaiRelance += daysSince;
        countDelai++;
      } else {
        // Pas d'activite = a relancer
        dealsARelancer++;
      }
    }

    const delaiMoyenRelance = countDelai > 0 ? Math.round(totalDelaiRelance / countDelai) : 0;

    const qualificationMetrics: QualificationMetrics = {
      leadsHot,
      leadsWarm,
      leadsCold,
      budgetDiscuteOui,
      budgetDiscuteNon,
      decisionMakerOui,
      decisionMakerNon,
      objections: objectionsGrouped.map((o) => ({
        type: o.mainObjection || 'UNKNOWN',
        count: o._count.mainObjection,
      })),
      outcomes: outcomesGrouped.map((o) => ({
        type: o.outcome || 'UNKNOWN',
        count: o._count.outcome,
      })),
      dealsARelancer,
      delaiMoyenRelance,
    };

    // Prochaines actions
    const nextActions = nextActionsGrouped.map((a) => ({
      type: a.nextAction || 'UNKNOWN',
      count: a._count.nextAction,
    }));

    return NextResponse.json({
      period,
      globalMetrics,
      userMetrics,
      weeklyEvolution,
      lostReasons: lostReasons.map((r) => ({
        reason: r.lostReason,
        count: r._count.lostReason,
      })),
      qualificationMetrics,
      nextActions,
    });
  } catch (error) {
    console.error('Erreur GET /api/analytics/commerciaux:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
