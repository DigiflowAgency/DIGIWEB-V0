import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createRaceSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  description: z.string().optional(),
  startDate: z.string().min(1, 'La date de début est requise'),
  endDate: z.string().min(1, 'La date de fin est requise'),
  metric: z.enum(['CA_ENCAISSE', 'DEALS_GAGNES', 'CONTACTS_CREES', 'ACTIVITES', 'APPELS', 'EMAILS', 'REUNIONS']),
  prizes: z.record(z.string(), z.string()), // {"1": "1000€", "2": "500€", "3": "250€"}
});

// GET /api/races - Récupérer toutes les courses
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const races = await prisma.races.findMany({
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        race_participants: {
          include: {
            users: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            rank: 'asc',
          },
        },
      },
      orderBy: [
        { status: 'asc' }, // ACTIVE d'abord
        { startDate: 'desc' },
      ],
    });

    return NextResponse.json({ races });
  } catch (error) {
    console.error('Erreur GET /api/races:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST /api/races - Créer une nouvelle course (admin seulement)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que l'utilisateur est admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Seuls les administrateurs peuvent créer des courses' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createRaceSchema.parse(body);

    // Vérifier que la date de fin est après la date de début
    const startDate = new Date(validatedData.startDate);
    const endDate = new Date(validatedData.endDate);

    if (endDate <= startDate) {
      return NextResponse.json(
        { error: 'La date de fin doit être après la date de début' },
        { status: 400 }
      );
    }

    // Créer la course
    const race = await prisma.races.create({
      data: {
        id: `RACE-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: validatedData.name,
        description: validatedData.description || null,
        startDate,
        endDate,
        metric: validatedData.metric,
        prizes: JSON.stringify(validatedData.prizes),
        createdById: session.user.id,
        updatedAt: new Date(),
      },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Créer automatiquement les participants (tous les utilisateurs actifs)
    const activeUsers = await prisma.users.findMany({
      where: {
        status: 'ACTIVE',
      },
      select: {
        id: true,
      },
    });

    await prisma.race_participants.createMany({
      data: activeUsers.map((user) => ({
        id: `RACEPART-${race.id}-${user.id}-${Date.now()}`,
        raceId: race.id,
        userId: user.id,
        score: 0,
        rank: null,
        updatedAt: new Date(),
      })),
    });

    return NextResponse.json({ race }, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /api/races:', error);

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
