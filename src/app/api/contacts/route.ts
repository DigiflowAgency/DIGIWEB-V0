import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema de validation Zod pour Contact
const contactSchema = z.object({
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().min(1, 'Le nom est requis'),
  email: z.string().email('Email invalide').optional().nullable(),
  phone: z.string().optional().nullable(),
  position: z.string().optional().nullable(),
  companyId: z.string().optional().nullable(),
  siret: z.string().optional().nullable(),
  gerant: z.string().optional().nullable(),
  status: z.enum(['LEAD', 'PROSPECT', 'CLIENT']).default('LEAD'),
  qualityScore: z.number().int().min(0).max(100).optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  country: z.string().default('France'),
  source: z.string().optional().nullable(),
});

// GET /api/contacts - Liste tous les contacts
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
    const where: any = {};

    // Filtre par texte de recherche
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Filtre par statut
    if (status && ['LEAD', 'PROSPECT', 'CLIENT'].includes(status)) {
      where.status = status;
    }

    // Récupérer les contacts
    const contacts = await prisma.contact.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            siret: true,
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
      orderBy: [
        { qualityScore: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
    });

    // Calculer des stats
    const stats = {
      total: await prisma.contact.count({ where }),
      active: await prisma.contact.count({ where: { ...where, status: { in: ['PROSPECT', 'CLIENT'] } } }),
      leads: await prisma.contact.count({ where: { ...where, status: 'LEAD' } }),
    };

    return NextResponse.json({
      contacts,
      stats,
    });
  } catch (error) {
    console.error('Erreur GET /api/contacts:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST /api/contacts - Créer un nouveau contact
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Parser et valider le body
    const body = await request.json();
    const validatedData = contactSchema.parse(body);

    // Vérifier si l'email existe déjà
    if (validatedData.email) {
      const existingContact = await prisma.contact.findFirst({
        where: { email: validatedData.email },
      });

      if (existingContact) {
        return NextResponse.json(
          { error: 'Un contact avec cet email existe déjà' },
          { status: 400 }
        );
      }
    }

    // Créer le contact
    const contact = await prisma.contact.create({
      data: {
        ...validatedData,
        assignedToId: session.user.id, // Assigner au user connecté
      },
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

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /api/contacts:', error);

    // Erreur de validation Zod
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
