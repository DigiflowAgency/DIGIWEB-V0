import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/sequences - Récupérer toutes les séquences
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    const sequences = await prisma.sequence.findMany({
      where: {
        ...(search && {
          name: {
            contains: search,
          },
        }),
        ...(status && {
          status: status as 'ACTIVE' | 'PAUSE' | 'ARCHIVED',
        }),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculer les statistiques
    const totalEnrolled = sequences.reduce((sum, s) => sum + s.enrolled, 0);
    const totalCompleted = sequences.reduce((sum, s) => sum + s.completed, 0);
    const avgOpenRate = sequences.length > 0
      ? sequences.reduce((sum, s) => sum + (s.openRate || 0), 0) / sequences.length
      : 0;
    const avgReplyRate = sequences.length > 0
      ? sequences.reduce((sum, s) => sum + (s.replyRate || 0), 0) / sequences.length
      : 0;

    const stats = {
      total: sequences.length,
      active: sequences.filter((s) => s.status === 'ACTIVE').length,
      pause: sequences.filter((s) => s.status === 'PAUSE').length,
      archived: sequences.filter((s) => s.status === 'ARCHIVED').length,
      totalEnrolled,
      totalCompleted,
      avgOpenRate: Math.round(avgOpenRate),
      avgReplyRate: Math.round(avgReplyRate),
    };

    return NextResponse.json({ sequences, stats });
  } catch (error) {
    console.error('Error fetching sequences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sequences' },
      { status: 500 }
    );
  }
}

// POST /api/sequences - Créer une nouvelle séquence
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const sequence = await prisma.sequence.create({
      data: {
        name: data.name,
        description: data.description,
        emailsCount: data.emailsCount || 0,
        config: JSON.stringify(data.config || {}),
        status: data.status || 'ACTIVE',
      },
    });

    return NextResponse.json(sequence, { status: 201 });
  } catch (error) {
    console.error('Error creating sequence:', error);
    return NextResponse.json(
      { error: 'Failed to create sequence' },
      { status: 500 }
    );
  }
}
