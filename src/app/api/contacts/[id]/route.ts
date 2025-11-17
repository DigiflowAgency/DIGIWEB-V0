import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema de validation pour update (tous les champs optionnels)
const contactUpdateSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  position: z.string().optional().nullable(),
  companyId: z.string().optional().nullable(),
  siret: z.string().optional().nullable(),
  gerant: z.string().optional().nullable(),
  status: z.enum(['LEAD', 'PROSPECT', 'CLIENT']).optional(),
  qualityScore: z.number().int().min(0).max(100).optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  country: z.string().optional(),
  source: z.string().optional().nullable(),
});

type RouteContext = {
  params: { id: string };
};

// GET /api/contacts/[id] - Récupérer un contact par ID
export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const contact = await prisma.contact.findUnique({
      where: { id: params.id },
      include: {
        company: true,
        assignedTo: {
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
            probability: true,
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
      },
    });

    if (!contact) {
      return NextResponse.json(
        { error: 'Contact non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(contact);
  } catch (error) {
    console.error(`Erreur GET /api/contacts/${params.id}:`, error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PUT /api/contacts/[id] - Mettre à jour un contact
export async function PUT(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que le contact existe
    const existingContact = await prisma.contact.findUnique({
      where: { id: params.id },
    });

    if (!existingContact) {
      return NextResponse.json(
        { error: 'Contact non trouvé' },
        { status: 404 }
      );
    }

    // Parser et valider le body
    const body = await request.json();
    const validatedData = contactUpdateSchema.parse(body);

    // Vérifier l'unicité de l'email si changé
    if (validatedData.email && validatedData.email !== existingContact.email) {
      const emailExists = await prisma.contact.findFirst({
        where: {
          email: validatedData.email,
          id: { not: params.id },
        },
      });

      if (emailExists) {
        return NextResponse.json(
          { error: 'Un contact avec cet email existe déjà' },
          { status: 400 }
        );
      }
    }

    // Mettre à jour le contact
    const updatedContact = await prisma.contact.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        company: true,
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

    return NextResponse.json(updatedContact);
  } catch (error) {
    console.error(`Erreur PUT /api/contacts/${params.id}:`, error);

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

// DELETE /api/contacts/[id] - Supprimer un contact
export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que le contact existe
    const existingContact = await prisma.contact.findUnique({
      where: { id: params.id },
    });

    if (!existingContact) {
      return NextResponse.json(
        { error: 'Contact non trouvé' },
        { status: 404 }
      );
    }

    // Supprimer le contact
    await prisma.contact.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Contact supprimé avec succès' });
  } catch (error) {
    console.error(`Erreur DELETE /api/contacts/${params.id}:`, error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
