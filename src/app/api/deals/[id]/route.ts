import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { notifyEvent, getAdminIds } from '@/lib/notifications';

// Fonction pour calculer automatiquement la probabilité selon l'étape
function getProbabilityByStage(stage: string): number {
  const probabilityMap: { [key: string]: number } = {
    'A_CONTACTER': 10,
    'EN_DISCUSSION': 30,
    'A_RELANCER': 20,
    'RDV_PRIS': 50,
    'NEGO_HOT': 70,
    'CLOSING': 90,
    'REFUSE': 0,
  };
  return probabilityMap[stage] || 50;
}

// Schema de validation pour update (tous les champs optionnels)
const dealUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  value: z.number().positive().optional(),
  currency: z.string().optional(),
  stage: z.enum(['A_CONTACTER', 'EN_DISCUSSION', 'A_RELANCER', 'RDV_PRIS', 'NEGO_HOT', 'CLOSING', 'REFUSE']).optional(),
  productionStage: z.enum(['PREMIER_RDV', 'EN_PRODUCTION', 'LIVRE', 'ENCAISSE']).optional().nullable(),
  probability: z.number().int().min(0).max(100).optional(),
  expectedCloseDate: z.string().optional().nullable(),
  contactId: z.string().optional().nullable(),
  companyId: z.string().optional().nullable(),
  ownerId: z.string().optional(),
  product: z.string().optional().nullable(),
  origin: z.string().optional().nullable(),
  emailReminderSent: z.string().optional().nullable(),
  smsReminderSent: z.string().optional().nullable(),
  comments: z.string().optional().nullable(),
});

type RouteContext = {
  params: { id: string };
};

