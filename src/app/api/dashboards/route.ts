import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/dashboards - Récupérer tous les dashboards
export async function GET() {
  try {
    const dashboards = await prisma.customDashboard.findMany({
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ dashboards });
  } catch (error) {
    console.error('Error fetching dashboards:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des dashboards' },
      { status: 500 }
    );
  }
}

// POST /api/dashboards - Créer un nouveau dashboard
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Le nom est requis' },
        { status: 400 }
      );
    }

    const dashboard = await prisma.customDashboard.create({
      data: {
        name,
        description,
        widgets: 0,
        favorite: false,
      },
    });

    return NextResponse.json(dashboard, { status: 201 });
  } catch (error) {
    console.error('Error creating dashboard:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du dashboard' },
      { status: 500 }
    );
  }
}
