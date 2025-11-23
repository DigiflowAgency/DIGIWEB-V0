import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const conversations = await prisma.whatsapp_conversations.findMany({
      include: {
        whatsapp_messages: {
          orderBy: { sentAt: 'asc' },
        },
      },
      orderBy: {
        lastMessageAt: 'desc',
      },
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}
