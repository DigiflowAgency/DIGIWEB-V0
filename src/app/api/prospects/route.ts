import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/prospects - Liste des prospects
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const assignedToId = searchParams.get('assignedToId');
    const importBatchId = searchParams.get('importBatchId');

    // Filtrer selon le rôle
    const where: any = {};

    if (session.user.role !== 'ADMIN') {
      // Les commerciaux ne voient que leurs prospects
      where.assignedToId = session.user.id;
    } else {
      // Les admins peuvent filtrer par commercial
      if (assignedToId) {
        where.assignedToId = assignedToId;
      }
    }

    if (status) {
      where.status = status;
    }

    if (importBatchId) {
      where.importBatchId = importBatchId;
    }

    const prospects = await prisma.prospects.findMany({
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
        import_batches: {
          select: {
            id: true,
            fileName: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ prospects });
  } catch (error) {
    console.error('Erreur GET /api/prospects:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST /api/prospects - Créer un prospect manuellement
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();

    const prospect = await prisma.prospects.create({
      data: {
        id: `PROS-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: body.name,
        siret: body.siret || null,
        activity: body.activity,
        address: body.address || '',
        city: body.city || '',
        postalCode: body.postalCode || null,
        phone: body.phone || null,
        email: body.email || null,
        website: body.website || null,
        assignedToId: body.assignedToId || session.user.id,
        source: 'manual',
        status: 'A_TRAITER',
      } as any,
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({ prospect });
  } catch (error) {
    console.error('Erreur POST /api/prospects:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
