import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

type RouteContext = {
  params: { id: string };
};

// Schema de validation pour update
const updateReminderSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  remindAt: z.string().optional(),
  isRead: z.boolean().optional(),
});

// GET /api/reminders/[id] - Récupérer un rappel par ID
export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const reminder = await prisma.reminders.findUnique({
      where: { id: params.id },
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
    });

    if (!reminder) {
      return NextResponse.json(
        { error: 'Rappel non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur est propriétaire du rappel
    if (reminder.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    return NextResponse.json(reminder);
  } catch (error) {
    console.error(`Erreur GET /api/reminders/${params.id}:`, error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PATCH /api/reminders/[id] - Mettre à jour un rappel
export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que le rappel existe et appartient à l'utilisateur
    const existingReminder = await prisma.reminders.findUnique({
      where: { id: params.id },
    });

    if (!existingReminder) {
      return NextResponse.json(
        { error: 'Rappel non trouvé' },
        { status: 404 }
      );
    }

    if (existingReminder.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateReminderSchema.parse(body);

    const updateData: any = {};

    if (validatedData.title !== undefined) {
      updateData.title = validatedData.title;
    }

    if (validatedData.description !== undefined) {
      updateData.description = validatedData.description;
    }

    if (validatedData.remindAt !== undefined) {
      updateData.remindAt = new Date(validatedData.remindAt);
    }

    if (validatedData.isRead !== undefined) {
      updateData.isRead = validatedData.isRead;
    }

    const updatedReminder = await prisma.reminders.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json(updatedReminder);
  } catch (error) {
    console.error(`Erreur PATCH /api/reminders/${params.id}:`, error);

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

// DELETE /api/reminders/[id] - Supprimer un rappel
export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que le rappel existe et appartient à l'utilisateur
    const existingReminder = await prisma.reminders.findUnique({
      where: { id: params.id },
    });

    if (!existingReminder) {
      return NextResponse.json(
        { error: 'Rappel non trouvé' },
        { status: 404 }
      );
    }

    if (existingReminder.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    await prisma.reminders.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Rappel supprimé avec succès' });
  } catch (error) {
    console.error(`Erreur DELETE /api/reminders/${params.id}:`, error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
