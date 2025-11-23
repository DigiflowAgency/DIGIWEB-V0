import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

// Schema de validation pour update (tous les champs optionnels)
const quoteUpdateSchema = z.object({
  contactId: z.string().optional().nullable(),
  clientName: z.string().min(1).optional(),
  clientEmail: z.string().email().optional(),
  clientAddress: z.string().optional().nullable(),
  subtotal: z.number().positive().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  validityDays: z.number().int().positive().optional(),
  paymentTerms: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(['BROUILLON', 'ENVOYE', 'ACCEPTE', 'REFUSE', 'EXPIRE']).optional(),
  // Calculator fields
  commitmentPeriod: z.string().optional().nullable(),
  isPartner: z.boolean().optional(),
  engagementDiscount: z.number().optional(),
  partnerDiscount: z.number().optional(),
  oneTimeTotal: z.number().optional(),
  monthlyTotal: z.number().optional(),
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

type RouteContext = {
  params: { id: string };
};

// GET /api/quotes/[id] - Récupérer un devis par ID
export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const quote = await prisma.quotes.findUnique({
      where: { id: params.id },
      include: {
        contacts: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            companies: {
              select: {
                id: true,
                name: true,
              },
            },
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
        quote_products: true,
      },
    });

    if (!quote) {
      return NextResponse.json(
        { error: 'Devis non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(quote);
  } catch (error) {
    console.error(`Erreur GET /api/quotes/${params.id}:`, error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PUT /api/quotes/[id] - Mettre à jour un devis
export async function PUT(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que le devis existe
    const existingQuote = await prisma.quotes.findUnique({
      where: { id: params.id },
    });

    if (!existingQuote) {
      return NextResponse.json(
        { error: 'Devis non trouvé' },
        { status: 404 }
      );
    }

    // Parser et valider le body
    const body = await request.json();
    const validatedData = quoteUpdateSchema.parse(body);

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

    // Extraire les products du validatedData pour les gérer séparément
    const { products: productsData, ...quoteDataToUpdate } = validatedData;

    // Préparer les données de mise à jour
    const updateData: Prisma.quotesUpdateInput = { ...quoteDataToUpdate };

    // Recalculer les montants si subtotal ou taxRate change
    if (validatedData.subtotal !== undefined || validatedData.taxRate !== undefined) {
      const subtotal = validatedData.subtotal ?? existingQuote.subtotal;
      const taxRate = validatedData.taxRate ?? existingQuote.taxRate;
      updateData.taxAmount = (subtotal * taxRate) / 100;
      updateData.total = subtotal + updateData.taxAmount;
    }

    // Recalculer la date d'expiration si validityDays change
    if (validatedData.validityDays !== undefined) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + validatedData.validityDays);
      updateData.expiresAt = expiresAt;
    }

    // Gérer les products si fournis
    if (productsData !== undefined) {
      // Supprimer les anciens products
      await prisma.quote_products.deleteMany({
        where: { quoteId: params.id },
      });

      // Ajouter les nouveaux products
      if (productsData.length > 0) {
        updateData.quote_products = {
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
        };
      }
    }

    // Si le statut devient ACCEPTE, on peut créer une facture automatiquement plus tard
    // (logique métier à implémenter si besoin)

    // Mettre à jour le devis
    const updatedQuote = await prisma.quotes.update({
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

    return NextResponse.json(updatedQuote);
  } catch (error) {
    console.error(`Erreur PUT /api/quotes/${params.id}:`, error);

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

// DELETE /api/quotes/[id] - Supprimer un devis
export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que le devis existe
    const existingQuote = await prisma.quotes.findUnique({
      where: { id: params.id },
      include: {
        quote_products: true,
      },
    });

    if (!existingQuote) {
      return NextResponse.json(
        { error: 'Devis non trouvé' },
        { status: 404 }
      );
    }

    // Empêcher la suppression d'un devis accepté
    if (existingQuote.status === 'ACCEPTE') {
      return NextResponse.json(
        { error: 'Impossible de supprimer un devis accepté' },
        { status: 400 }
      );
    }

    // Supprimer d'abord les produits associés
    if (existingQuote.quote_products.length > 0) {
      await prisma.quote_products.deleteMany({
        where: { quoteId: params.id },
      });
    }

    // Supprimer le devis
    await prisma.quotes.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Devis supprimé avec succès' });
  } catch (error) {
    console.error(`Erreur DELETE /api/quotes/${params.id}:`, error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
