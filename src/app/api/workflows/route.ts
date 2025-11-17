import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/workflows - Récupérer tous les workflows
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    const workflows = await prisma.workflow.findMany({
      where: {
        ...(search && {
          name: {
            contains: search,
          },
        }),
        ...(status && {
          status: status as any,
        }),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculer les statistiques
    const stats = {
      total: workflows.length,
      active: workflows.filter((w) => w.status === 'ACTIVE').length,
      pause: workflows.filter((w) => w.status === 'PAUSE').length,
      archived: workflows.filter((w) => w.status === 'ARCHIVED').length,
      totalExecutions: workflows.reduce((sum, w) => sum + w.executions, 0),
      avgSuccessRate: workflows.length > 0
        ? workflows.reduce((sum, w) => sum + (w.successRate || 0), 0) / workflows.length
        : 0,
    };

    return NextResponse.json({ workflows, stats });
  } catch (error) {
    console.error('Error fetching workflows:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflows' },
      { status: 500 }
    );
  }
}

// POST /api/workflows - Créer un nouveau workflow
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const workflow = await prisma.workflow.create({
      data: {
        name: data.name,
        description: data.description,
        trigger: data.trigger,
        config: JSON.stringify(data.config || {}),
        actionsCount: data.actionsCount || 0,
        status: data.status || 'ACTIVE',
      },
    });

    return NextResponse.json(workflow, { status: 201 });
  } catch (error) {
    console.error('Error creating workflow:', error);
    return NextResponse.json(
      { error: 'Failed to create workflow' },
      { status: 500 }
    );
  }
}
