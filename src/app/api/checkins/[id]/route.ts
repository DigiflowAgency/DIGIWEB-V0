import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type RouteContext = {
  params: { id: string };
};

// GET /api/checkins/[id] - Récupérer un check-in par ID
export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const checkin = await prisma.checkins.findUnique({
      where: { id: params.id },
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

    if (!checkin) {
      return NextResponse.json(
        { error: 'Check-in non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier les permissions
    // Seuls les admins ou le propriétaire peuvent voir le check-in
    if (session.user.role !== 'ADMIN' && checkin.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas accéder à ce check-in' },
        { status: 403 }
      );
    }

    return NextResponse.json(checkin);
  } catch (error) {
    console.error(`Erreur GET /api/checkins/${params.id}:`, error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// DELETE /api/checkins/[id] - Supprimer un check-in (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Seuls les admins peuvent supprimer des check-ins
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Seuls les administrateurs peuvent supprimer des check-ins' },
        { status: 403 }
      );
    }

    // Vérifier que le check-in existe
    const existingCheckin = await prisma.checkins.findUnique({
      where: { id: params.id },
    });

    if (!existingCheckin) {
      return NextResponse.json(
        { error: 'Check-in non trouvé' },
        { status: 404 }
      );
    }

    // Supprimer le check-in
    await prisma.checkins.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Check-in supprimé avec succès' });
  } catch (error) {
    console.error(`Erreur DELETE /api/checkins/${params.id}:`, error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
