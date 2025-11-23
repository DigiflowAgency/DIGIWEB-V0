import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

// Schema de validation pour update (tous les champs optionnels)
const invoiceUpdateSchema = z.object({
  clientName: z.string().min(1).optional(),
  clientEmail: z.string().email().optional(),
  clientAddress: z.string().optional().nullable(),
  subtotal: z.number().positive().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  paymentMethod: z.string().optional().nullable(),
  status: z.enum(['BROUILLON', 'ENVOYEE', 'PAYEE', 'EN_ATTENTE', 'EN_RETARD', 'ANNULEE']).optional(),
  dueAt: z.string().datetime().optional(),
  paidAt: z.string().datetime().optional().nullable(),
});

type RouteContext = {
  params: { id: string };
};

// GET /api/invoices/[id] - Récupérer une facture par ID
export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const invoice = await prisma.invoices.findUnique({
      where: { id: params.id },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        invoice_products: true,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: 'Facture non trouvée' },
        { status: 404 }
      );
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error(`Erreur GET /api/invoices/${params.id}:`, error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PUT /api/invoices/[id] - Mettre à jour une facture
export async function PUT(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que la facture existe
    const existingInvoice = await prisma.invoices.findUnique({
      where: { id: params.id },
    });

    if (!existingInvoice) {
      return NextResponse.json(
        { error: 'Facture non trouvée' },
        { status: 404 }
      );
    }

    // Parser et valider le body
    const body = await request.json();
    const validatedData = invoiceUpdateSchema.parse(body);

    // Préparer les données de mise à jour
    const updateData: Prisma.invoicesUpdateInput = { ...validatedData };

    // Recalculer les montants si subtotal ou taxRate change
    if (validatedData.subtotal !== undefined || validatedData.taxRate !== undefined) {
      const subtotal = validatedData.subtotal ?? existingInvoice.subtotal;
      const taxRate = validatedData.taxRate ?? existingInvoice.taxRate;
      updateData.taxAmount = (subtotal * taxRate) / 100;
      updateData.total = subtotal + updateData.taxAmount;
    }

    // Si le statut devient PAYEE, définir paidAt automatiquement
    if (validatedData.status === 'PAYEE' && !existingInvoice.paidAt) {
      updateData.paidAt = validatedData.paidAt ? new Date(validatedData.paidAt) : new Date();
    }

    // Convertir dueAt en Date si fourni
    if (validatedData.dueAt) {
      updateData.dueAt = new Date(validatedData.dueAt);
    }

    // Convertir paidAt en Date si fourni
    if (validatedData.paidAt) {
      updateData.paidAt = new Date(validatedData.paidAt);
    }

    // Mettre à jour la facture
    const updatedInvoice = await prisma.invoices.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json(updatedInvoice);
  } catch (error) {
    console.error(`Erreur PUT /api/invoices/${params.id}:`, error);

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

// DELETE /api/invoices/[id] - Supprimer une facture
export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que la facture existe
    const existingInvoice = await prisma.invoices.findUnique({
      where: { id: params.id },
      include: {
        invoice_products: true,
      },
    });

    if (!existingInvoice) {
      return NextResponse.json(
        { error: 'Facture non trouvée' },
        { status: 404 }
      );
    }

    // Empêcher la suppression d'une facture payée
    if (existingInvoice.status === 'PAYEE') {
      return NextResponse.json(
        { error: 'Impossible de supprimer une facture payée' },
        { status: 400 }
      );
    }

    // Supprimer d'abord les produits associés
    if (existingInvoice.invoice_products.length > 0) {
      await prisma.invoice_products.deleteMany({
        where: { invoiceId: params.id },
      });
    }

    // Supprimer la facture
    await prisma.invoices.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Facture supprimée avec succès' });
  } catch (error) {
    console.error(`Erreur DELETE /api/invoices/${params.id}:`, error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
