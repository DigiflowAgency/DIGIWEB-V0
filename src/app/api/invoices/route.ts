import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

// Schema de validation Zod pour Invoice
const invoiceSchema = z.object({
  clientName: z.string().min(1, 'Le nom du client est requis'),
  clientEmail: z.string().email('Email invalide'),
  clientAddress: z.string().optional().nullable(),
  subtotal: z.number().positive('Le sous-total doit être positif'),
  taxRate: z.number().min(0).max(100).default(20),
  paymentMethod: z.string().optional().nullable(),
  dueAt: z.string().datetime().optional(),
});

// Fonction pour générer un numéro de facture unique
async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.invoices.count({
    where: {
      number: {
        startsWith: `FA-${year}-`,
      },
    },
  });
  const nextNumber = (count + 1).toString().padStart(3, '0');
  return `FA-${year}-${nextNumber}`;
}

// GET /api/invoices - Liste toutes les factures
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
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    // Construire la query Prisma
    const where: Prisma.invoicesWhereInput = {};

    // Filtre par texte de recherche
    if (search) {
      where.OR = [
        { number: { contains: search } },
        { clientName: { contains: search } },
        { clientEmail: { contains: search } },
      ];
    }

    // Filtre par statut
    if (status && ['BROUILLON', 'ENVOYEE', 'PAYEE', 'EN_ATTENTE', 'EN_RETARD', 'ANNULEE'].includes(status)) {
      where.status = status as 'BROUILLON' | 'EN_ATTENTE' | 'PAYEE' | 'EN_RETARD' | 'ANNULEE';
    }

    // Récupérer les factures
    const invoices = await prisma.invoices.findMany({
      where,
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        invoice_products: true,
      },
      orderBy: [
        { createdAt: 'desc' },
      ],
      take: limit,
    });

    // Calculer des stats
    const stats = {
      total: await prisma.invoices.count({ where }),
      brouillon: await prisma.invoices.count({ where: { ...where, status: 'BROUILLON' } }),
      envoye: await prisma.invoices.count({ where: { ...where, status: 'EN_ATTENTE' } }),
      paye: await prisma.invoices.count({ where: { ...where, status: 'PAYEE' } }),
      enRetard: await prisma.invoices.count({ where: { ...where, status: 'EN_RETARD' } }),
      totalValue: await prisma.invoices.aggregate({
        where,
        _sum: { total: true },
      }).then(result => result._sum.total || 0),
      totalPaid: await prisma.invoices.aggregate({
        where: { ...where, status: 'PAYEE' },
        _sum: { total: true },
      }).then(result => result._sum.total || 0),
      totalUnpaid: await prisma.invoices.aggregate({
        where: { ...where, status: { in: ['EN_ATTENTE', 'EN_RETARD', 'ENVOYEE'] } },
        _sum: { total: true },
      }).then(result => result._sum.total || 0),
    };

    return NextResponse.json({
      invoices,
      stats,
    });
  } catch (error) {
    console.error('Erreur GET /api/invoices:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST /api/invoices - Créer une nouvelle facture
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Parser et valider le body
    const body = await request.json();
    const validatedData = invoiceSchema.parse(body);

    // Générer le numéro de facture
    const invoiceNumber = await generateInvoiceNumber();

    // Calculer les montants
    const taxAmount = (validatedData.subtotal * validatedData.taxRate) / 100;
    const total = validatedData.subtotal + taxAmount;

    // Date d'émission et d'échéance
    const issuedAt = new Date();
    const dueAt = validatedData.dueAt
      ? new Date(validatedData.dueAt)
      : new Date(issuedAt.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 jours par défaut

    // Créer la facture
    const invoice = await prisma.invoices.create({
      data: {
        number: invoiceNumber,
        clientName: validatedData.clientName,
        clientEmail: validatedData.clientEmail,
        clientAddress: validatedData.clientAddress,
        subtotal: validatedData.subtotal,
        taxRate: validatedData.taxRate,
        taxAmount,
        total,
        issuedAt,
        dueAt,
        paymentMethod: validatedData.paymentMethod,
        ownerId: session.user.id,
      } as any,
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        invoice_products: true,
      },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /api/invoices:', error);

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
