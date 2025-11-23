import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

// Schema de validation Zod pour Quote
const quoteSchema = z.object({
  contactId: z.string().optional().nullable(),
  clientName: z.string().min(1, 'Le nom du client est requis'),
  clientEmail: z.string().email('Email invalide'),
  clientAddress: z.string().optional().nullable(),
  subtotal: z.number().positive('Le sous-total doit être positif'),
  taxRate: z.number().min(0).max(100).default(20),
  validityDays: z.number().int().positive().default(30),
  paymentTerms: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  // Calculator fields
  commitmentPeriod: z.string().optional().nullable(),
  isPartner: z.boolean().optional().default(false),
  engagementDiscount: z.number().optional().default(0),
  partnerDiscount: z.number().optional().default(0),
  oneTimeTotal: z.number().optional().default(0),
  monthlyTotal: z.number().optional().default(0),
  products: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    quantity: z.number().int().positive().default(1),
    unitPrice: z.number(),
    totalPrice: z.number(),
    serviceId: z.string().optional(),
    serviceType: z.string().optional(),
    period: z.string().optional(),
    channel: z.string().optional(),
    discount: z.number().optional().default(0),
  })).optional(),
});

// Fonction pour générer un numéro de devis unique
async function generateQuoteNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.quotes.count({
    where: {
      number: {
        startsWith: `QU-${year}-`,
      },
    },
  });
  const nextNumber = (count + 1).toString().padStart(3, '0');
  return `QU-${year}-${nextNumber}`;
}

// GET /api/quotes - Liste tous les devis
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
    const status = searchParams.get('status');
    const contactId = searchParams.get('contactId');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    // Construire la query Prisma
    const where: Prisma.quotesWhereInput = {};

    // Filtre par texte de recherche
    if (search) {
      where.OR = [
        { number: { contains: search } },
        { clientName: { contains: search } },
        { clientEmail: { contains: search } },
      ];
    }

    // Filtre par statut
    if (status && ['BROUILLON', 'ENVOYE', 'ACCEPTE', 'REFUSE', 'EXPIRE'].includes(status)) {
      where.status = status as 'BROUILLON' | 'ENVOYE' | 'ACCEPTE' | 'REFUSE' | 'EXPIRE';
    }

    // Filtre par contact
    if (contactId) {
      where.contactId = contactId;
    }

    // Récupérer les devis
    const quotes = await prisma.quotes.findMany({
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
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        quote_products: true,
      },
      orderBy: [
        { createdAt: 'desc' },
      ],
      take: limit,
    });

    // Calculer des stats
    const stats = {
      total: await prisma.quotes.count({ where }),
      brouillon: await prisma.quotes.count({ where: { ...where, status: 'BROUILLON' } }),
      envoye: await prisma.quotes.count({ where: { ...where, status: 'ENVOYE' } }),
      accepte: await prisma.quotes.count({ where: { ...where, status: 'ACCEPTE' } }),
      totalValue: await prisma.quotes.aggregate({
        where,
        _sum: { total: true },
      }).then(result => result._sum.total || 0),
    };

    return NextResponse.json({
      quotes,
      stats,
    });
  } catch (error) {
    console.error('Erreur GET /api/quotes:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST /api/quotes - Créer un nouveau devis
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Parser et valider le body
    const body = await request.json();
    const validatedData = quoteSchema.parse(body);

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

    // Générer le numéro de devis
    const quoteNumber = await generateQuoteNumber();

    // Calculer les montants
    const taxAmount = (validatedData.subtotal * validatedData.taxRate) / 100;
    const total = validatedData.subtotal + taxAmount;

    // Calculer la date d'expiration
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + validatedData.validityDays);

    // Extraire les products du validatedData pour les gérer séparément
    const { products: productsData, ...quoteData } = validatedData;

    // Créer le devis avec les products associés
    const quote = await prisma.quotes.create({
      data: {
        number: quoteNumber,
        ...quoteData,
        taxAmount,
        total,
        expiresAt,
        ownerId: session.user.id,
        // Créer les products si fournis
        ...(productsData && productsData.length > 0 && {
          quote_products: {
            create: productsData.map((product) => ({
              id: `QP-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              name: product.name,
              description: product.description || null,
              quantity: product.quantity,
              unitPrice: product.unitPrice,
              totalPrice: product.totalPrice,
              serviceId: product.serviceId || null,
              serviceType: product.serviceType || null,
              period: product.period || null,
              channel: product.channel || null,
              discount: product.discount || 0,
            })),
          },
        }),
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
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        quote_products: true,
      },
    });

    return NextResponse.json(quote, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /api/quotes:', error);

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
