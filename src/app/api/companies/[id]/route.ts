import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema de validation pour update (tous les champs optionnels)
const companyUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  siret: z.string().optional().nullable(),
  legalForm: z.string().optional().nullable(),
  gerant: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  employees: z.number().int().positive().optional().nullable(),
  revenue: z.number().positive().optional().nullable(),
  solvencyScore: z.number().int().min(0).max(100).optional().nullable(),
  status: z.enum(['LEAD', 'PROSPECT', 'CLIENT']).optional(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  country: z.string().optional(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  website: z.string().url().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
});

type RouteContext = {
  params: { id: string };
};

// GET /api/companies/[id] - Récupérer une entreprise par ID
export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const company = await prisma.company.findUnique({
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
            status: true,
            qualityScore: true,
          },
        },
        deals: {
          select: {
            id: true,
            title: true,
            value: true,
            stage: true,
            probability: true,
            expectedCloseDate: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Entreprise non trouvée' },
        { status: 404 }
      );
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error(`Erreur GET /api/companies/${params.id}:`, error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PUT /api/companies/[id] - Mettre à jour une entreprise
export async function PUT(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que l'entreprise existe
    const existingCompany = await prisma.company.findUnique({
      where: { id: params.id },
    });

    if (!existingCompany) {
      return NextResponse.json(
        { error: 'Entreprise non trouvée' },
        { status: 404 }
      );
    }

    // Parser et valider le body
    const body = await request.json();
    const validatedData = companyUpdateSchema.parse(body);

    // Vérifier l'unicité du SIRET si changé
    if (validatedData.siret && validatedData.siret !== existingCompany.siret) {
      const siretExists = await prisma.company.findFirst({
        where: {
          siret: validatedData.siret,
          id: { not: params.id },
        },
      });

      if (siretExists) {
        return NextResponse.json(
          { error: 'Une entreprise avec ce SIRET existe déjà' },
          { status: 400 }
        );
      }
    }

    // Mettre à jour l'entreprise
    const updatedCompany = await prisma.company.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        contacts: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            position: true,
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
      },
    });

    return NextResponse.json(updatedCompany);
  } catch (error) {
    console.error(`Erreur PUT /api/companies/${params.id}:`, error);

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

// DELETE /api/companies/[id] - Supprimer une entreprise
export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que l'entreprise existe
    const existingCompany = await prisma.company.findUnique({
      where: { id: params.id },
      include: {
        contacts: true,
        deals: true,
      },
    });

    if (!existingCompany) {
      return NextResponse.json(
        { error: 'Entreprise non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier s'il y a des contacts ou deals associés
    if (existingCompany.contacts.length > 0 || existingCompany.deals.length > 0) {
      return NextResponse.json(
        { error: 'Impossible de supprimer une entreprise ayant des contacts ou des deals associés' },
        { status: 400 }
      );
    }

    // Supprimer l'entreprise
    await prisma.company.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Entreprise supprimée avec succès' });
  } catch (error) {
    console.error(`Erreur DELETE /api/companies/${params.id}:`, error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
