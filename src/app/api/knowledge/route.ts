import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const category = searchParams.get('category');

    const articles = await prisma.knowledgeArticle.findMany({
      where: {
        ...(search && {
          OR: [
            { title: { contains: search } },
            { content: { contains: search } },
          ],
        }),
        ...(category && { category }),
      },
      orderBy: { updatedAt: 'desc' },
    });

    const stats = {
      total: articles.length,
      totalViews: articles.reduce((sum, a) => sum + a.views, 0),
      categories: [...new Set(articles.map(a => a.category))].length,
      avgViews: articles.length > 0 ? Math.round(articles.reduce((sum, a) => sum + a.views, 0) / articles.length) : 0,
    };

    return NextResponse.json({ articles, stats });
  } catch (error) {
    console.error('Error fetching articles:', error);
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
  }
}
