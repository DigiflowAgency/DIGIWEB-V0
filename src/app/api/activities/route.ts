import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { notifyEvent } from '@/lib/notifications';

// Schema de validation Zod pour Activity
const activitySchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  description: z.string().optional().nullable(),
  type: z.enum(['APPEL', 'EMAIL', 'REUNION', 'VISIO']),
  status: z.enum(['PLANIFIEE', 'COMPLETEE', 'ANNULEE']).default('PLANIFIEE'),
  priority: z.enum(['HAUTE', 'MOYENNE', 'BASSE']).default('MOYENNE'),
  scheduledAt: z.string().datetime(),
  completedAt: z.string().datetime().optional().nullable(),
  duration: z.number().int().positive().optional().nullable(),
  contactId: z.string().optional().nullable(),
  dealId: z.string().optional().nullable(),
  // Champs outcome et notes
  outcome: z.enum(['ANSWERED', 'VOICEMAIL', 'NO_ANSWER', 'CALLBACK', 'PROPOSAL_SENT']).optional().nullable(),
  resultNotes: z.string().optional().nullable(),
  // Champs qualification
  temperature: z.enum(['HOT', 'WARM', 'COLD']).optional().nullable(),
  budgetDiscussed: z.boolean().optional().nullable(),
  decisionMaker: z.boolean().optional().nullable(),
  mainObjection: z.enum(['PRICE', 'TIMING', 'COMPETITOR', 'NO_NEED', 'OTHER']).optional().nullable(),
  // Champs prochaine action
  nextAction: z.enum(['CALLBACK', 'SEND_QUOTE', 'MEETING', 'FOLLOWUP', 'CLOSE']).optional().nullable(),
  nextActionDate: z.string().datetime().optional().nullable(),
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
    const assignedToId = searchParams.get('assignedToId');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const orderBy = searchParams.get('orderBy') || 'scheduledAt';
    const order = searchParams.get('order') || 'asc';

    // Construire la query Prisma
    const where: Prisma.activitiesWhereInput = {};

    // Filtre par texte de recherche
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { contacts: { firstName: { contains: search } } },
        { contacts: { lastName: { contains: search } } },
        { deals: { title: { contains: search } } },
      ];
    }

    // Filtre par type
    if (type && ['APPEL', 'EMAIL', 'REUNION', 'VISIO'].includes(type)) {
      where.type = type as 'APPEL' | 'EMAIL' | 'REUNION' | 'VISIO';
    }

    // Filtre par statut
    if (status && ['PLANIFIEE', 'COMPLETEE', 'ANNULEE'].includes(status)) {
      where.status = status as 'PLANIFIEE' | 'COMPLETEE' | 'ANNULEE';
    }

    // Filtre par priorité
    if (priority && ['HAUTE', 'MOYENNE', 'BASSE'].includes(priority)) {
      where.priority = priority as 'HAUTE' | 'MOYENNE' | 'BASSE';
    }

    // Filtre par contact
    if (contactId) {
      where.contactId = contactId;
    }

    // Filtre par deal
    if (dealId) {
      where.dealId = dealId;
    }

    // Filtre par utilisateur assigné
    if (assignedToId) {
      where.assignedToId = assignedToId;
    }

    // Récupérer les activités
    const activities = await prisma.activities.findMany({
      where,
      include: {
        contacts: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        deals: {
          select: {
            id: true,
            title: true,
            value: true,
            stage: true,
          },
        },
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: [
        { [orderBy]: order as 'asc' | 'desc' },
      ],
      take: limit,
    });

    // Calculer des stats
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const stats = {
      total: await prisma.activities.count({ where }),
      planifiees: await prisma.activities.count({ where: { ...where, status: 'PLANIFIEE' } }),
      completees: await prisma.activities.count({ where: { ...where, status: 'COMPLETEE' } }),
      aujourdhui: await prisma.activities.count({
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

    // Créer l'activité
    const activity = await prisma.activities.create({
      data: {
        id: `activity_${Date.now()}`,
        ...validatedData,
        scheduledAt: new Date(validatedData.scheduledAt),
        completedAt: validatedData.completedAt ? new Date(validatedData.completedAt) : null,
        nextActionDate: validatedData.nextActionDate ? new Date(validatedData.nextActionDate) : null,
        assignedToId: session.user.id,
        updatedAt: new Date(),
      } as any,
      include: {
        contacts: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        deals: {
          select: {
            id: true,
            title: true,
            value: true,
            stage: true,
          },
        },
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Notification: Activité créée
    notifyEvent('ACTIVITY_CREATED', {
      actorId: session.user.id,
      actorName: session.user.name || session.user.email,
      entityId: activity.id,
      entityName: activity.title,
    }, [session.user.id]);

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /api/activities:', error);

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
