import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/deals/[id]/important-comments - Récupérer les commentaires importants d'un deal
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id: dealId } = await params;

    const comments = await prisma.dealImportantComment.findMany({
      where: { dealId },
      select: {
        id: true,
        content: true,
        dealId: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Erreur récupération commentaires importants:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des commentaires' },
      { status: 500 }
    );
  }
}

// POST /api/deals/[id]/important-comments - Ajouter un commentaire important
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id: dealId } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Le contenu du commentaire est requis' },
        { status: 400 }
      );
    }

    // Vérifier que le deal existe
    const deal = await prisma.deals.findUnique({
      where: { id: dealId },
    });

    if (!deal) {
      return NextResponse.json(
        { error: 'Deal non trouvé' },
        { status: 404 }
      );
    }

    // Créer le commentaire
    const comment = await prisma.dealImportantComment.create({
      data: {
        content: content.trim(),
        dealId,
        userId: session.user.id,
      },
      select: {
        id: true,
        content: true,
        dealId: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error('Erreur création commentaire important:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du commentaire' },
      { status: 500 }
    );
  }
}

// DELETE /api/deals/[id]/important-comments - Supprimer un commentaire important
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('commentId');

    if (!commentId) {
      return NextResponse.json(
        { error: 'ID du commentaire requis' },
        { status: 400 }
      );
    }

    // Vérifier que le commentaire existe et appartient à l'utilisateur
    const comment = await prisma.dealImportantComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return NextResponse.json(
        { error: 'Commentaire non trouvé' },
        { status: 404 }
      );
    }

    // Seul l'auteur peut supprimer son commentaire
    if (comment.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Non autorisé à supprimer ce commentaire' },
        { status: 403 }
      );
    }

    await prisma.dealImportantComment.delete({
      where: { id: commentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur suppression commentaire important:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du commentaire' },
      { status: 500 }
    );
  }
}
