import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createFormationSchema = z.object({
  title: z.string().min(1, 'Titre requis'),
  description: z.string().optional(),
  category: z.enum(['ONBOARDING', 'TECHNIQUES_VENTE', 'PRODUITS', 'OUTILS', 'SOFT_SKILLS', 'TECHNICAL']),
  videoUrl: z.string().url('URL vidéo invalide').optional(),
  articleContent: z.string().optional(),
  duration: z.number().min(1, 'Durée requise'),
  hasCertificate: z.boolean().optional(),
  allowedRoles: z.array(z.string()).optional(),
  order: z.number().optional(),
});

// GET /api/formations - Récupérer toutes les formations
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const formations = await prisma.formations.findMany({
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    // Filtrer selon les rôles autorisés
    const accessibleFormations = formations.filter((formation) => {
      const allowedRoles = JSON.parse(formation.allowedRoles);
      return allowedRoles.length === 0 || allowedRoles.includes(session.user.role);
    });

    // Récupérer la progression pour chaque formation
    const formationsWithProgress = await Promise.all(
      accessibleFormations.map(async (formation) => {
        const progress = await prisma.formation_progress.findUnique({
          where: {
            userId_formationId: {
              userId: session.user.id,
              formationId: formation.id,
            },
          },
        });

        return {
          ...formation,
          userProgress: progress || null,
        };
      })
    );

    return NextResponse.json({ formations: formationsWithProgress });
  } catch (error) {
    console.error('Erreur GET /api/formations:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST /api/formations - Créer une nouvelle formation (admin seulement)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que l'utilisateur est admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Seuls les administrateurs peuvent créer des formations' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createFormationSchema.parse(body);

    // Vérifier qu'au moins une vidéo ou un article est fourni
    if (!validatedData.videoUrl && !validatedData.articleContent) {
      return NextResponse.json(
        { error: 'Vous devez fournir soit une URL vidéo, soit un contenu article' },
        { status: 400 }
      );
    }

    const formation = await prisma.formations.create({
      data: {
        id: `FORM-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        title: validatedData.title,
        description: validatedData.description || null,
        category: validatedData.category,
        videoUrl: validatedData.videoUrl || null,
        articleContent: validatedData.articleContent || null,
        duration: validatedData.duration,
        hasCertificate: validatedData.hasCertificate || false,
        allowedRoles: JSON.stringify(validatedData.allowedRoles || []),
        order: validatedData.order || 0,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ formation }, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /api/formations:', error);

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
