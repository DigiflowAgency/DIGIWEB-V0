import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema de validation pour créer un stage
const createStageSchema = z.object({
  code: z.string().min(1).optional(), // Généré automatiquement si non fourni
  label: z.string().min(1, 'Le label est requis'),
  color: z.string().min(1, 'La couleur est requise'),
  probability: z.number().min(0).max(100).default(50),
  position: z.number().int().positive().optional(),
  isDefault: z.boolean().optional().default(false),
  isWonStage: z.boolean().optional().default(false),
  isLostStage: z.boolean().optional().default(false),
});

// Fonction pour générer un code depuis le label
function generateCodeFromLabel(label: string): string {
  return label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_') // Remplacer caractères spéciaux par _
    .replace(/^_+|_+$/g, ''); // Supprimer _ au début/fin
}

// GET /api/pipeline-stages - Liste tous les stages
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') !== 'false';

    const where = activeOnly ? { isActive: true } : {};

    const stages = await prisma.pipeline_stages.findMany({
      where,
      orderBy: { position: 'asc' },
    });

    return NextResponse.json({ stages });
  } catch (error) {
    console.error('Erreur GET /api/pipeline-stages:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST /api/pipeline-stages - Créer un nouveau stage (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que l'utilisateur est admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Seuls les administrateurs peuvent créer des stages' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createStageSchema.parse(body);

    // Générer le code si non fourni
    let code = validatedData.code;
    if (!code) {
      code = generateCodeFromLabel(validatedData.label);
      // Vérifier l'unicité et ajouter un suffixe si nécessaire
      let suffix = 0;
      let finalCode = code;
      while (await prisma.pipeline_stages.findUnique({ where: { code: finalCode } })) {
        suffix++;
        finalCode = `${code}_${suffix}`;
      }
      code = finalCode;
    } else {
      // Vérifier que le code n'existe pas déjà
      const existing = await prisma.pipeline_stages.findUnique({ where: { code } });
      if (existing) {
        return NextResponse.json(
          { error: 'Ce code existe déjà' },
          { status: 400 }
        );
      }
    }

    // Déterminer la position si non fournie (mettre à la fin)
    let position = validatedData.position;
    if (!position) {
      const lastStage = await prisma.pipeline_stages.findFirst({
        orderBy: { position: 'desc' },
        select: { position: true },
      });
      position = (lastStage?.position || 0) + 1;
    }

    // Si ce stage devient isDefault, retirer le flag des autres
    if (validatedData.isDefault) {
      await prisma.pipeline_stages.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    // Si ce stage devient isWonStage, retirer le flag des autres
    if (validatedData.isWonStage) {
      await prisma.pipeline_stages.updateMany({
        where: { isWonStage: true },
        data: { isWonStage: false },
      });
    }

    // Si ce stage devient isLostStage, retirer le flag des autres
    if (validatedData.isLostStage) {
      await prisma.pipeline_stages.updateMany({
        where: { isLostStage: true },
        data: { isLostStage: false },
      });
    }

    const stage = await prisma.pipeline_stages.create({
      data: {
        code,
        label: validatedData.label,
        color: validatedData.color,
        probability: validatedData.probability,
        position,
        isDefault: validatedData.isDefault,
        isWonStage: validatedData.isWonStage,
        isLostStage: validatedData.isLostStage,
      },
    });

    return NextResponse.json(stage, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /api/pipeline-stages:', error);

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
