import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema de validation pour update (tous les champs optionnels)
const socialPostUpdateSchema = z.object({
  content: z.string().min(1).optional(),
  platform: z.enum(['FACEBOOK', 'LINKEDIN', 'INSTAGRAM', 'TWITTER']).optional(),
  status: z.enum(['BROUILLON', 'PLANIFIE', 'PUBLIE']).optional(),
  likes: z.number().int().min(0).optional(),
  comments: z.number().int().min(0).optional(),
  shares: z.number().int().min(0).optional(),
  reach: z.number().int().min(0).optional(),
  scheduledAt: z.string().datetime().optional().nullable(),
  publishedAt: z.string().datetime().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  videoUrl: z.string().url().optional().nullable(),
});

type RouteContext = {
  params: { id: string };
};

// GET /api/social-posts/[id] - Récupérer un post par ID
export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const post = await prisma.socialPost.findUnique({
      where: { id: params.id },
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error(`Erreur GET /api/social-posts/${params.id}:`, error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PUT /api/social-posts/[id] - Mettre à jour un post
export async function PUT(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que le post existe
    const existingPost = await prisma.socialPost.findUnique({
      where: { id: params.id },
    });

    if (!existingPost) {
      return NextResponse.json(
        { error: 'Post non trouvé' },
        { status: 404 }
      );
    }

    // Parser et valider le body
    const body = await request.json();
    const validatedData = socialPostUpdateSchema.parse(body);

    // Préparer les données de mise à jour
    const updateData: any = { ...validatedData };

    // Convertir les dates string en Date si elles existent
    if (validatedData.scheduledAt) {
      updateData.scheduledAt = new Date(validatedData.scheduledAt);
    }
    if (validatedData.publishedAt) {
      updateData.publishedAt = new Date(validatedData.publishedAt);
    }

    // Si le statut devient PUBLIE, définir publishedAt automatiquement
    if (validatedData.status === 'PUBLIE' && !existingPost.publishedAt) {
      updateData.publishedAt = validatedData.publishedAt ? new Date(validatedData.publishedAt) : new Date();
    }

    // Mettre à jour le post
    const updatedPost = await prisma.socialPost.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error(`Erreur PUT /api/social-posts/${params.id}:`, error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// DELETE /api/social-posts/[id] - Supprimer un post
export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que le post existe
    const existingPost = await prisma.socialPost.findUnique({
      where: { id: params.id },
    });

    if (!existingPost) {
      return NextResponse.json(
        { error: 'Post non trouvé' },
        { status: 404 }
      );
    }

    // Supprimer le post
    await prisma.socialPost.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Post supprimé avec succès' });
  } catch (error) {
    console.error(`Erreur DELETE /api/social-posts/${params.id}:`, error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
