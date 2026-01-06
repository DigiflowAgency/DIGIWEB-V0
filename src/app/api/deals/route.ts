import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { notifyEvent } from '@/lib/notifications';

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

// Schema de validation Zod pour Deal
const dealSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  description: z.string().optional().nullable(),
  value: z.number().positive('Le montant doit être positif'),
  currency: z.string().default('EUR'),
  stage: z.enum(['A_CONTACTER', 'EN_DISCUSSION', 'A_RELANCER', 'RDV_PRIS', 'NEGO_HOT', 'CLOSING']).default('A_CONTACTER'),
  productionStage: z.enum(['PREMIER_RDV', 'EN_PRODUCTION', 'LIVRE', 'ENCAISSE']).optional().nullable(),
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

    // Nouveaux paramètres de tri et filtre par montant
    const minValue = searchParams.get('minValue') ? parseFloat(searchParams.get('minValue')!) : undefined;
    const maxValue = searchParams.get('maxValue') ? parseFloat(searchParams.get('maxValue')!) : undefined;
    const sortBy = searchParams.get('sortBy') as 'value' | 'createdAt' | 'updatedAt' | 'expectedCloseDate' | null;
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';

    // Construire la query Prisma
    const where: Prisma.dealsWhereInput = {};

    // Filtre par texte de recherche (recherche étendue)
    if (search) {
      where.OR = [
        // Deal fields
        { title: { contains: search } },
        { description: { contains: search } },
        { product: { contains: search } },
        { comments: { contains: search } },
        { origin: { contains: search } },

        // Contact fields
        { contacts: { firstName: { contains: search } } },
        { contacts: { lastName: { contains: search } } },
        { contacts: { email: { contains: search } } },
        { contacts: { phone: { contains: search } } },
        { contacts: { city: { contains: search } } },
        { contacts: { position: { contains: search } } },

        // Company fields
        { companies: { name: { contains: search } } },
        { companies: { city: { contains: search } } },
        { companies: { siret: { contains: search } } },
        { companies: { website: { contains: search } } },
        { companies: { phone: { contains: search } } },
        { companies: { email: { contains: search } } },
      ];
    }

    // Filtre par étape
    if (stage && ['A_CONTACTER', 'EN_DISCUSSION', 'A_RELANCER', 'RDV_PRIS', 'NEGO_HOT', 'CLOSING'].includes(stage)) {
      where.stage = stage as 'A_CONTACTER' | 'EN_DISCUSSION' | 'A_RELANCER' | 'RDV_PRIS' | 'NEGO_HOT' | 'CLOSING';
    }

    // Filtre par contact
    if (contactId) {
      where.contactId = contactId;
    }

    // Filtre par entreprise
    if (companyId) {
      where.companyId = companyId;
    }

    // Filtre optionnel par utilisateur(s) (tout le monde voit tous les deals par défaut)
    const ownerIdsParam = searchParams.get('ownerIds'); // Multi-select (ex: "id1,id2,id3")
    const ownerIdFilter = searchParams.get('ownerId'); // Single select (rétrocompat)

    // Si plusieurs ownerIds sont demandés (nouveau format multi-select)
    // On cherche dans le responsable principal OU dans l'équipe assignée
    if (ownerIdsParam) {
      const ownerIds = ownerIdsParam.split(',').filter(id => id.trim());
      if (ownerIds.length > 0) {
        where.OR = [
          { ownerId: { in: ownerIds } },
          { deal_assignees: { some: { userId: { in: ownerIds } } } }
        ];
      }
    }
    // Sinon, si un seul ownerId est demandé (ancien format)
    else if (ownerIdFilter) {
      where.OR = [
        { ownerId: ownerIdFilter },
        { deal_assignees: { some: { userId: ownerIdFilter } } }
      ];
    }
    // Sinon, pas de filtre - tout le monde voit tous les deals

    // Filtre par plage de montant
    if (minValue !== undefined || maxValue !== undefined) {
      where.value = {};
      if (minValue !== undefined) {
        where.value.gte = minValue;
      }
      if (maxValue !== undefined) {
        where.value.lte = maxValue;
      }
    }

    // Construire le tri dynamique
    const orderBy: Prisma.dealsOrderByWithRelationInput[] = sortBy
      ? [{ [sortBy]: sortOrder }]
      : [{ expectedCloseDate: 'asc' }, { createdAt: 'desc' }];

    // Récupérer les deals
    const deals = await prisma.deals.findMany({
      where,
      include: {
        contacts: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
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
      orderBy,
      take: limit,
    });

    // Calculer des stats
    const stats = {
      total: await prisma.deals.count({ where }),
      totalValue: await prisma.deals.aggregate({
        where,
        _sum: { value: true },
      }).then(result => result._sum.value || 0),
      won: await prisma.deals.count({ where: { ...where, stage: 'CLOSING' } }),
      wonValue: await prisma.deals.aggregate({
        where: { ...where, stage: 'CLOSING' },
        _sum: { value: true },
      }).then(result => result._sum.value || 0),
      lost: 0, // Stage REFUSE n'existe plus
      active: await prisma.deals.count({
        where: {
          ...where,
          stage: {
            in: ['A_CONTACTER', 'EN_DISCUSSION', 'A_RELANCER', 'RDV_PRIS', 'NEGO_HOT']
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

    // Calculer automatiquement la probabilité selon le stage
    if (!body.probability) {
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

    // Créer le deal
    const deal = await prisma.deals.create({
      data: {
        ...validatedData,
        expectedCloseDate: validatedData.expectedCloseDate ? new Date(validatedData.expectedCloseDate) : null,
        ownerId: session.user.id, // Assigner au user connecté
      } as any,
      include: {
        contacts: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
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
      },
    });

    // Notification: Deal créé (non-bloquant)
    notifyEvent('DEAL_CREATED', {
      actorId: session.user.id,
      actorName: session.user.name || session.user.email,
      entityId: deal.id,
      entityName: deal.title,
    }, [deal.ownerId]);

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
