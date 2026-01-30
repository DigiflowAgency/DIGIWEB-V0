import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { exchangeCodeForToken, GitHubClient } from '@/lib/github';
import { prisma } from '@/lib/prisma';

// GET /api/auth/github/callback - Handle GitHub OAuth callback
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const stateWithProject = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      console.error('GitHub OAuth error:', error);
      return NextResponse.redirect(
        new URL(`/dashboard/projects?error=github_oauth_denied`, request.url)
      );
    }

    if (!code || !stateWithProject) {
      return NextResponse.redirect(
        new URL('/dashboard/projects?error=github_oauth_invalid', request.url)
      );
    }

    // Extract state and projectId
    const [state, projectId] = stateWithProject.split(':');

    // Validate state from cookie
    const storedState = request.cookies.get('github_oauth_state')?.value;
    if (!storedState || storedState !== state) {
      return NextResponse.redirect(
        new URL('/dashboard/projects?error=github_oauth_state_mismatch', request.url)
      );
    }

    if (!projectId) {
      return NextResponse.redirect(
        new URL('/dashboard/projects?error=github_oauth_no_project', request.url)
      );
    }

    // Verify user has access to project
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
      return NextResponse.redirect(
        new URL('/dashboard/projects?error=github_oauth_no_access', request.url)
      );
    }

    // Exchange code for token
    const accessToken = await exchangeCodeForToken(code);

    // Verify token works by fetching user info
    const github = new GitHubClient(accessToken);
    const user = await github.getUser();

    // Store token temporarily in session or return to settings page
    // For now, redirect to settings with token in a secure way
    const response = NextResponse.redirect(
      new URL(`/dashboard/projects/${projectId}/settings?github_connected=true`, request.url)
    );

    // Store token in a secure httpOnly cookie temporarily
    // The settings page will call an API to save it to the database
    response.cookies.set('github_access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 5, // 5 minutes - just enough to save to DB
      path: '/',
    });

    // Clear the state cookie
    response.cookies.delete('github_oauth_state');

    return response;
  } catch (error) {
    console.error('GitHub OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/dashboard/projects?error=github_oauth_failed', request.url)
    );
  }
}
