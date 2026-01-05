import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notifyEvent } from '@/lib/notifications';

// POST /api/deals/[id]/notes - Créer une nouvelle note
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id: dealId } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Le contenu de la note est requis' },
        { status: 400 }
      );
    }

    // Vérifier que le deal existe et récupérer les assignés
    const deal = await prisma.deals.findUnique({
      where: { id: dealId },
      include: {
        deal_assignees: {
          select: { userId: true },
        },
      },
    });

    if (!deal) {
      return NextResponse.json(
        { error: 'Deal non trouvé' },
        { status: 404 }
      );
    }

    // Créer la note
    const note = await prisma.notes.create({
      data: {
        id: `NOTE-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        content: content.trim(),
        dealId,
        authorId: session.user.id,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Notification: Note ajoutée (owner + assignés)
    const assigneeIds = deal.deal_assignees.map(a => a.userId);
    const recipients = [deal.ownerId, ...assigneeIds];
    notifyEvent('DEAL_NOTE_ADDED', {
      actorId: session.user.id,
      actorName: session.user.name || session.user.email,
      entityId: dealId,
      entityName: deal.title,
    }, recipients);

    // Parser les mentions @[Nom](userId) et notifier les utilisateurs mentionnés
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const mentionedUserIds: string[] = [];
    let match;
    while ((match = mentionRegex.exec(content)) !== null) {
      mentionedUserIds.push(match[2]); // L'ID utilisateur
    }

    // Envoyer notifications aux mentionnés (exclure l'auteur et dédupliquer)
    const uniqueMentions = Array.from(new Set(mentionedUserIds))
      .filter(id => id !== session.user.id);

    if (uniqueMentions.length > 0) {
      notifyEvent('USER_MENTIONED', {
        actorId: session.user.id,
        actorName: session.user.name || session.user.email,
        entityId: dealId,
        entityName: deal.title,
      }, uniqueMentions);
    }

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    console.error('Erreur création note:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de la note' },
      { status: 500 }
    );
  }
}

// GET /api/deals/[id]/notes - Récupérer les notes d'un deal
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id: dealId } = await params;

    const notes = await prisma.notes.findMany({
      where: { dealId },
      select: {
        id: true,
        content: true,
        createdAt: true,
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ notes });
  } catch (error) {
    console.error('Erreur récupération notes:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des notes' },
      { status: 500 }
    );
  }
}
