import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GitHubClient } from '@/lib/github';

// GET /api/projects/[projectId]/repository/commits - Get commits from connected repo
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id: projectId } = await params;
    const { searchParams } = new URL(request.url);
    const perPage = parseInt(searchParams.get('perPage') || '20');
    const branch = searchParams.get('branch') || undefined;

    // Check access
    const project = await prisma.projects.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id } } },
        ],
      },
      include: {
        repository: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Projet non trouvé' }, { status: 404 });
    }

    if (!project.repository) {
      return NextResponse.json({ error: 'Aucun repository connecté' }, { status: 404 });
    }

    const github = new GitHubClient(project.repository.accessToken || undefined);
    const commits = await github.getCommits(
      project.repository.githubOwner,
      project.repository.githubRepo,
      perPage,
      branch
    );

    return NextResponse.json(commits);
  } catch (error) {
    console.error('Get commits error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
