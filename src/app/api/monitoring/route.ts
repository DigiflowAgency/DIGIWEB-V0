import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const monitoring = await prisma.client_monitoring.findMany({
      include: {
        clients: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json({ monitoring });
  } catch (error) {
    console.error('Error fetching monitoring data:', error);
    return NextResponse.json({ error: 'Failed to fetch monitoring data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, domain, uptime, cpu, memory, ssl, lastBackup, nps, status } = body;

    const monitoring = await prisma.client_monitoring.create({
      data: {
        clientId,
        domain,
        uptime,
        cpu,
        memory,
        ssl,
        lastBackup,
        nps,
        status,
      } as any,
      include: {
        clients: true,
      },
    });

    return NextResponse.json(monitoring, { status: 201 });
  } catch (error) {
    console.error('Error creating monitoring:', error);
    return NextResponse.json({ error: 'Failed to create monitoring' }, { status: 500 });
  }
}
