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
    'NRP': 5,
    'RDV_PRIS': 50,
    'NEGO_HOT': 70,
    'CLOSING': 90,
    'REFUSE': 0,
  };
  return probabilityMap[stage] || 50;
}

// Fonction de normalisation des numéros de téléphone
function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-\.\(\)\+]/g, '');
}

// Détecter si la recherche ressemble à un numéro de téléphone
function isPhoneSearch(search: string): boolean {
  return /^[\d\s\-\.\(\)\+]+$/.test(search) && search.replace(/\D/g, '').length >= 3;
}

// Schema de validation Zod pour Deal
const dealSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  description: z.string().optional().nullable(),
  value: z.number().positive('Le montant doit être positif'),
  currency: z.string().default('EUR'),
  stage: z.enum(['A_CONTACTER', 'EN_DISCUSSION', 'A_RELANCER', 'NRP', 'RDV_PRIS', 'NEGO_HOT', 'CLOSING']).default('A_CONTACTER'),
  productionStage: z.enum(['PREMIER_RDV', 'EN_PRODUCTION', 'LIVRE', 'ENCAISSE']).optional().nullable(),
  probability: z.number().int().min(0).max(100).default(50),
  expectedCloseDate: z.string().datetime().optional().nullable(),
  contactId: z.string().optional().nullable(),
  companyId: z.string().optional().nullable(),
  comments: z.string().optional().nullable(),
  isManual: z.boolean().default(false),
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
      const searchTerm = search.trim();

      // Construire la liste des conditions OR (MySQL est insensible à la casse par défaut)
      where.OR = [
        // Deal fields
        { title: { contains: searchTerm } },
        { description: { contains: searchTerm } },
        { product: { contains: searchTerm } },
        { comments: { contains: searchTerm } },
        { origin: { contains: searchTerm } },

        // Contact fields
        { contacts: { firstName: { contains: searchTerm } } },
        { contacts: { lastName: { contains: searchTerm } } },
        { contacts: { email: { contains: searchTerm } } },
        { contacts: { phone: { contains: searchTerm } } },
        { contacts: { city: { contains: searchTerm } } },
        { contacts: { position: { contains: searchTerm } } },

        // Company fields
        { companies: { name: { contains: searchTerm } } },
        { companies: { city: { contains: searchTerm } } },
        { companies: { siret: { contains: searchTerm } } },
        { companies: { website: { contains: searchTerm } } },
        { companies: { phone: { contains: searchTerm } } },
        { companies: { email: { contains: searchTerm } } },
      ];

      // Si ça ressemble à un numéro de téléphone, ajouter aussi la recherche normalisée
      if (isPhoneSearch(searchTerm)) {
        const normalizedSearch = normalizePhone(searchTerm);

        // Trouver les IDs des contacts dont le téléphone normalisé contient la recherche
        const contactIds = await prisma.$queryRaw<{ id: string }[]>`
          SELECT id FROM contacts
          WHERE REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '.', ''), '(', ''), ')', '')
          LIKE CONCAT('%', ${normalizedSearch}, '%')
        `;

        // Trouver les IDs des companies dont le téléphone normalisé contient la recherche
        const companyIds = await prisma.$queryRaw<{ id: string }[]>`
          SELECT id FROM companies
          WHERE REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '.', ''), '(', ''), ')', '')
          LIKE CONCAT('%', ${normalizedSearch}, '%')
        `;

        const contactIdList = contactIds.map(c => c.id);
        const companyIdList = companyIds.map(c => c.id);

        // Ajouter les résultats de la recherche normalisée aux conditions OR
        if (contactIdList.length > 0) {
          where.OR.push({ contactId: { in: contactIdList } });
        }
        if (companyIdList.length > 0) {
          where.OR.push({ companyId: { in: companyIdList } });
        }
      }
    }

    // Filtre par étape
    if (stage && ['A_CONTACTER', 'EN_DISCUSSION', 'A_RELANCER', 'NRP', 'RDV_PRIS', 'NEGO_HOT', 'CLOSING'].includes(stage)) {
      where.stage = stage as 'A_CONTACTER' | 'EN_DISCUSSION' | 'A_RELANCER' | 'NRP' | 'RDV_PRIS' | 'NEGO_HOT' | 'CLOSING';
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
        // Combiner avec les conditions de recherche existantes
        const ownerConditions = [
          { ownerId: { in: ownerIds } },
          { deal_assignees: { some: { userId: { in: ownerIds } } } }
        ];
        if (where.OR && where.OR.length > 0) {
          // Si on a déjà des conditions OR (recherche), les combiner avec AND
          where.AND = [
            { OR: where.OR },
            { OR: ownerConditions }
          ];
          delete where.OR;
        } else {
          where.OR = ownerConditions;
        }
      }
    }
    // Sinon, si un seul ownerId est demandé (ancien format)
    else if (ownerIdFilter) {
      const ownerConditions = [
        { ownerId: ownerIdFilter },
        { deal_assignees: { some: { userId: ownerIdFilter } } }
      ];
      if (where.OR && where.OR.length > 0) {
        where.AND = [
          { OR: where.OR },
          { OR: ownerConditions }
        ];
        delete where.OR;
      } else {
        where.OR = ownerConditions;
      }
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
            city: true,
            position: true,
          },
        },
        companies: {
          select: {
            id: true,
            name: true,
            city: true,
            siret: true,
            website: true,
            phone: true,
            email: true,
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
        deal_service_assignments: {
          select: {
            id: true,
            serviceId: true,
            stageId: true,
            createdAt: true,
            service: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
            stage: {
              select: {
                id: true,
                name: true,
                color: true,
                position: true,
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
            in: ['A_CONTACTER', 'EN_DISCUSSION', 'A_RELANCER', 'NRP', 'RDV_PRIS', 'NEGO_HOT']
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
            city: true,
            position: true,
          },
        },
        companies: {
          select: {
            id: true,
            name: true,
            city: true,
            siret: true,
            website: true,
            phone: true,
            email: true,
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
