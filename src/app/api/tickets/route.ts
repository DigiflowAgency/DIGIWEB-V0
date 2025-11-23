import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

// Schema de validation Zod pour Ticket
const ticketSchema = z.object({
  subject: z.string().min(1, 'Le sujet est requis'),
  description: z.string().min(1, 'La description est requise'),
  type: z.enum(['INTERNAL', 'CLIENT']).optional(),
  status: z.enum(['OUVERT', 'EN_COURS', 'EN_ATTENTE', 'ESCALADE', 'RESOLU', 'FERME']).optional(),
  priority: z.enum(['HAUTE', 'MOYENNE', 'BASSE']).optional(),
  assignedToId: z.string().optional().nullable(),
  clientName: z.string().optional().nullable(),
  clientEmail: z.string().email().optional().nullable(),
  resolvedAt: z.string().datetime().optional().nullable(),
  responseTime: z.number().int().min(0).optional().nullable(),
});

// Fonction pour générer un numéro de ticket unique
async function generateTicketNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.tickets.count({
    where: { number: { startsWith: `TK-${year}-` } },
  });
  const nextNumber = (count + 1).toString().padStart(3, '0');
  return `TK-${year}-${nextNumber}`;
}

// GET /api/tickets - Liste tous les tickets
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Paramètres de recherche/filtrage
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const type = searchParams.get('type');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    // Construire la query Prisma
    const where: Prisma.ticketsWhereInput = {};

    // Filtre par texte de recherche
    if (search) {
      where.OR = [
        { number: { contains: search } },
        { subject: { contains: search } },
        { clientName: { contains: search } },
        { clientEmail: { contains: search } },
      ];
    }

    // Filtre par statut
    if (status && ['OUVERT', 'EN_COURS', 'EN_ATTENTE', 'ESCALADE', 'RESOLU', 'FERME'].includes(status)) {
      where.status = status as 'OUVERT' | 'EN_COURS' | 'EN_ATTENTE' | 'ESCALADE' | 'RESOLU' | 'FERME';
    }

    // Filtre par priorité
    if (priority && ['HAUTE', 'MOYENNE', 'BASSE'].includes(priority)) {
      where.priority = priority as 'HAUTE' | 'MOYENNE' | 'BASSE';
    }

    // Filtre par type
    if (type && ['INTERNAL', 'CLIENT'].includes(type)) {
      where.type = type as 'INTERNAL' | 'CLIENT';
    }

    // Récupérer les tickets avec les relations
    const tickets = await prisma.tickets.findMany({
      where,
      include: {
        users_tickets_createdByIdTousers: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        users_tickets_assignedToIdTousers: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: [
        { createdAt: 'desc' },
      ],
      take: limit,
    });

    // Calculer des stats
    const stats = {
      total: await prisma.tickets.count({ where }),
      ouvert: await prisma.tickets.count({ where: { ...where, status: 'OUVERT' } }),
      enCours: await prisma.tickets.count({ where: { ...where, status: 'EN_COURS' } }),
      enAttente: await prisma.tickets.count({ where: { ...where, status: 'EN_ATTENTE' } }),
      escalade: await prisma.tickets.count({ where: { ...where, status: 'ESCALADE' } }),
      resolu: await prisma.tickets.count({ where: { ...where, status: 'RESOLU' } }),
      ferme: await prisma.tickets.count({ where: { ...where, status: 'FERME' } }),
      avgResponseTime: await prisma.tickets.aggregate({
        where: { ...where, responseTime: { not: null } },
        _avg: { responseTime: true },
      }).then(result => result._avg.responseTime || 0),
    };

    return NextResponse.json({
      tickets,
      stats,
    });
  } catch (error) {
    console.error('Erreur GET /api/tickets:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST /api/tickets - Créer un nouveau ticket
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Parser et valider le body
    const body = await request.json();
    const validatedData = ticketSchema.parse(body);

    // Générer un numéro de ticket unique
    const number = await generateTicketNumber();

    // Convertir les dates string en Date si elles existent
    const data: any = {
      ...validatedData,
      number,
      users_tickets_createdByIdTousers: {
        connect: { id: session.user.id }
      },
    };

    if (validatedData.resolvedAt) {
      data.resolvedAt = new Date(validatedData.resolvedAt);
    }

    // Créer le ticket
    const ticket = await prisma.tickets.create({
      data,
      include: {
        users_tickets_createdByIdTousers: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        users_tickets_assignedToIdTousers: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /api/tickets:', error);

    // Erreur de validation Zod
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
