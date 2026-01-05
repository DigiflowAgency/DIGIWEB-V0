import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notifyEvent } from '@/lib/notifications';

// GET /api/reminders/check-due - Vérifie les rappels échus et crée les notifications
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Trouver les rappels échus non lus qui n'ont pas encore eu de notification
    const dueReminders = await prisma.reminders.findMany({
      where: {
        userId: session.user.id,
        remindAt: { lte: new Date() },
        isRead: false,
        notifiedAt: null,
      },
      include: {
        deal: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // Créer notification + marquer comme notifié pour chaque rappel échu
    const notifiedCount = dueReminders.length;

    for (const reminder of dueReminders) {
      // Créer la notification
      notifyEvent('REMINDER_DUE', {
        actorId: session.user.id,
        actorName: 'Système',
        entityId: reminder.id,
        entityName: reminder.title,
        metadata: { dealId: reminder.dealId },
      }, [reminder.userId]);

      // Marquer comme notifié
      await prisma.reminders.update({
        where: { id: reminder.id },
        data: { notifiedAt: new Date() },
      });
    }

    return NextResponse.json({
      success: true,
      notifiedCount,
      message: notifiedCount > 0
        ? `${notifiedCount} rappel(s) échu(s) notifié(s)`
        : 'Aucun rappel échu'
    });
  } catch (error) {
    console.error('Erreur check-due reminders:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
