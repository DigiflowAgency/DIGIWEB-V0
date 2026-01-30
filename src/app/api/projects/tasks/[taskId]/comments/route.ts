import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createCommentSchema, updateCommentSchema } from '@/lib/projects/validators';
import { z } from 'zod';

// GET /api/projects/tasks/[taskId]/comments - Get task comments
export async function GET(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { taskId } = await params;

    const comments = await prisma.task_comments.findMany({
      where: { taskId, parentId: null },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
        replies: {
          include: {
            author: {
              select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/projects/tasks/[taskId]/comments - Add comment
export async function POST(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { taskId } = await params;
    const body = await request.json();
    const data = createCommentSchema.parse(body);

    const comment = await prisma.task_comments.create({
      data: {
        taskId,
        authorId: session.user.id,
        content: data.content,
        parentId: data.parentId,
        mentions: data.mentions ? JSON.stringify(data.mentions) : null,
      },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
      },
    });

    // Record history
    await prisma.task_history.create({
      data: {
        taskId,
        userId: session.user.id,
        field: 'comment',
        newValue: data.parentId ? 'replied' : 'added',
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT /api/projects/tasks/[taskId]/comments - Update comment
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { commentId, ...data } = body;
    const validated = updateCommentSchema.parse(data);

    if (!commentId) {
      return NextResponse.json({ error: 'ID du commentaire requis' }, { status: 400 });
    }

    // Check ownership
    const existing = await prisma.task_comments.findUnique({
      where: { id: commentId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Commentaire non trouvé' }, { status: 404 });
    }

    if (existing.authorId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé à modifier ce commentaire' }, { status: 403 });
    }

    const comment = await prisma.task_comments.update({
      where: { id: commentId },
      data: {
        content: validated.content,
        editedAt: new Date(),
      },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
      },
    });

    return NextResponse.json(comment);
  } catch (error) {
    console.error('Error updating comment:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/projects/tasks/[taskId]/comments - Delete comment
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('commentId');

    if (!commentId) {
      return NextResponse.json({ error: 'ID du commentaire requis' }, { status: 400 });
    }

    // Check ownership
    const existing = await prisma.task_comments.findUnique({
      where: { id: commentId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Commentaire non trouvé' }, { status: 404 });
    }

    if (existing.authorId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé à supprimer ce commentaire' }, { status: 403 });
    }

    await prisma.task_comments.delete({ where: { id: commentId } });

    return NextResponse.json({ message: 'Commentaire supprimé' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
