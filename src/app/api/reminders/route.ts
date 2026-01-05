import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { notifyEvent } from '@/lib/notifications';

// Schema de validation pour créer un rappel
const createReminderSchema = z.object({
  dealId: z.string().optional().nullable(),
  contactId: z.string().optional().nullable(),
  targetUserId: z.string().optional().nullable(), // Utilisateur destinataire (optionnel)
  title: z.string().min(1, 'Le titre est requis'),
  description: z.string().optional().nullable(),
  remindAt: z.string().min(1, 'La date de rappel est requise'),
});

// GET /api/reminders - Récupérer les rappels de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dealId = searchParams.get('dealId');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const upcoming = searchParams.get('upcoming') === 'true';

    const where: any = {
      userId: session.user.id,
    };

    if (dealId) {
      where.dealId = dealId;
    }

    if (unreadOnly) {
      where.isRead = false;
    }

    // Pour les rappels "à venir" (due dans les 7 prochains jours ou en retard)
    if (upcoming) {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      where.remindAt = {
        lte: nextWeek,
      };
      where.isRead = false;
    }

    const reminders = await prisma.reminders.findMany({
      where,
      include: {
        deal: {
          select: {
            id: true,
            title: true,
            companies: {
              select: {
                name: true,
              },
            },
          },
        },
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { remindAt: 'asc' },
    });

    // Compter les rappels non lus
    const unreadCount = await prisma.reminders.count({
      where: {
        userId: session.user.id,
        isRead: false,
        remindAt: {
          lte: new Date(),
        },
      },
    });

    return NextResponse.json({ reminders, unreadCount });
  } catch (error) {
    console.error('Erreur GET /api/reminders:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST /api/reminders - Créer un rappel
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createReminderSchema.parse(body);

    // Vérifier que le deal existe (s'il est fourni)
    if (validatedData.dealId) {
      const deal = await prisma.deals.findUnique({
        where: { id: validatedData.dealId },
      });

      if (!deal) {
        return NextResponse.json(
          { error: 'Deal non trouvé' },
          { status: 400 }
        );
      }
    }

    // Vérifier que le contact existe (s'il est fourni)
    if (validatedData.contactId) {
      const contact = await prisma.contacts.findUnique({
        where: { id: validatedData.contactId },
      });

      if (!contact) {
        return NextResponse.json(
          { error: 'Contact non trouvé' },
          { status: 400 }
        );
      }
    }

    // Déterminer le destinataire du rappel
    const reminderUserId = validatedData.targetUserId || session.user.id;

    const reminder = await prisma.reminders.create({
      data: {
        userId: reminderUserId,
        dealId: validatedData.dealId || null,
        contactId: validatedData.contactId || null,
        title: validatedData.title,
        description: validatedData.description || null,
        remindAt: new Date(validatedData.remindAt),
      },
      include: {
        deal: {
          select: {
            id: true,
            title: true,
          },
        },
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Notification: Rappel assigné à quelqu'un d'autre
    if (reminderUserId !== session.user.id) {
      notifyEvent('REMINDER_ASSIGNED', {
        actorId: session.user.id,
        actorName: session.user.name || session.user.email,
        entityId: reminder.id,
        entityName: reminder.title,
        metadata: { dealId: validatedData.dealId },
      }, [reminderUserId]);
    }

    return NextResponse.json(reminder, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /api/reminders:', error);

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
