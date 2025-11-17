import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema de validation pour update (tous les champs optionnels)
const activityUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  type: z.enum(['APPEL', 'EMAIL', 'REUNION', 'VISIO']).optional(),
  status: z.enum(['PLANIFIEE', 'COMPLETEE', 'ANNULEE']).optional(),
  priority: z.enum(['HAUTE', 'MOYENNE', 'BASSE']).optional(),
  scheduledAt: z.string().datetime().optional(),
  duration: z.number().int().positive().optional().nullable(),
  contactId: z.string().optional().nullable(),
  dealId: z.string().optional().nullable(),
});

type RouteContext = {
  params: { id: string };
};

// GET /api/activities/[id] - Récupérer une activité par ID
export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const activity = await prisma.activity.findUnique({
      where: { id: params.id },
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            company: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        deal: {
          select: {
            id: true,
            title: true,
            value: true,
            stage: true,
            probability: true,
          },
        },
        assignedTo: {
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

    if (!activity) {
      return NextResponse.json(
        { error: 'Activité non trouvée' },
        { status: 404 }
      );
    }

    return NextResponse.json(activity);
  } catch (error) {
    console.error(`Erreur GET /api/activities/${params.id}:`, error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PUT /api/activities/[id] - Mettre à jour une activité
export async function PUT(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que l'activité existe
    const existingActivity = await prisma.activity.findUnique({
      where: { id: params.id },
    });

    if (!existingActivity) {
      return NextResponse.json(
        { error: 'Activité non trouvée' },
        { status: 404 }
      );
    }

    // Parser et valider le body
    const body = await request.json();
    const validatedData = activityUpdateSchema.parse(body);

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

    // Préparer les données de mise à jour
    const updateData: any = { ...validatedData };

    // Si le statut devient COMPLETEE, définir completedAt
    if (validatedData.status === 'COMPLETEE' && !existingActivity.completedAt) {
      updateData.completedAt = new Date();
    }

    // Si scheduledAt est fourni, le convertir en Date
    if (validatedData.scheduledAt) {
      updateData.scheduledAt = new Date(validatedData.scheduledAt);
    }

    // Mettre à jour l'activité
    const updatedActivity = await prisma.activity.update({
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

    return NextResponse.json(updatedActivity);
  } catch (error) {
    console.error(`Erreur PUT /api/activities/${params.id}:`, error);

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

// DELETE /api/activities/[id] - Supprimer une activité
export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que l'activité existe
    const existingActivity = await prisma.activity.findUnique({
      where: { id: params.id },
    });

    if (!existingActivity) {
      return NextResponse.json(
        { error: 'Activité non trouvée' },
        { status: 404 }
      );
    }

    // Supprimer l'activité
    await prisma.activity.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Activité supprimée avec succès' });
  } catch (error) {
    console.error(`Erreur DELETE /api/activities/${params.id}:`, error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
