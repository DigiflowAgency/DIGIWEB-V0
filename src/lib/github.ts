// GitHub API Client
const GITHUB_API = 'https://api.github.com';

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  default_branch: string;
  private: boolean;
  owner: {
    login: string;
    avatar_url: string;
  };
}

export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  html_url: string;
  author?: {
    login: string;
    avatar_url: string;
  } | null;
}

export interface GitHubPullRequest {
  number: number;
  title: string;
  state: 'open' | 'closed';
  user: {
    login: string;
    avatar_url: string;
  };
  created_at: string;
  merged_at: string | null;
  html_url: string;
  body: string | null;
}

export interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  html_url: string;
  author: {
    login: string;
    avatar_url: string;
  };
}

export interface GitHubUser {
  login: string;
  name: string;
  email: string;
  avatar_url: string;
}

export class GitHubClient {
  private token?: string;

  constructor(token?: string) {
    this.token = token;
  }

  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${GITHUB_API}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options?.headers,
      },
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || `GitHub API error: ${res.status}`);
    }

    return res.json();
  }

  // User endpoints
  async getUser(): Promise<GitHubUser> {
    return this.fetch('/user');
  }

  async getUserRepos(perPage = 100): Promise<GitHubRepo[]> {
    return this.fetch(`/user/repos?per_page=${perPage}&sort=updated&affiliation=owner,collaborator`);
  }

  // Repository endpoints
  async getRepo(owner: string, repo: string): Promise<GitHubRepo> {
    return this.fetch(`/repos/${owner}/${repo}`);
  }

  async getCommits(owner: string, repo: string, perPage = 20, branch?: string): Promise<GitHubCommit[]> {
    const params = new URLSearchParams({ per_page: String(perPage) });
    if (branch) params.append('sha', branch);
    return this.fetch(`/repos/${owner}/${repo}/commits?${params}`);
  }

  async getPulls(owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'all', perPage = 20): Promise<GitHubPullRequest[]> {
    return this.fetch(`/repos/${owner}/${repo}/pulls?state=${state}&per_page=${perPage}&sort=updated&direction=desc`);
  }

  async getReleases(owner: string, repo: string, perPage = 20): Promise<GitHubRelease[]> {
    return this.fetch(`/repos/${owner}/${repo}/releases?per_page=${perPage}`);
  }

  async getBranches(owner: string, repo: string): Promise<{ name: string; commit: { sha: string } }[]> {
    return this.fetch(`/repos/${owner}/${repo}/branches`);
  }

  // Check if repo is accessible
  async checkRepoAccess(owner: string, repo: string): Promise<boolean> {
    try {
      await this.getRepo(owner, repo);
      return true;
    } catch {
      return false;
    }
  }
}

// OAuth helpers
export function getGitHubOAuthUrl(state: string, redirectUri: string): string {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) throw new Error('GITHUB_CLIENT_ID not configured');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'repo read:user',
    state,
  });

  return `https://github.com/login/oauth/authorize?${params}`;
}

export async function exchangeCodeForToken(code: string): Promise<string> {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('GitHub OAuth not configured');
  }

  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  });

  const data = await res.json();

  if (data.error) {
    throw new Error(data.error_description || data.error);
  }

  return data.access_token;
}

// Parse GitHub URL to extract owner and repo
export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  // Support various formats:
  // https://github.com/owner/repo
  // https://github.com/owner/repo.git
  // git@github.com:owner/repo.git
  // owner/repo

  let match = url.match(/github\.com[/:]([\w.-]+)\/([\w.-]+?)(\.git)?$/);
  if (match) {
    return { owner: match[1], repo: match[2] };
  }

  // Simple owner/repo format
  match = url.match(/^([\w.-]+)\/([\w.-]+)$/);
  if (match) {
    return { owner: match[1], repo: match[2] };
  }

  return null;
}
