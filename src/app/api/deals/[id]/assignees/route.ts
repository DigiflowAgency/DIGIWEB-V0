import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

type RouteContext = {
  params: { id: string };
};

// Schema de validation pour ajouter un assigné
const addAssigneeSchema = z.object({
  userId: z.string().min(1),
  role: z.string().optional(),
});

// GET /api/deals/[id]/assignees - Récupérer les assignés d'un deal
export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const assignees = await prisma.deal_assignees.findMany({
      where: { dealId: params.id },
      include: {
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
    });

    return NextResponse.json({ assignees });
  } catch (error) {
    console.error(`Erreur GET /api/deals/${params.id}/assignees:`, error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST /api/deals/[id]/assignees - Ajouter un assigné
export async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que le deal existe
    const deal = await prisma.deals.findUnique({
      where: { id: params.id },
    });

    if (!deal) {
      return NextResponse.json(
        { error: 'Deal non trouvé' },
        { status: 404 }
      );
    }

    // Parser et valider le body
    const body = await request.json();
    const validatedData = addAssigneeSchema.parse(body);

    // Vérifier que l'utilisateur existe
    const user = await prisma.users.findUnique({
      where: { id: validatedData.userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 400 }
      );
    }

    // Vérifier si l'assignation existe déjà
    const existingAssignment = await prisma.deal_assignees.findUnique({
      where: {
        dealId_userId: {
          dealId: params.id,
          userId: validatedData.userId,
        },
      },
    });

    if (existingAssignment) {
      return NextResponse.json(
        { error: 'Cet utilisateur est déjà assigné à ce deal' },
        { status: 400 }
      );
    }

    // Créer l'assignation
    const assignee = await prisma.deal_assignees.create({
      data: {
        dealId: params.id,
        userId: validatedData.userId,
        role: validatedData.role || null,
      },
      include: {
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
    });

    return NextResponse.json(assignee, { status: 201 });
  } catch (error) {
    console.error(`Erreur POST /api/deals/${params.id}/assignees:`, error);

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

// DELETE /api/deals/[id]/assignees - Supprimer un assigné
export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId requis' },
        { status: 400 }
      );
    }

    // Vérifier que l'assignation existe
    const existingAssignment = await prisma.deal_assignees.findUnique({
      where: {
        dealId_userId: {
          dealId: params.id,
          userId: userId,
        },
      },
    });

    if (!existingAssignment) {
      return NextResponse.json(
        { error: 'Assignation non trouvée' },
        { status: 404 }
      );
    }

    // Supprimer l'assignation
    await prisma.deal_assignees.delete({
      where: {
        dealId_userId: {
          dealId: params.id,
          userId: userId,
        },
      },
    });

    return NextResponse.json({ message: 'Assignation supprimée avec succès' });
  } catch (error) {
    console.error(`Erreur DELETE /api/deals/${params.id}/assignees:`, error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
