import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateRaceSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  metric: z.enum(['CA_ENCAISSE', 'DEALS_GAGNES', 'CONTACTS_CREES', 'ACTIVITES', 'APPELS', 'EMAILS', 'REUNIONS']).optional(),
  prizes: z.record(z.string(), z.string()).optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
});

type RouteContext = {
  params: { id: string };
};

// GET /api/races/[id] - Récupérer une course spécifique
export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const race = await prisma.races.findUnique({
      where: { id: params.id },
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
                position: true,
              },
            },
          },
          orderBy: {
            rank: 'asc',
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

    return NextResponse.json({ race });
  } catch (error) {
    console.error(`Erreur GET /api/races/${params.id}:`, error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PUT /api/races/[id] - Mettre à jour une course (admin seulement)
export async function PUT(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Seuls les administrateurs peuvent modifier des courses' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateRaceSchema.parse(body);

    // Préparer les données à mettre à jour
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (validatedData.name) updateData.name = validatedData.name;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.startDate) updateData.startDate = new Date(validatedData.startDate);
    if (validatedData.endDate) updateData.endDate = new Date(validatedData.endDate);
    if (validatedData.metric) updateData.metric = validatedData.metric;
    if (validatedData.prizes) updateData.prizes = JSON.stringify(validatedData.prizes);
    if (validatedData.status) updateData.status = validatedData.status;

    const race = await prisma.races.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json({ race });
  } catch (error) {
    console.error(`Erreur PUT /api/races/${params.id}:`, error);

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

// DELETE /api/races/[id] - Supprimer une course (admin seulement)
export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Seuls les administrateurs peuvent supprimer des courses' },
        { status: 403 }
      );
    }

    await prisma.races.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Erreur DELETE /api/races/${params.id}:`, error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
