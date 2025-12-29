import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/analytics/commerciaux/[id] - Details d'un commercial
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id: userId } = params;
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'month';

    // Calculer les dates selon la periode
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

    // Recuperer l'utilisateur
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatar: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouve' }, { status: 404 });
    }

    // === ACTIVITES DETAILLEES ===

    // Toutes les activites du commercial
    const activities = await prisma.activities.findMany({
      where: {
        assignedToId: userId,
        scheduledAt: dateFilter,
      },
      include: {
        deals: {
          select: {
            id: true,
            title: true,
            value: true,
            stage: true,
            companies: { select: { name: true } },
          },
        },
        contacts: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { scheduledAt: 'desc' },
      take: 50,
    });

    // Stats par type d'activite
    const appels = activities.filter((a) => a.type === 'APPEL');
    const rdv = activities.filter((a) => a.type === 'REUNION' || a.type === 'VISIO');
    const emails = activities.filter((a) => a.type === 'EMAIL');

    // Stats appels
    const appelsRepondus = appels.filter((a) => a.outcome === 'ANSWERED').length;
    const appelsMessagerie = appels.filter((a) => a.outcome === 'VOICEMAIL').length;
    const appelsPasReponse = appels.filter((a) => a.outcome === 'NO_ANSWER').length;
    const appelsRappel = appels.filter((a) => a.outcome === 'CALLBACK').length;

    // Duree moyenne des appels repondus
    const appelsAvecDuree = appels.filter((a) => a.duration && a.outcome === 'ANSWERED');
    const dureeMoyenneAppel = appelsAvecDuree.length > 0
      ? Math.round(appelsAvecDuree.reduce((sum, a) => sum + (a.duration || 0), 0) / appelsAvecDuree.length)
      : 0;

    // RDV effectues
    const rdvEffectues = rdv.filter((a) => a.status === 'COMPLETEE').length;
    const rdvAnnules = rdv.filter((a) => a.status === 'ANNULEE').length;

    // Duree moyenne RDV
    const rdvAvecDuree = rdv.filter((a) => a.duration && a.status === 'COMPLETEE');
    const dureeMoyenneRdv = rdvAvecDuree.length > 0
      ? Math.round(rdvAvecDuree.reduce((sum, a) => sum + (a.duration || 0), 0) / rdvAvecDuree.length)
      : 0;

    // === QUALIFICATION ===
    const activitesAvecTemp = activities.filter((a) => a.temperature);
    const leadsHot = activitesAvecTemp.filter((a) => a.temperature === 'HOT').length;
    const leadsWarm = activitesAvecTemp.filter((a) => a.temperature === 'WARM').length;
    const leadsCold = activitesAvecTemp.filter((a) => a.temperature === 'COLD').length;

    const activitesAvecBudget = activities.filter((a) => a.budgetDiscussed !== null);
    const budgetOui = activitesAvecBudget.filter((a) => a.budgetDiscussed === true).length;
    const budgetNon = activitesAvecBudget.filter((a) => a.budgetDiscussed === false).length;

    const activitesAvecDecideur = activities.filter((a) => a.decisionMaker !== null);
    const decideurOui = activitesAvecDecideur.filter((a) => a.decisionMaker === true).length;
    const decideurNon = activitesAvecDecideur.filter((a) => a.decisionMaker === false).length;

    // Objections
    const objectionsCounts: Record<string, number> = {};
    activities.forEach((a) => {
      if (a.mainObjection) {
        objectionsCounts[a.mainObjection] = (objectionsCounts[a.mainObjection] || 0) + 1;
      }
    });

    // Prochaines actions
    const nextActionsCounts: Record<string, number> = {};
    activities.forEach((a) => {
      if (a.nextAction) {
        nextActionsCounts[a.nextAction] = (nextActionsCounts[a.nextAction] || 0) + 1;
      }
    });

    // === DEALS ===
    const dealsGagnes = await prisma.deals.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { deal_assignees: { some: { userId } } },
        ],
        stage: 'CLOSING',
        closedAt: dateFilter,
      },
      include: {
        companies: { select: { name: true } },
        contacts: { select: { firstName: true, lastName: true } },
      },
      orderBy: { closedAt: 'desc' },
    });

    const dealsPerdus = await prisma.deals.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { deal_assignees: { some: { userId } } },
        ],
        stage: 'REFUSE',
        closedAt: dateFilter,
      },
      include: {
        companies: { select: { name: true } },
        contacts: { select: { firstName: true, lastName: true } },
      },
      orderBy: { closedAt: 'desc' },
    });

    const dealsEnCours = await prisma.deals.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { deal_assignees: { some: { userId } } },
        ],
        closedAt: null,
        stage: { notIn: ['REFUSE', 'CLOSING'] },
      },
      include: {
        companies: { select: { name: true } },
        contacts: { select: { firstName: true, lastName: true } },
        activities: {
          where: { status: 'COMPLETEE' },
          orderBy: { completedAt: 'desc' },
          take: 1,
          select: { completedAt: true, type: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Deals a relancer (sans activite > 7 jours)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dealsARelancer = dealsEnCours.filter((deal) => {
      if (deal.activities.length === 0) return true;
      const lastActivity = deal.activities[0].completedAt;
      if (!lastActivity) return true;
      return new Date(lastActivity) < sevenDaysAgo;
    });

    // CA et stats
    const caGagne = dealsGagnes.reduce((sum, d) => sum + d.value, 0);
    const panierMoyen = dealsGagnes.length > 0 ? caGagne / dealsGagnes.length : 0;
    const tauxClosing = (dealsGagnes.length + dealsPerdus.length) > 0
      ? (dealsGagnes.length / (dealsGagnes.length + dealsPerdus.length)) * 100
      : 0;

    // Devis envoyes
    const devisEnvoyes = await prisma.quotes.count({
      where: {
        ownerId: userId,
        status: { in: ['ENVOYE', 'ACCEPTE', 'REFUSE'] },
        issuedAt: dateFilter,
      },
    });

    const devisAcceptes = await prisma.quotes.count({
      where: {
        ownerId: userId,
        status: 'ACCEPTE',
        acceptedAt: dateFilter,
      },
    });

    // === EVOLUTION HEBDOMADAIRE ===
    const weeklyEvolution = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i + 1) * 7);
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      const weekAppels = await prisma.activities.count({
        where: {
          assignedToId: userId,
          type: 'APPEL',
          scheduledAt: { gte: weekStart, lt: weekEnd },
        },
      });

      const weekAppelsRepondus = await prisma.activities.count({
        where: {
          assignedToId: userId,
          type: 'APPEL',
          outcome: 'ANSWERED',
          scheduledAt: { gte: weekStart, lt: weekEnd },
        },
      });

      const weekRdv = await prisma.activities.count({
        where: {
          assignedToId: userId,
          type: { in: ['REUNION', 'VISIO'] },
          status: 'COMPLETEE',
          completedAt: { gte: weekStart, lt: weekEnd },
        },
      });

      const weekVentes = await prisma.deals.count({
        where: {
          OR: [
            { ownerId: userId },
            { deal_assignees: { some: { userId } } },
          ],
          stage: 'CLOSING',
          closedAt: { gte: weekStart, lt: weekEnd },
        },
      });

      const weekCA = await prisma.deals.aggregate({
        where: {
          OR: [
            { ownerId: userId },
            { deal_assignees: { some: { userId } } },
          ],
          stage: 'CLOSING',
          closedAt: { gte: weekStart, lt: weekEnd },
        },
        _sum: { value: true },
      });

      weeklyEvolution.push({
        week: `S${Math.ceil((now.getDate() - (i * 7)) / 7)}`,
        startDate: weekStart.toISOString().split('T')[0],
        appels: weekAppels,
        appelsRepondus: weekAppelsRepondus,
        rdv: weekRdv,
        ventes: weekVentes,
        ca: weekCA._sum.value || 0,
      });
    }

    // Raisons de perte
    const lostReasonsCounts: Record<string, number> = {};
    dealsPerdus.forEach((d) => {
      if (d.lostReason) {
        lostReasonsCounts[d.lostReason] = (lostReasonsCounts[d.lostReason] || 0) + 1;
      }
    });

    return NextResponse.json({
      period,
      user: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
      },
      // Metriques globales
      metrics: {
        // Activites
        totalAppels: appels.length,
        appelsRepondus,
        appelsMessagerie,
        appelsPasReponse,
        appelsRappel,
        tauxAppelsRepondus: appels.length > 0 ? (appelsRepondus / appels.length) * 100 : 0,
        dureeMoyenneAppel,
        // RDV
        totalRdv: rdv.length,
        rdvEffectues,
        rdvAnnules,
        tauxRdvHonores: rdv.length > 0 ? (rdvEffectues / rdv.length) * 100 : 0,
        dureeMoyenneRdv,
        // Emails
        totalEmails: emails.length,
        // Deals
        dealsGagnes: dealsGagnes.length,
        dealsPerdus: dealsPerdus.length,
        dealsEnCours: dealsEnCours.length,
        dealsARelancer: dealsARelancer.length,
        caGagne,
        panierMoyen,
        tauxClosing,
        // Devis
        devisEnvoyes,
        devisAcceptes,
        tauxDevisAcceptes: devisEnvoyes > 0 ? (devisAcceptes / devisEnvoyes) * 100 : 0,
      },
      // Qualification
      qualification: {
        leadsHot,
        leadsWarm,
        leadsCold,
        budgetOui,
        budgetNon,
        decideurOui,
        decideurNon,
        objections: Object.entries(objectionsCounts).map(([type, count]) => ({ type, count })),
        nextActions: Object.entries(nextActionsCounts).map(([type, count]) => ({ type, count })),
      },
      // Evolution
      weeklyEvolution,
      // Listes
      recentActivities: activities.slice(0, 20).map((a) => ({
        id: a.id,
        type: a.type,
        status: a.status,
        outcome: a.outcome,
        duration: a.duration,
        temperature: a.temperature,
        resultNotes: a.resultNotes,
        scheduledAt: a.scheduledAt,
        completedAt: a.completedAt,
        deal: a.deals ? {
          id: a.deals.id,
          title: a.deals.title,
          company: a.deals.companies?.name,
        } : null,
        contact: a.contacts ? {
          id: a.contacts.id,
          name: `${a.contacts.firstName} ${a.contacts.lastName}`,
        } : null,
      })),
      dealsARelancer: dealsARelancer.map((d) => ({
        id: d.id,
        title: d.title,
        value: d.value,
        stage: d.stage,
        company: d.companies?.name,
        contact: d.contacts ? `${d.contacts.firstName} ${d.contacts.lastName}` : null,
        lastActivity: d.activities[0]?.completedAt || null,
        daysSinceContact: d.activities[0]?.completedAt
          ? Math.floor((now.getTime() - new Date(d.activities[0].completedAt).getTime()) / (1000 * 60 * 60 * 24))
          : null,
      })),
      dealsGagnes: dealsGagnes.slice(0, 10).map((d) => ({
        id: d.id,
        title: d.title,
        value: d.value,
        company: d.companies?.name,
        closedAt: d.closedAt,
      })),
      dealsPerdus: dealsPerdus.slice(0, 10).map((d) => ({
        id: d.id,
        title: d.title,
        value: d.value,
        company: d.companies?.name,
        lostReason: d.lostReason,
        closedAt: d.closedAt,
      })),
      lostReasons: Object.entries(lostReasonsCounts).map(([reason, count]) => ({ reason, count })),
    });
  } catch (error) {
    console.error('Erreur GET /api/analytics/commerciaux/[id]:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
