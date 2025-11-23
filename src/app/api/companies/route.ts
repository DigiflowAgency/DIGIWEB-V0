import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

// Schema de validation Zod pour Company
const companySchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  siret: z.string().optional().nullable(),
  legalForm: z.string().optional().nullable(),
  gerant: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  employees: z.number().int().positive().optional().nullable(),
  revenue: z.number().positive().optional().nullable(),
  solvencyScore: z.number().int().min(0).max(100).optional().nullable(),
  status: z.enum(['LEAD', 'PROSPECT', 'CLIENT']).default('PROSPECT'),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  country: z.string().default('France'),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  website: z.string().url().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
});

// GET /api/companies - Liste toutes les entreprises
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
    const industry = searchParams.get('industry');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    // Construire la query Prisma
    const where: Prisma.companiesWhereInput = {};

    // Filtre par texte de recherche
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { siret: { contains: search } },
        { city: { contains: search } },
        { industry: { contains: search } },
      ];
    }

    // Filtre par statut
    if (status && ['LEAD', 'PROSPECT', 'CLIENT'].includes(status)) {
      where.status = status as 'LEAD' | 'PROSPECT' | 'CLIENT';
    }

    // Filtre par secteur
    if (industry) {
      where.industry = industry;
    }

    // Récupérer les entreprises
    const companies = await prisma.companies.findMany({
      where,
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
      orderBy: [
        { solvencyScore: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
    });

    // Calculer des stats
    const stats = {
      total: await prisma.companies.count({ where }),
      clients: await prisma.companies.count({ where: { ...where, status: 'CLIENT' } }),
      prospects: await prisma.companies.count({ where: { ...where, status: 'PROSPECT' } }),
      leads: await prisma.companies.count({ where: { ...where, status: 'LEAD' } }),
    };

    return NextResponse.json({
      companies,
      stats,
    });
  } catch (error) {
    console.error('Erreur GET /api/companies:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST /api/companies - Créer une nouvelle entreprise
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Parser et valider le body
    const body = await request.json();
    const validatedData = companySchema.parse(body);

    // Vérifier si le SIRET existe déjà (s'il est fourni)
    if (validatedData.siret) {
      const existingCompany = await prisma.companies.findFirst({
        where: { siret: validatedData.siret },
      });

      if (existingCompany) {
        return NextResponse.json(
          { error: 'Une entreprise avec ce SIRET existe déjà' },
          { status: 400 }
        );
      }
    }

    // Créer l'entreprise
    const company = await prisma.companies.create({
      data: validatedData as any,
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
      },
    });

    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /api/companies:', error);

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
