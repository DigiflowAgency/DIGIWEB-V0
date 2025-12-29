import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// Types de documents supportés
const DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel', // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-powerpoint', // .ppt
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'text/plain', // .txt
  'text/csv', // .csv
];

// Fonction pour déterminer le type de fichier
function getFileCategory(mimeType: string): 'image' | 'video' | 'document' | null {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'video/mp4') return 'video';
  if (DOCUMENT_TYPES.includes(mimeType)) return 'document';
  return null;
}

// Fonction pour obtenir la taille max par type
function getMaxSize(category: 'image' | 'video' | 'document'): number {
  switch (category) {
    case 'video': return 50 * 1024 * 1024; // 50MB
    case 'document': return 25 * 1024 * 1024; // 25MB
    case 'image':
    default: return 10 * 1024 * 1024; // 10MB
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    // Déterminer la catégorie du fichier
    const category = getFileCategory(file.type);

    if (!category) {
      return NextResponse.json(
        { error: 'Type de fichier non supporté. Formats acceptés: images, vidéos MP4, PDF, Word, Excel, PowerPoint, CSV, TXT.' },
        { status: 400 }
      );
    }

    // Vérifier la taille
    const maxSize = getMaxSize(category);
    if (file.size > maxSize) {
      const maxMB = Math.round(maxSize / (1024 * 1024));
      return NextResponse.json(
        { error: `Fichier trop volumineux. Maximum ${maxMB}MB pour ce type de fichier.` },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Créer un nom de fichier unique
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 9);
    const extension = file.name.split('.').pop();
    const fileName = `${timestamp}-${randomStr}.${extension}`;

    // Déterminer le dossier de destination
    const folderMap = { image: 'images', video: 'videos', document: 'documents' };
    const folder = folderMap[category];
    const uploadDir = join(process.cwd(), 'public', 'uploads', folder);

    // Créer le dossier s'il n'existe pas
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const publicPath = join(uploadDir, fileName);

    // Sauvegarder le fichier
    await writeFile(publicPath, buffer);

    // Retourner l'URL publique
    const publicUrl = `/uploads/${folder}/${fileName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      type: category,
      originalName: file.name,
      size: file.size,
      mimeType: file.type,
    });
  } catch (error) {
    console.error('Erreur upload:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'upload du fichier' },
      { status: 500 }
    );
  }
}
