import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const dashboards = await prisma.customDashboard.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    return NextResponse.json({ dashboards });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboards' }, { status: 500 });
  }
}
