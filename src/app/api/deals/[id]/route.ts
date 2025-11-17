import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

// Schema de validation pour update (tous les champs optionnels)
const dealUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  value: z.number().positive().optional(),
  currency: z.string().optional(),
  stage: z.enum(['DECOUVERTE', 'QUALIFICATION', 'PROPOSITION', 'NEGOCIATION', 'GAGNE', 'PERDU']).optional(),
  probability: z.number().int().min(0).max(100).optional(),
  expectedCloseDate: z.string().datetime().optional().nullable(),
  contactId: z.string().optional().nullable(),
  companyId: z.string().optional().nullable(),
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

    const deal = await prisma.deal.findUnique({
      where: { id: params.id },
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            position: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
            city: true,
            siret: true,
          },
        },
        owner: {
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
            author: {
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
        products: {
          select: {
            id: true,
            quantity: true,
            unitPrice: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!deal) {
      return NextResponse.json(
        { error: 'Deal non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(deal);
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
    const existingDeal = await prisma.deal.findUnique({
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

    // Vérifier que l'entreprise existe (s'il est fournie)
    if (validatedData.companyId) {
      const company = await prisma.company.findUnique({
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
    const updateData: Prisma.DealUpdateInput = { ...validatedData };

    // Si le stage devient GAGNE ou PERDU, définir closedAt
    if (validatedData.stage === 'GAGNE' || validatedData.stage === 'PERDU') {
      if (!existingDeal.closedAt) {
        updateData.closedAt = new Date();
      }
    }

    // Convertir expectedCloseDate si présent
    if (validatedData.expectedCloseDate) {
      updateData.expectedCloseDate = new Date(validatedData.expectedCloseDate);
    }

    // Mettre à jour le deal
    const updatedDeal = await prisma.deal.update({
      where: { id: params.id },
      data: updateData,
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

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
    const existingDeal = await prisma.deal.findUnique({
      where: { id: params.id },
    });

    if (!existingDeal) {
      return NextResponse.json(
        { error: 'Deal non trouvé' },
        { status: 404 }
      );
    }

    // Supprimer le deal (les relations activities, notes, products seront supprimées en cascade)
    await prisma.deal.delete({
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
