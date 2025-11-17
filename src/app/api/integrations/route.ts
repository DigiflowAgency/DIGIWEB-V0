import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const integrations = await prisma.integration.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      integrations,
    });
  } catch (error) {
    console.error('Error fetching integrations:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, status, config } = body;

    const integration = await prisma.integration.create({
      data: {
        name,
        status: status || 'DISCONNECTED',
        config: JSON.stringify(config || {}),
      },
    });

    return NextResponse.json(integration);
  } catch (error) {
    console.error('Error creating integration:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
