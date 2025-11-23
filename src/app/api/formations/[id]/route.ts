import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateFormationSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.enum(['ONBOARDING', 'TECHNIQUES_VENTE', 'PRODUITS', 'OUTILS', 'SOFT_SKILLS', 'TECHNICAL']).optional(),
  videoUrl: z.string().url('URL vidéo invalide').optional(),
  articleContent: z.string().optional(),
  duration: z.number().min(1).optional(),
  hasCertificate: z.boolean().optional(),
  allowedRoles: z.array(z.string()).optional(),
  order: z.number().optional(),
});

type RouteContext = {
  params: { id: string };
};

// GET /api/formations/[id] - Récupérer une formation spécifique
export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const formation = await prisma.formations.findUnique({
      where: { id: params.id },
    });

    if (!formation) {
      return NextResponse.json(
        { error: 'Formation non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier les rôles autorisés
    const allowedRoles = JSON.parse(formation.allowedRoles);
    if (allowedRoles.length > 0 && !allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Vous n\'avez pas accès à cette formation' },
        { status: 403 }
      );
    }

    // Récupérer la progression de l'utilisateur
    const progress = await prisma.formation_progress.findUnique({
      where: {
        userId_formationId: {
          userId: session.user.id,
          formationId: params.id,
        },
      },
    });

    return NextResponse.json({
      formation: {
        ...formation,
        userProgress: progress || null,
      }
    });
  } catch (error) {
    console.error(`Erreur GET /api/formations/${params.id}:`, error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PUT /api/formations/[id] - Mettre à jour une formation (admin seulement)
export async function PUT(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Seuls les administrateurs peuvent modifier des formations' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateFormationSchema.parse(body);

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (validatedData.title) updateData.title = validatedData.title;
    if (validatedData.description !== undefined) updateData.description = validatedData.description || null;
    if (validatedData.category) updateData.category = validatedData.category;
    if (validatedData.videoUrl !== undefined) updateData.videoUrl = validatedData.videoUrl || null;
    if (validatedData.articleContent !== undefined) updateData.articleContent = validatedData.articleContent || null;
    if (validatedData.duration) updateData.duration = validatedData.duration;
    if (validatedData.hasCertificate !== undefined) updateData.hasCertificate = validatedData.hasCertificate;
    if (validatedData.allowedRoles !== undefined) updateData.allowedRoles = JSON.stringify(validatedData.allowedRoles);
    if (validatedData.order !== undefined) updateData.order = validatedData.order;

    const formation = await prisma.formations.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({ formation });
  } catch (error) {
    console.error(`Erreur PUT /api/formations/${params.id}:`, error);

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

// DELETE /api/formations/[id] - Supprimer une formation (admin seulement)
export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Seuls les administrateurs peuvent supprimer des formations' },
        { status: 403 }
      );
    }

    await prisma.formations.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Erreur DELETE /api/formations/${params.id}:`, error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
