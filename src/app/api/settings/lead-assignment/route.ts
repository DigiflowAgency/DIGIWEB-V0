import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: Recuperer les compteurs et le prochain commercial
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    // 1. Recuperer les commerciaux actifs avec tri deterministe
    const activeUsers = await prisma.users.findMany({
      where: { role: 'VENTE', status: 'ACTIVE' },
      select: { id: true, firstName: true, lastName: true },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }, { id: 'asc' }],
    });

    if (activeUsers.length === 0) {
      return NextResponse.json({
        counters: [],
        nextUserId: null,
        users: [],
      });
    }

    // 2. Recuperer les compteurs existants
    const existingCounters = await prisma.lead_assignment_counters.findMany({
      where: { userId: { in: activeUsers.map((u) => u.id) } },
    });

    // 3. Creer un map des compteurs
    const counterMap = new Map(
      existingCounters.map((c) => [c.userId, c.count])
    );

    // 4. Construire la liste complete avec compteurs (0 par defaut)
    const counters = activeUsers.map((user) => ({
      userId: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      count: counterMap.get(user.id) || 0,
    }));

    // 5. Trier par count ASC, puis id ASC pour trouver le prochain
    const sorted = [...counters].sort((a, b) =>
      a.count !== b.count ? a.count - b.count : a.userId.localeCompare(b.userId)
    );

    return NextResponse.json({
      counters: sorted,
      nextUserId: sorted[0]?.userId || null,
      users: activeUsers,
    });
  } catch (error) {
    console.error('Erreur GET /api/settings/lead-assignment:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST: Incrementer le compteur apres attribution
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 });
    }

    // Verifier que l'utilisateur existe
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouve' },
        { status: 404 }
      );
    }

    // Upsert le compteur (creer ou incrementer)
    const counter = await prisma.lead_assignment_counters.upsert({
      where: { userId },
      update: { count: { increment: 1 } },
      create: { userId, count: 1 },
    });

    return NextResponse.json({
      success: true,
      userId,
      count: counter.count,
    });
  } catch (error) {
    console.error('Erreur POST /api/settings/lead-assignment:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE: Reinitialiser tous les compteurs (admin)
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    // Verifier que l'utilisateur est admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Seuls les administrateurs peuvent reinitialiser les compteurs' },
        { status: 403 }
      );
    }

    // Reinitialiser tous les compteurs a 0
    await prisma.lead_assignment_counters.updateMany({
      data: { count: 0 },
    });

    return NextResponse.json({
      success: true,
      message: 'Tous les compteurs ont ete reinitialises',
    });
  } catch (error) {
    console.error('Erreur DELETE /api/settings/lead-assignment:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
