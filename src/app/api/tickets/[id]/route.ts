import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

// Schema de validation pour update (tous les champs optionnels)
const ticketUpdateSchema = z.object({
  subject: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  type: z.enum(['INTERNAL', 'CLIENT']).optional(),
  status: z.enum(['OUVERT', 'EN_COURS', 'EN_ATTENTE', 'ESCALADE', 'RESOLU', 'FERME']).optional(),
  priority: z.enum(['HAUTE', 'MOYENNE', 'BASSE']).optional(),
  assignedToId: z.string().optional().nullable(),
  clientName: z.string().optional().nullable(),
  clientEmail: z.string().email().optional().nullable(),
  resolvedAt: z.string().datetime().optional().nullable(),
  responseTime: z.number().int().min(0).optional().nullable(),
});

type RouteContext = {
  params: { id: string };
};

// GET /api/tickets/[id] - Récupérer un ticket par ID
export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const ticket = await prisma.tickets.findUnique({
      where: { id: params.id },
      include: {
        users_tickets_createdByIdTousers: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        users_tickets_assignedToIdTousers: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        ticket_replies: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error(`Erreur GET /api/tickets/${params.id}:`, error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PUT /api/tickets/[id] - Mettre à jour un ticket
export async function PUT(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que le ticket existe
    const existingTicket = await prisma.tickets.findUnique({
      where: { id: params.id },
    });

    if (!existingTicket) {
      return NextResponse.json(
        { error: 'Ticket non trouvé' },
        { status: 404 }
      );
    }

    // Parser et valider le body
    const body = await request.json();
    const validatedData = ticketUpdateSchema.parse(body);

    // Préparer les données de mise à jour
    const updateData: Prisma.ticketsUpdateInput = { ...validatedData };

    // Convertir les dates string en Date si elles existent
    if (validatedData.resolvedAt) {
      updateData.resolvedAt = new Date(validatedData.resolvedAt);
    }

    // Si le statut devient RESOLU, définir resolvedAt automatiquement
    if (validatedData.status === 'RESOLU' && !existingTicket.resolvedAt) {
      updateData.resolvedAt = validatedData.resolvedAt ? new Date(validatedData.resolvedAt) : new Date();

      // Calculer le temps de réponse si pas déjà défini
      if (!validatedData.responseTime) {
        const createdAt = existingTicket.createdAt;
        const resolvedAt = updateData.resolvedAt;
        const diffMs = resolvedAt.getTime() - createdAt.getTime();
        updateData.responseTime = Math.floor(diffMs / (1000 * 60)); // en minutes
      }
    }

    // Mettre à jour le ticket
    const updatedTicket = await prisma.tickets.update({
      where: { id: params.id },
      data: updateData,
      include: {
        users_tickets_createdByIdTousers: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        users_tickets_assignedToIdTousers: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    return NextResponse.json(updatedTicket);
  } catch (error) {
    console.error(`Erreur PUT /api/tickets/${params.id}:`, error);

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

// DELETE /api/tickets/[id] - Supprimer un ticket
export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que le ticket existe
    const existingTicket = await prisma.tickets.findUnique({
      where: { id: params.id },
    });

    if (!existingTicket) {
      return NextResponse.json(
        { error: 'Ticket non trouvé' },
        { status: 404 }
      );
    }

    // Supprimer le ticket (cascade supprimera aussi les replies)
    await prisma.tickets.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Ticket supprimé avec succès' });
  } catch (error) {
    console.error(`Erreur DELETE /api/tickets/${params.id}:`, error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
