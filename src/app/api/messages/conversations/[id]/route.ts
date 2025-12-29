import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { notifyEvent } from '@/lib/notifications';

const sendMessageSchema = z.object({
  content: z.string().min(1),
  attachmentUrl: z.string().optional(),
  attachmentName: z.string().optional(),
});

type RouteContext = {
  params: { id: string };
};

// GET /api/messages/conversations/[id] - Récupérer les messages d'une conversation
export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que l'utilisateur est participant de la conversation
    const participation = await prisma.conversation_participants.findFirst({
      where: {
        conversationId: params.id,
        userId: session.user.id,
      },
    });

    if (!participation) {
      return NextResponse.json(
        { error: 'Vous n\'êtes pas participant de cette conversation' },
        { status: 403 }
      );
    }

    // Récupérer les messages
    const messages = await prisma.internal_messages.findMany({
      where: {
        conversationId: params.id,
      },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        sentAt: 'asc',
      },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error(`Erreur GET /api/messages/conversations/${params.id}:`, error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST /api/messages/conversations/[id] - Envoyer un message
export async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que l'utilisateur est participant de la conversation
    const participation = await prisma.conversation_participants.findFirst({
      where: {
        conversationId: params.id,
        userId: session.user.id,
      },
    });

    if (!participation) {
      return NextResponse.json(
        { error: 'Vous n\'êtes pas participant de cette conversation' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = sendMessageSchema.parse(body);

    // Créer le message
    const message = await prisma.internal_messages.create({
      data: {
        id: `MSG-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        conversationId: params.id,
        senderId: session.user.id,
        content: validatedData.content,
        attachmentUrl: validatedData.attachmentUrl || null,
        attachmentName: validatedData.attachmentName || null,
      },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    // Mettre à jour la conversation avec le dernier message
    await prisma.internal_conversations.update({
      where: { id: params.id },
      data: {
        lastMessage: validatedData.content,
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Incrémenter le compteur de messages non lus pour tous les participants sauf l'expéditeur
    await prisma.conversation_participants.updateMany({
      where: {
        conversationId: params.id,
        userId: {
          not: session.user.id,
        },
      },
      data: {
        unreadCount: {
          increment: 1,
        },
      },
    });

    // Notification: Message reçu pour tous les autres participants
    const otherParticipants = await prisma.conversation_participants.findMany({
      where: {
        conversationId: params.id,
        userId: { not: session.user.id },
      },
      select: { userId: true },
    });

    if (otherParticipants.length > 0) {
      const recipientIds = otherParticipants.map(p => p.userId);
      notifyEvent('MESSAGE_RECEIVED', {
        actorId: session.user.id,
        actorName: session.user.name || session.user.email,
        entityId: params.id,
        entityName: 'conversation',
      }, recipientIds);
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error(`Erreur POST /api/messages/conversations/${params.id}:`, error);

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

// PUT /api/messages/conversations/[id] - Marquer la conversation comme lue
export async function PUT(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Mettre à jour le compteur de messages non lus
    await prisma.conversation_participants.updateMany({
      where: {
        conversationId: params.id,
        userId: session.user.id,
      },
      data: {
        unreadCount: 0,
        lastReadAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Erreur PUT /api/messages/conversations/${params.id}:`, error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
