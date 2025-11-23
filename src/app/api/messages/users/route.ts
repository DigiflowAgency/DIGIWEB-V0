import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/messages/users - Récupérer la liste des utilisateurs pour créer une conversation
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Récupérer tous les utilisateurs sauf l'utilisateur connecté
    const users = await prisma.users.findMany({
      where: {
        id: {
          not: session.user.id,
        },
        status: 'ACTIVE', // Uniquement les utilisateurs actifs
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatar: true,
        position: true,
        department: true,
        status: true,
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' },
      ],
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Erreur GET /api/messages/users:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
