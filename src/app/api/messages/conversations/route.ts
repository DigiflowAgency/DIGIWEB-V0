import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema pour créer une conversation
const createConversationSchema = z.object({
  participantIds: z.array(z.string()).min(1),
  isGroup: z.boolean().default(false),
  name: z.string().optional(),
});

// GET /api/messages/conversations - Récupérer toutes les conversations de l'utilisateur
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Récupérer toutes les conversations où l'utilisateur est participant
    const participations = await prisma.conversation_participants.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        internal_conversations: {
          include: {
            conversation_participants: {
              include: {
                users: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    avatar: true,
                    status: true,
                  },
                },
              },
            },
            internal_messages: {
              take: 1,
              orderBy: {
                sentAt: 'desc',
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
            },
          },
        },
      },
      orderBy: {
        internal_conversations: {
          lastMessageAt: 'desc',
        },
      },
    });

    // Formater les conversations
    const conversations = participations.map((p) => {
      const conv = p.internal_conversations;
      const otherParticipants = conv.conversation_participants.filter(
        (cp) => cp.userId !== session.user.id
      );

      // Pour les conversations 1-to-1, utiliser le nom de l'autre utilisateur
      let displayName = conv.name;
      let displayAvatar = conv.avatar;

      if (!conv.isGroup && otherParticipants.length === 1) {
        const otherUser = otherParticipants[0].users;
        displayName = `${otherUser.firstName} ${otherUser.lastName}`;
        displayAvatar = otherUser.avatar || null;
      }

      return {
        id: conv.id,
        name: displayName,
        isGroup: conv.isGroup,
        avatar: displayAvatar,
        lastMessage: conv.lastMessage,
        lastMessageAt: conv.lastMessageAt,
        unreadCount: p.unreadCount,
        participants: conv.conversation_participants.map((cp) => ({
          id: cp.users.id,
          firstName: cp.users.firstName,
          lastName: cp.users.lastName,
          email: cp.users.email,
          avatar: cp.users.avatar,
          status: cp.users.status,
        })),
        lastMessageSender: conv.internal_messages[0]?.users
          ? `${conv.internal_messages[0].users.firstName} ${conv.internal_messages[0].users.lastName}`
          : null,
      };
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Erreur GET /api/messages/conversations:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST /api/messages/conversations - Créer une nouvelle conversation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createConversationSchema.parse(body);

    // Si c'est un groupe, vérifier que l'utilisateur est admin
    if (validatedData.isGroup && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Seuls les administrateurs peuvent créer des groupes' },
        { status: 403 }
      );
    }

    // Vérifier si une conversation 1-to-1 existe déjà entre ces utilisateurs
    if (!validatedData.isGroup && validatedData.participantIds.length === 1) {
      const existingConv = await prisma.internal_conversations.findFirst({
        where: {
          isGroup: false,
          AND: [
            {
              conversation_participants: {
                some: { userId: session.user.id },
              },
            },
            {
              conversation_participants: {
                some: { userId: validatedData.participantIds[0] },
              },
            },
          ],
        },
        include: {
          conversation_participants: {
            include: {
              users: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  avatar: true,
                  status: true,
                },
              },
            },
          },
        },
      });

      if (existingConv && existingConv.conversation_participants.length === 2) {
        // Retourner la conversation existante
        const otherUser = existingConv.conversation_participants.find(
          (p) => p.userId !== session.user.id
        )?.users;

        return NextResponse.json({
          conversation: {
            id: existingConv.id,
            name: otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : null,
            isGroup: false,
            avatar: otherUser?.avatar || null,
            participants: existingConv.conversation_participants.map((p) => p.users),
          },
        });
      }
    }

    // Créer la nouvelle conversation
    const conversation = await prisma.internal_conversations.create({
      data: {
        id: `CONV-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: validatedData.name || null,
        isGroup: validatedData.isGroup,
        createdById: session.user.id,
        updatedAt: new Date(),
        conversation_participants: {
          create: [
            {
              id: `CP-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              userId: session.user.id,
            },
            ...validatedData.participantIds.map((userId) => ({
              id: `CP-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              userId,
            })),
          ],
        },
      } as any,
      include: {
        conversation_participants: {
          include: {
            users: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
                status: true,
              },
            },
          },
        },
      },
    });

    // Formater la réponse pour le frontend
    const formattedConversation = {
      id: conversation.id,
      name: conversation.name,
      isGroup: conversation.isGroup,
      avatar: conversation.avatar,
      lastMessage: conversation.lastMessage,
      lastMessageAt: conversation.lastMessageAt,
      unreadCount: 0,
      participants: conversation.conversation_participants.map((cp: any) => ({
        id: cp.users.id,
        firstName: cp.users.firstName,
        lastName: cp.users.lastName,
        email: cp.users.email,
        avatar: cp.users.avatar,
        status: cp.users.status,
      })),
    };

    return NextResponse.json({ conversation: formattedConversation }, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /api/messages/conversations:', error);

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
