import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema de validation pour update
const updateStageSchema = z.object({
  label: z.string().min(1).optional(),
  color: z.string().min(1).optional(),
  probability: z.number().min(0).max(100).optional(),
  position: z.number().int().positive().optional(),
  isDefault: z.boolean().optional(),
  isWonStage: z.boolean().optional(),
  isLostStage: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

type RouteContext = {
  params: { id: string };
};

// GET /api/pipeline-stages/[id] - Récupérer un stage
export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const stage = await prisma.pipeline_stages.findUnique({
      where: { id: params.id },
    });

    if (!stage) {
      return NextResponse.json(
        { error: 'Stage non trouvé' },
        { status: 404 }
      );
    }

    // Compter les deals qui utilisent ce stage
    const dealsCount = await prisma.deals.count({
      where: { stage: stage.code },
    });

    return NextResponse.json({ ...stage, dealsCount });
  } catch (error) {
    console.error(`Erreur GET /api/pipeline-stages/${params.id}:`, error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PUT /api/pipeline-stages/[id] - Modifier un stage
export async function PUT(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que l'utilisateur est admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Seuls les administrateurs peuvent modifier des stages' },
        { status: 403 }
      );
    }

    // Vérifier que le stage existe
    const existingStage = await prisma.pipeline_stages.findUnique({
      where: { id: params.id },
    });

    if (!existingStage) {
      return NextResponse.json(
        { error: 'Stage non trouvé' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = updateStageSchema.parse(body);

    // Si ce stage devient isDefault, retirer le flag des autres
    if (validatedData.isDefault === true) {
      await prisma.pipeline_stages.updateMany({
        where: { isDefault: true, id: { not: params.id } },
        data: { isDefault: false },
      });
    }

    // Si ce stage devient isWonStage, retirer le flag des autres
    if (validatedData.isWonStage === true) {
      await prisma.pipeline_stages.updateMany({
        where: { isWonStage: true, id: { not: params.id } },
        data: { isWonStage: false },
      });
    }

    // Si ce stage devient isLostStage, retirer le flag des autres
    if (validatedData.isLostStage === true) {
      await prisma.pipeline_stages.updateMany({
        where: { isLostStage: true, id: { not: params.id } },
        data: { isLostStage: false },
      });
    }

    const stage = await prisma.pipeline_stages.update({
      where: { id: params.id },
      data: validatedData,
    });

    return NextResponse.json(stage);
  } catch (error) {
    console.error(`Erreur PUT /api/pipeline-stages/${params.id}:`, error);

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

// DELETE /api/pipeline-stages/[id] - Supprimer un stage
export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que l'utilisateur est admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Seuls les administrateurs peuvent supprimer des stages' },
        { status: 403 }
      );
    }

    // Vérifier que le stage existe
    const existingStage = await prisma.pipeline_stages.findUnique({
      where: { id: params.id },
    });

    if (!existingStage) {
      return NextResponse.json(
        { error: 'Stage non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier s'il y a des deals qui utilisent ce stage
    const dealsCount = await prisma.deals.count({
      where: { stage: existingStage.code },
    });

    if (dealsCount > 0) {
      // Vérifier si un stage de migration est fourni
      const { searchParams } = new URL(request.url);
      const migrateToStageId = searchParams.get('migrateToStageId');

      if (!migrateToStageId) {
        return NextResponse.json(
          {
            error: 'Ce stage contient des deals',
            dealsCount,
            message: 'Fournissez migrateToStageId pour migrer les deals vers un autre stage'
          },
          { status: 400 }
        );
      }

      // Vérifier que le stage de migration existe
      const migrateToStage = await prisma.pipeline_stages.findUnique({
        where: { id: migrateToStageId },
      });

      if (!migrateToStage) {
        return NextResponse.json(
          { error: 'Stage de migration non trouvé' },
          { status: 400 }
        );
      }

      // Migrer les deals
      await prisma.deals.updateMany({
        where: { stage: existingStage.code },
        data: { stage: migrateToStage.code },
      });
    }

    // Empêcher la suppression du dernier stage actif
    const activeStagesCount = await prisma.pipeline_stages.count({
      where: { isActive: true },
    });

    if (activeStagesCount <= 1 && existingStage.isActive) {
      return NextResponse.json(
        { error: 'Impossible de supprimer le dernier stage actif' },
        { status: 400 }
      );
    }

    // Supprimer le stage
    await prisma.pipeline_stages.delete({
      where: { id: params.id },
    });

    // Réordonner les positions
    const remainingStages = await prisma.pipeline_stages.findMany({
      orderBy: { position: 'asc' },
    });

    for (let i = 0; i < remainingStages.length; i++) {
      await prisma.pipeline_stages.update({
        where: { id: remainingStages[i].id },
        data: { position: i + 1 },
      });
    }

    return NextResponse.json({
      message: 'Stage supprimé avec succès',
      migratedDeals: dealsCount > 0 ? dealsCount : 0
    });
  } catch (error) {
    console.error(`Erreur DELETE /api/pipeline-stages/${params.id}:`, error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
