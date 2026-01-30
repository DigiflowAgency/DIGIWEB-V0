import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getGitHubOAuthUrl } from '@/lib/github';
import { randomBytes } from 'crypto';

// GET /api/auth/github - Initiate GitHub OAuth flow
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'projectId requis' }, { status: 400 });
    }

    // Generate state for CSRF protection
    const state = randomBytes(32).toString('hex');

    // Store state in cookie for validation in callback
    const baseUrl = process.env.NEXTAUTH_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    const redirectUri = `${baseUrl}/api/auth/github/callback`;

    // Encode projectId in state
    const stateWithProject = `${state}:${projectId}`;

    const oauthUrl = getGitHubOAuthUrl(stateWithProject, redirectUri);

    const response = NextResponse.redirect(oauthUrl);

    // Set state cookie for validation
    response.cookies.set('github_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('GitHub OAuth initiation error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'initiation OAuth' },
      { status: 500 }
    );
  }
}
