import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

// Schema de validation Zod pour Deal
const dealSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  description: z.string().optional().nullable(),
  value: z.number().positive('Le montant doit être positif'),
  currency: z.string().default('EUR'),
  stage: z.enum(['DECOUVERTE', 'QUALIFICATION', 'PROPOSITION', 'NEGOCIATION', 'GAGNE', 'PERDU']).default('DECOUVERTE'),
  probability: z.number().int().min(0).max(100).default(50),
  expectedCloseDate: z.string().datetime().optional().nullable(),
  contactId: z.string().optional().nullable(),
  companyId: z.string().optional().nullable(),
});

// GET /api/deals - Liste tous les deals
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
    const stage = searchParams.get('stage');
    const contactId = searchParams.get('contactId');
    const companyId = searchParams.get('companyId');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    // Construire la query Prisma
    const where: Prisma.DealWhereInput = {};

    // Filtre par texte de recherche
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { contact: { firstName: { contains: search } } },
        { contact: { lastName: { contains: search } } },
        { company: { name: { contains: search } } },
      ];
    }

    // Filtre par étape
    if (stage && ['DECOUVERTE', 'QUALIFICATION', 'PROPOSITION', 'NEGOCIATION', 'GAGNE', 'PERDU'].includes(stage)) {
      where.stage = stage as 'DECOUVERTE' | 'QUALIFICATION' | 'PROPOSITION' | 'NEGOCIATION' | 'GAGNE' | 'PERDU';
    }

    // Filtre par contact
    if (contactId) {
      where.contactId = contactId;
    }

    // Filtre par entreprise
    if (companyId) {
      where.companyId = companyId;
    }

    // Récupérer les deals
    const deals = await prisma.deal.findMany({
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
      orderBy: [
        { expectedCloseDate: 'asc' },
        { createdAt: 'desc' },
      ],
      take: limit,
    });

    // Calculer des stats
    const stats = {
      total: await prisma.deal.count({ where }),
      totalValue: await prisma.deal.aggregate({
        where,
        _sum: { value: true },
      }).then(result => result._sum.value || 0),
      won: await prisma.deal.count({ where: { ...where, stage: 'GAGNE' } }),
      wonValue: await prisma.deal.aggregate({
        where: { ...where, stage: 'GAGNE' },
        _sum: { value: true },
      }).then(result => result._sum.value || 0),
      lost: await prisma.deal.count({ where: { ...where, stage: 'PERDU' } }),
      active: await prisma.deal.count({
        where: {
          ...where,
          stage: {
            in: ['DECOUVERTE', 'QUALIFICATION', 'PROPOSITION', 'NEGOCIATION']
          }
        }
      }),
    };

    return NextResponse.json({
      deals,
      stats,
    });
  } catch (error) {
    console.error('Erreur GET /api/deals:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST /api/deals - Créer un nouveau deal
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Parser et valider le body
    const body = await request.json();
    const validatedData = dealSchema.parse(body);

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

    // Créer le deal
    const deal = await prisma.deal.create({
      data: {
        ...validatedData,
        expectedCloseDate: validatedData.expectedCloseDate ? new Date(validatedData.expectedCloseDate) : null,
        ownerId: session.user.id, // Assigner au user connecté
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

    return NextResponse.json(deal, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /api/deals:', error);

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
