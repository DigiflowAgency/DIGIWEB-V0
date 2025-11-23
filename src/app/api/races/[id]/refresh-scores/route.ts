import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type RouteContext = {
  params: { id: string };
};

// POST /api/races/[id]/refresh-scores - Recalculer les scores de tous les participants
export async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Récupérer la course
    const race = await prisma.races.findUnique({
      where: { id: params.id },
      include: {
        race_participants: {
          include: {
            users: true,
          },
        },
      },
    });

    if (!race) {
      return NextResponse.json(
        { error: 'Course non trouvée' },
        { status: 404 }
      );
    }

    // Calculer les scores pour chaque participant
    const scores: { userId: string; score: number }[] = [];

    for (const participant of race.race_participants) {
      let score = 0;

      switch (race.metric) {
        case 'CA_ENCAISSE':
          // CA des deals gagnés pendant la période de la course
          const wonDeals = await prisma.deals.findMany({
            where: {
              ownerId: participant.userId,
              productionStage: 'ENCAISSE',
              closedAt: {
                gte: race.startDate,
                lte: race.endDate,
              },
            },
          });
          score = wonDeals.reduce((sum, deal) => sum + deal.value, 0);
          break;

        case 'DEALS_GAGNES':
          // Nombre de deals gagnés pendant la période
          const dealsCount = await prisma.deals.count({
            where: {
              ownerId: participant.userId,
              productionStage: 'ENCAISSE',
              closedAt: {
                gte: race.startDate,
                lte: race.endDate,
              },
            },
          });
          score = dealsCount;
          break;

        case 'CONTACTS_CREES':
          // Nombre de contacts créés pendant la période
          const contactsCount = await prisma.contacts.count({
            where: {
              assignedToId: participant.userId,
              createdAt: {
                gte: race.startDate,
                lte: race.endDate,
              },
            },
          });
          score = contactsCount;
          break;

        case 'ACTIVITES':
          // Nombre d'activités réalisées pendant la période
          const activitiesCount = await prisma.activities.count({
            where: {
              assignedToId: participant.userId,
              status: 'COMPLETEE',
              completedAt: {
                gte: race.startDate,
                lte: race.endDate,
              },
            },
          });
          score = activitiesCount;
          break;

        case 'APPELS':
          // Nombre d'appels réalisés pendant la période
          const callsCount = await prisma.activities.count({
            where: {
              assignedToId: participant.userId,
              type: 'APPEL',
              status: 'COMPLETEE',
              completedAt: {
                gte: race.startDate,
                lte: race.endDate,
              },
            },
          });
          score = callsCount;
          break;

        case 'EMAILS':
          // Nombre d'emails envoyés pendant la période
          const emailsCount = await prisma.activities.count({
            where: {
              assignedToId: participant.userId,
              type: 'EMAIL',
              status: 'COMPLETEE',
              completedAt: {
                gte: race.startDate,
                lte: race.endDate,
              },
            },
          });
          score = emailsCount;
          break;

        case 'REUNIONS':
          // Nombre de réunions réalisées pendant la période
          const meetingsCount = await prisma.activities.count({
            where: {
              assignedToId: participant.userId,
              type: {
                in: ['REUNION', 'VISIO'],
              },
              status: 'COMPLETEE',
              completedAt: {
                gte: race.startDate,
                lte: race.endDate,
              },
            },
          });
          score = meetingsCount;
          break;
      }

      scores.push({ userId: participant.userId, score });
    }

    // Trier les scores par ordre décroissant
    scores.sort((a, b) => b.score - a.score);

    // Calculer les rangs (en tenant compte des ex-aequo)
    let currentRank = 1;
    let previousScore = -1;
    const rankedScores = scores.map((s, index) => {
      if (s.score !== previousScore) {
        currentRank = index + 1;
      }
      previousScore = s.score;
      return { ...s, rank: currentRank };
    });

    // Mettre à jour tous les participants
    for (const { userId, score, rank } of rankedScores) {
      await prisma.race_participants.updateMany({
        where: {
          raceId: params.id,
          userId,
        },
        data: {
          score,
          rank,
          updatedAt: new Date(),
        },
      });
    }

    // Récupérer les participants mis à jour
    const updatedParticipants = await prisma.race_participants.findMany({
      where: { raceId: params.id },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            position: true,
          },
        },
      },
      orderBy: {
        rank: 'asc',
      },
    });

    return NextResponse.json({ participants: updatedParticipants });
  } catch (error) {
    console.error(`Erreur POST /api/races/${params.id}/refresh-scores:`, error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
