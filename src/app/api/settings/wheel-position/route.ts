import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const WHEEL_POSITION_KEY = 'wheel_last_user_index';

// GET: Recuperer la position actuelle de la roue
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const setting = await prisma.app_settings.findUnique({
      where: { key: WHEEL_POSITION_KEY },
    });

    return NextResponse.json({
      position: parseInt(setting?.value || '0', 10),
    });
  } catch (error) {
    console.error('Erreur GET /api/settings/wheel-position:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST: Sauvegarder la nouvelle position apres attribution
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const body = await request.json();
    const position = parseInt(body.position, 10);

    if (isNaN(position) || position < 0) {
      return NextResponse.json(
        { error: 'Position invalide' },
        { status: 400 }
      );
    }

    await prisma.app_settings.upsert({
      where: { key: WHEEL_POSITION_KEY },
      update: { value: String(position) },
      create: { key: WHEEL_POSITION_KEY, value: String(position) },
    });

    return NextResponse.json({ success: true, position });
  } catch (error) {
    console.error('Erreur POST /api/settings/wheel-position:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
