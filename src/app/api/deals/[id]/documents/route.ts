import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { unlink } from 'fs/promises';
import { join } from 'path';

// GET /api/deals/[id]/documents - Lister les documents d'un deal
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id: dealId } = await params;

    // Vérifier que le deal existe
    const deal = await prisma.deals.findUnique({
      where: { id: dealId },
      select: { id: true },
    });

    if (!deal) {
      return NextResponse.json({ error: 'Deal non trouvé' }, { status: 404 });
    }

    // Récupérer les documents
    const documents = await prisma.deal_documents.findMany({
      where: { dealId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { uploadedAt: 'desc' },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Erreur GET /api/deals/[id]/documents:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/deals/[id]/documents - Ajouter un document à un deal
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id: dealId } = await params;

    // Vérifier que le deal existe
    const deal = await prisma.deals.findUnique({
      where: { id: dealId },
      select: { id: true },
    });

    if (!deal) {
      return NextResponse.json({ error: 'Deal non trouvé' }, { status: 404 });
    }

    const body = await request.json();
    const { name, fileUrl, fileType, fileSize } = body;

    // Validation
    if (!name || !fileUrl || !fileType || fileSize === undefined) {
      return NextResponse.json(
        { error: 'Données manquantes: name, fileUrl, fileType et fileSize sont requis' },
        { status: 400 }
      );
    }

    // Créer le document
    const document = await prisma.deal_documents.create({
      data: {
        dealId,
        name,
        fileUrl,
        fileType,
        fileSize,
        uploadedBy: session.user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /api/deals/[id]/documents:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/deals/[id]/documents - Supprimer un document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id: dealId } = await params;
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json(
        { error: 'documentId requis en paramètre' },
        { status: 400 }
      );
    }

    // Vérifier que le document existe et appartient au deal
    const document = await prisma.deal_documents.findFirst({
      where: {
        id: documentId,
        dealId,
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document non trouvé' }, { status: 404 });
    }

    // Supprimer le fichier physique (optionnel, ne pas bloquer si erreur)
    try {
      const filePath = join(process.cwd(), 'public', document.fileUrl);
      await unlink(filePath);
    } catch (_fileError) {
      console.warn('Fichier déjà supprimé ou introuvable:', document.fileUrl);
    }

    // Supprimer l'entrée en base
    await prisma.deal_documents.delete({
      where: { id: documentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur DELETE /api/deals/[id]/documents:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
