import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/prospects - Récupérer tous les prospects ou rechercher
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const activity = searchParams.get('activity');
    const city = searchParams.get('city');
    const imported = searchParams.get('imported');

    const prospects = await prisma.prospect.findMany({
      where: {
        ...(activity && {
          activity: {
            contains: activity,
          },
        }),
        ...(city && {
          city: {
            contains: city,
          },
        }),
        ...(imported !== null && {
          imported: imported === 'true',
        }),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculer les statistiques
    const stats = {
      total: prospects.length,
      imported: prospects.filter((p) => p.imported).length,
      notImported: prospects.filter((p) => !p.imported).length,
      avgRating: prospects.length > 0
        ? prospects.reduce((sum, p) => sum + (p.rating || 0), 0) / prospects.length
        : 0,
    };

    return NextResponse.json({ prospects, stats });
  } catch (error) {
    console.error('Error fetching prospects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prospects' },
      { status: 500 }
    );
  }
}

// POST /api/prospects - Créer un nouveau prospect (ou rechercher via API externe)
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const prospect = await prisma.prospect.create({
      data: {
        name: data.name,
        activity: data.activity,
        address: data.address,
        city: data.city,
        phone: data.phone,
        email: data.email,
        website: data.website,
        employees: data.employees,
        rating: data.rating,
      },
    });

    return NextResponse.json(prospect, { status: 201 });
  } catch (error) {
    console.error('Error creating prospect:', error);
    return NextResponse.json(
      { error: 'Failed to create prospect' },
      { status: 500 }
    );
  }
}
