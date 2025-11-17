import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema de validation Zod pour Activity
const activitySchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  description: z.string().optional().nullable(),
  type: z.enum(['APPEL', 'EMAIL', 'REUNION', 'VISIO']),
  status: z.enum(['PLANIFIEE', 'COMPLETEE', 'ANNULEE']).default('PLANIFIEE'),
  priority: z.enum(['HAUTE', 'MOYENNE', 'BASSE']).default('MOYENNE'),
  scheduledAt: z.string().datetime(),
  duration: z.number().int().positive().optional().nullable(),
  contactId: z.string().optional().nullable(),
  dealId: z.string().optional().nullable(),
});

// GET /api/activities - Liste toutes les activités
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
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const contactId = searchParams.get('contactId');
    const dealId = searchParams.get('dealId');
    const priority = searchParams.get('priority');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    // Construire la query Prisma
    const where: any = {};

    // Filtre par texte de recherche
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { contact: { firstName: { contains: search, mode: 'insensitive' } } },
        { contact: { lastName: { contains: search, mode: 'insensitive' } } },
        { deal: { title: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Filtre par type
    if (type && ['APPEL', 'EMAIL', 'REUNION', 'VISIO'].includes(type)) {
      where.type = type;
    }

    // Filtre par statut
    if (status && ['PLANIFIEE', 'COMPLETEE', 'ANNULEE'].includes(status)) {
      where.status = status;
    }

    // Filtre par priorité
    if (priority && ['HAUTE', 'MOYENNE', 'BASSE'].includes(priority)) {
      where.priority = priority;
    }

    // Filtre par contact
    if (contactId) {
      where.contactId = contactId;
    }

    // Filtre par deal
    if (dealId) {
      where.dealId = dealId;
    }

    // Récupérer les activités
    const activities = await prisma.activity.findMany({
      where,
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        deal: {
          select: {
            id: true,
            title: true,
            value: true,
            stage: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: [
        { scheduledAt: 'asc' },
      ],
      take: limit,
    });

    // Calculer des stats
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const stats = {
      total: await prisma.activity.count({ where }),
      planifiees: await prisma.activity.count({ where: { ...where, status: 'PLANIFIEE' } }),
      completees: await prisma.activity.count({ where: { ...where, status: 'COMPLETEE' } }),
      aujourdhui: await prisma.activity.count({
        where: {
          ...where,
          scheduledAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),
    };

    return NextResponse.json({
      activities,
      stats,
    });
  } catch (error) {
    console.error('Erreur GET /api/activities:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST /api/activities - Créer une nouvelle activité
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Parser et valider le body
    const body = await request.json();
    const validatedData = activitySchema.parse(body);

    // Vérifier que le contact existe (s'il est fourni)
    if (validatedData.contactId) {
      const contact = await prisma.contact.findUnique({
        where: { id: validatedData.contactId },
      });

      if (!contact) {
        return NextResponse.json(
          { error: 'Contact non trouvé' },
          { status: 400 }
        );
      }
    }

    // Vérifier que le deal existe (s'il est fourni)
    if (validatedData.dealId) {
      const deal = await prisma.deal.findUnique({
        where: { id: validatedData.dealId },
      });

      if (!deal) {
        return NextResponse.json(
          { error: 'Deal non trouvé' },
          { status: 400 }
        );
      }
    }

    // Créer l'activité
    const activity = await prisma.activity.create({
      data: {
        ...validatedData,
        scheduledAt: new Date(validatedData.scheduledAt),
        assignedToId: session.user.id, // Assigner au user connecté
      },
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        deal: {
          select: {
            id: true,
            title: true,
            value: true,
            stage: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /api/activities:', error);

    // Erreur de validation Zod
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
