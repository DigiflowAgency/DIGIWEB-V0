import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema de validation pour CheckIn
const checkinSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020),
  energy: z.number().int().min(1).max(10),
  motivation: z.number().int().min(1).max(10),
  mentalClarity: z.string().optional().nullable(),
  teamAmbiance: z.string().optional().nullable(),
  pride: z.string().optional().nullable(),
  difficulties: z.string().optional().nullable(),
  vision6Months: z.string().optional().nullable(),
  ideas: z.string().optional().nullable(),
});

// GET /api/checkins - Récupérer les check-ins
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const checkCurrentMonth = searchParams.get('checkCurrentMonth');

    // Vérification rapide si check-in fait ce mois-ci
    if (checkCurrentMonth === 'true') {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      const existing = await prisma.checkins.findUnique({
        where: {
          userId_month_year: {
            userId: session.user.id,
            month: currentMonth,
            year: currentYear,
          },
        },
      });

      return NextResponse.json({ hasCheckinThisMonth: !!existing });
    }

    // Construire la query
    const where: any = {};

    // Si l'utilisateur n'est pas admin, il ne peut voir que ses propres check-ins
    if (session.user.role !== 'ADMIN') {
      where.userId = session.user.id;
    } else if (userId) {
      // Les admins peuvent filtrer par userId
      where.userId = userId;
    }

    if (month) {
      where.month = parseInt(month);
    }

    if (year) {
      where.year = parseInt(year);
    }

    const checkins = await prisma.checkins.findMany({
      where,
      include: {
        users: {
          select: {
            id: true,
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

    return NextResponse.json({ checkins });
  } catch (error) {
    console.error('Erreur GET /api/checkins:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST /api/checkins - Créer/soumettre un check-in
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = checkinSchema.parse(body);

    // Vérifier qu'on est bien dans la période autorisée (25-30 du mois)
    const now = new Date();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Autoriser la soumission uniquement entre le 25 et le 30 du mois
    // OU autoriser les admins à tout moment (pour des tests)
    if (session.user.role !== 'ADMIN') {
      if (currentDay < 25 || currentDay > 30) {
        return NextResponse.json(
          { error: 'Le check-in mensuel est disponible uniquement entre le 25 et le 30 du mois' },
          { status: 403 }
        );
      }

      // Vérifier qu'on soumet bien pour le mois en cours
      if (validatedData.month !== currentMonth || validatedData.year !== currentYear) {
        return NextResponse.json(
          { error: 'Vous ne pouvez soumettre un check-in que pour le mois en cours' },
          { status: 400 }
        );
      }
    }

    // Vérifier si un check-in existe déjà pour ce mois/année
    const existingCheckin = await prisma.checkins.findUnique({
      where: {
        userId_month_year: {
          userId: session.user.id,
          month: validatedData.month,
          year: validatedData.year,
        },
      },
    });

    if (existingCheckin) {
      return NextResponse.json(
        { error: 'Vous avez déjà soumis un check-in pour ce mois' },
        { status: 400 }
      );
    }

    // Créer le check-in
    const checkin = await prisma.checkins.create({
      data: {
        id: `CHK-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        userId: session.user.id,
        month: validatedData.month,
        year: validatedData.year,
        energy: validatedData.energy,
        motivation: validatedData.motivation,
        mentalClarity: validatedData.mentalClarity || null,
        teamAmbiance: validatedData.teamAmbiance || null,
        pride: validatedData.pride || null,
        difficulties: validatedData.difficulties || null,
        vision6Months: validatedData.vision6Months || null,
        ideas: validatedData.ideas || null,
      },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(checkin, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /api/checkins:', error);

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