// GET /api/deals/[id] - Récupérer un deal par ID
export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const deal = await prisma.deals.findUnique({
      where: { id: params.id },
      include: {
        contacts: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            position: true,
          },
        },
        companies: {
          select: {
            id: true,
            name: true,
            city: true,
            siret: true,
          },
        },
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        activities: {
          select: {
            id: true,
            title: true,
            type: true,
            status: true,
            scheduledAt: true,
          },
          orderBy: { scheduledAt: 'desc' },
          take: 10,
        },
        notes: {
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
          take: 10,
        },
        deal_products: {
          select: {
            id: true,
            quantity: true,
            unitPrice: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        deal_assignees: {
          select: {
            id: true,
            role: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!deal) {
      return NextResponse.json(
        { error: 'Deal non trouvé' },
        { status: 404 }
      );
    }

    // Récupérer le meta_lead associé à ce deal (si converti depuis Ads)
    const metaLead = await prisma.meta_leads.findFirst({
      where: { dealId: params.id },
      select: {
        id: true,
        customFields: true,
        pageName: true,
        campaignName: true,
        adName: true,
        formName: true,
        platform: true,
        isOrganic: true,
      },
    });

    // Combiner le deal avec les infos du meta_lead
    const dealWithMetaLead = {
      ...deal,
      metaLead: metaLead || null,
    };

    return NextResponse.json(dealWithMetaLead);
  } catch (error) {
    console.error(`Erreur GET /api/deals/${params.id}:`, error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PUT /api/deals/[id] - Mettre à jour un deal
export async function PUT(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que le deal existe
    const existingDeal = await prisma.deals.findUnique({
      where: { id: params.id },
    });

    if (!existingDeal) {
      return NextResponse.json(
        { error: 'Deal non trouvé' },
        { status: 404 }
      );
    }

    // Parser et valider le body
    const body = await request.json();
    const validatedData = dealUpdateSchema.parse(body);

    // Si le stage change, calculer automatiquement la nouvelle probabilité
    if (validatedData.stage && !validatedData.probability) {
      validatedData.probability = getProbabilityByStage(validatedData.stage);
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

    // Vérifier que l'entreprise existe (s'il est fournie)
    if (validatedData.companyId) {
      const company = await prisma.companies.findUnique({
        where: { id: validatedData.companyId },
      });

      if (!company) {
        return NextResponse.json(
          { error: 'Entreprise non trouvée' },
          { status: 400 }
        );
      }
    }

    // Préparer les données de mise à jour
    const updateData: Prisma.dealsUpdateInput = { ...validatedData };

    // Gestion de closedAt selon le stage
    if (validatedData.stage === 'CLOSING' || validatedData.stage === 'REFUSE') {
      // Si le stage devient CLOSING ou REFUSE, définir closedAt
      if (!existingDeal.closedAt) {
        updateData.closedAt = new Date();
      }
    } else if (validatedData.stage) {
      // Si on sort de CLOSING/REFUSE vers un autre stage, effacer closedAt
      updateData.closedAt = null;
    }

    // Convertir expectedCloseDate si présent
    if (validatedData.expectedCloseDate) {
      updateData.expectedCloseDate = new Date(validatedData.expectedCloseDate);
    }

    // Mettre à jour le deal
    const updatedDeal = await prisma.deals.update({
      where: { id: params.id },
      data: updateData,
      include: {
        contacts: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        companies: {
          select: {
            id: true,
            name: true,
            city: true,
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
        deal_assignees: {
          select: {
            userId: true,
          },
        },
      },
    });

    // Historique et notifications selon le changement de stage
    if (validatedData.stage && validatedData.stage !== existingDeal.stage) {
      // Créer l'entrée dans l'historique des stages
      await prisma.deal_stage_history.create({
        data: {
          dealId: params.id,
          fromStage: existingDeal.stage,
          toStage: validatedData.stage,
          changedById: session.user.id,
        },
      });

      const actorName = session.user.name || session.user.email;
      const assigneeIds = updatedDeal.deal_assignees.map((a: { userId: string }) => a.userId);
      const recipients = [updatedDeal.ownerId, ...assigneeIds];

      if (validatedData.stage === 'CLOSING') {
        // Deal gagné - notifier aussi les admins
        const adminIds = await getAdminIds();
        notifyEvent('DEAL_CLOSED_WON', {
          actorId: session.user.id,
          actorName,
          entityId: updatedDeal.id,
          entityName: updatedDeal.title,
        }, [...recipients, ...adminIds]);
      } else if (validatedData.stage === 'REFUSE') {
        // Deal perdu - notifier aussi les admins
        const adminIds = await getAdminIds();
        notifyEvent('DEAL_CLOSED_LOST', {
          actorId: session.user.id,
          actorName,
          entityId: updatedDeal.id,
          entityName: updatedDeal.title,
        }, [...recipients, ...adminIds]);
      } else {
        // Changement de stage normal
        notifyEvent('DEAL_STAGE_CHANGED', {
          actorId: session.user.id,
          actorName,
          entityId: updatedDeal.id,
          entityName: updatedDeal.title,
          oldValue: existingDeal.stage,
          newValue: validatedData.stage,
        }, recipients);
      }
    }

    return NextResponse.json(updatedDeal);
  } catch (error) {
    console.error(`Erreur PUT /api/deals/${params.id}:`, error);

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

// PATCH /api/deals/[id] - Mise à jour partielle d'un deal (ex: productionStage)
export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que le deal existe
    const existingDeal = await prisma.deals.findUnique({
      where: { id: params.id },
    });

    if (!existingDeal) {
      return NextResponse.json(
        { error: 'Deal non trouvé' },
        { status: 404 }
      );
    }

    // Parser le body (mise à jour partielle)
    const body = await request.json();

    // Préparer les données de mise à jour
    const updateData: any = {};

    // Autoriser uniquement certains champs pour PATCH
    if ('productionStage' in body) {
      updateData.productionStage = body.productionStage;
    }

    if ('stage' in body) {
      updateData.stage = body.stage;
      // Calculer automatiquement la probabilité selon la nouvelle étape
      updateData.probability = getProbabilityByStage(body.stage);
      // Gestion de closedAt selon le stage
      if (body.stage === 'CLOSING' || body.stage === 'REFUSE') {
        // Si le stage devient CLOSING ou REFUSE, définir closedAt
        if (!existingDeal.closedAt) {
          updateData.closedAt = new Date();
        }
      } else {
        // Si on sort de CLOSING/REFUSE vers un autre stage, effacer closedAt
        updateData.closedAt = null;
      }
    }

    if ('ownerId' in body) {
      updateData.ownerId = body.ownerId;
    }

    if ('value' in body) {
      updateData.value = body.value;
    }

    if ('probability' in body && !('stage' in body)) {
      updateData.probability = body.probability;
    }

    if ('expectedCloseDate' in body) {
      updateData.expectedCloseDate = body.expectedCloseDate ? new Date(body.expectedCloseDate) : null;
    }

    if ('product' in body) {
      updateData.product = body.product;
    }

    if ('origin' in body) {
      updateData.origin = body.origin;
    }

    if ('emailReminderSent' in body) {
      updateData.emailReminderSent = body.emailReminderSent;
    }

    if ('smsReminderSent' in body) {
      updateData.smsReminderSent = body.smsReminderSent;
    }

    if ('comments' in body) {
      updateData.comments = body.comments;
    }

    // Mettre à jour le deal
    const updatedDeal = await prisma.deals.update({
      where: { id: params.id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      include: {
        deal_assignees: {
          select: {
            userId: true,
          },
        },
      },
    });

    // Historique et notifications selon le changement de stage
    if ('stage' in body && body.stage !== existingDeal.stage) {
      // Créer l'entrée dans l'historique des stages
      await prisma.deal_stage_history.create({
        data: {
          dealId: params.id,
          fromStage: existingDeal.stage,
          toStage: body.stage,
          changedById: session.user.id,
        },
      });

      const actorName = session.user.name || session.user.email;
      const assigneeIds = updatedDeal.deal_assignees.map((a: { userId: string }) => a.userId);
      const recipients = [updatedDeal.ownerId, ...assigneeIds];

      if (body.stage === 'CLOSING') {
        const adminIds = await getAdminIds();
        notifyEvent('DEAL_CLOSED_WON', {
          actorId: session.user.id,
          actorName,
          entityId: updatedDeal.id,
          entityName: updatedDeal.title,
        }, [...recipients, ...adminIds]);
      } else if (body.stage === 'REFUSE') {
        const adminIds = await getAdminIds();
        notifyEvent('DEAL_CLOSED_LOST', {
          actorId: session.user.id,
          actorName,
          entityId: updatedDeal.id,
          entityName: updatedDeal.title,
        }, [...recipients, ...adminIds]);
      } else {
        notifyEvent('DEAL_STAGE_CHANGED', {
          actorId: session.user.id,
          actorName,
          entityId: updatedDeal.id,
          entityName: updatedDeal.title,
          oldValue: existingDeal.stage,
          newValue: body.stage,
        }, recipients);
      }
    }

    return NextResponse.json(updatedDeal);
  } catch (error) {
    console.error(`Erreur PATCH /api/deals/${params.id}:`, error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// DELETE /api/deals/[id] - Supprimer un deal
export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que le deal existe
    const existingDeal = await prisma.deals.findUnique({
      where: { id: params.id },
    });

    if (!existingDeal) {
      return NextResponse.json(
        { error: 'Deal non trouvé' },
        { status: 404 }
      );
    }

    // Supprimer le deal (les relations activities, notes, products seront supprimées en cascade)
    await prisma.deals.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Deal supprimé avec succès' });
  } catch (error) {
    console.error(`Erreur DELETE /api/deals/${params.id}:`, error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
