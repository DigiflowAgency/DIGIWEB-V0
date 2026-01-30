import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GitHubClient, parseGitHubUrl } from '@/lib/github';

// GET /api/projects/[projectId]/repository - Get connected repository
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

    // Check access
    const project = await prisma.projects.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id } } },
        ],
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Projet non trouvé' }, { status: 404 });
    }

    const repository = await prisma.project_repositories.findUnique({
      where: { projectId },
    });

    return NextResponse.json(repository);
  } catch (error) {
    console.error('Get repository error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/projects/[projectId]/repository - Connect a repository
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id: projectId } = await params;
    const body = await request.json();
    const { githubUrl, accessToken: bodyToken } = body;

    // Check access - only owner or lead can connect repo
    const project = await prisma.projects.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id, role: { in: ['OWNER', 'LEAD'] } } } },
        ],
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Parse GitHub URL
    const parsed = parseGitHubUrl(githubUrl);
    if (!parsed) {
      return NextResponse.json({ error: 'URL GitHub invalide' }, { status: 400 });
    }

    // Get token from cookie or body
    const cookieToken = request.cookies.get('github_access_token')?.value;
    const accessToken = bodyToken || cookieToken;

    // Verify access to repo
    const github = new GitHubClient(accessToken);
    const hasAccess = await github.checkRepoAccess(parsed.owner, parsed.repo);

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Accès au repository refusé. Vérifiez que le repository existe et que vous y avez accès.' },
        { status: 403 }
      );
    }

    // Get repo details
    const repoDetails = await github.getRepo(parsed.owner, parsed.repo);

    // Create or update repository connection
    const repository = await prisma.project_repositories.upsert({
      where: { projectId },
      create: {
        projectId,
        githubOwner: parsed.owner,
        githubRepo: parsed.repo,
        githubUrl: repoDetails.html_url,
        defaultBranch: repoDetails.default_branch,
        accessToken: accessToken || null,
      },
      update: {
        githubOwner: parsed.owner,
        githubRepo: parsed.repo,
        githubUrl: repoDetails.html_url,
        defaultBranch: repoDetails.default_branch,
        accessToken: accessToken || null,
      },
    });

    // Clear the temporary cookie if it exists
    const response = NextResponse.json(repository);
    response.cookies.delete('github_access_token');

    return response;
  } catch (error) {
    console.error('Connect repository error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/projects/[projectId]/repository - Disconnect repository
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Check access - only owner or lead can disconnect
    const project = await prisma.projects.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id, role: { in: ['OWNER', 'LEAD'] } } } },
        ],
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    await prisma.project_repositories.delete({
      where: { projectId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Disconnect repository error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
