import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile } from 'fs/promises';
import { join } from 'path';

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

    // Vérifier le type de fichier
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/mp4') || file.type === 'video/mp4';

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: 'Type de fichier non supporté. Seules les images et vidéos MP4 sont acceptées.' },
        { status: 400 }
      );
    }

    // Vérifier la taille (max 50MB pour vidéos, 10MB pour images)
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `Fichier trop volumineux. Maximum ${isVideo ? '50MB' : '10MB'}` },
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
    const folder = isImage ? 'images' : 'videos';
    const publicPath = join(process.cwd(), 'public', 'uploads', folder, fileName);

    // Sauvegarder le fichier
    await writeFile(publicPath, buffer);

    // Retourner l'URL publique
    const publicUrl = `/uploads/${folder}/${fileName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      type: isImage ? 'image' : 'video',
    });
  } catch (error) {
    console.error('Erreur upload:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'upload du fichier' },
      { status: 500 }
    );
  }
}
