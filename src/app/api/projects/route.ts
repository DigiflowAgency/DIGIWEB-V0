import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createProjectSchema, projectsQuerySchema } from '@/lib/projects/validators';
import { generateProjectCode } from '@/lib/projects/utils';
import { DEFAULT_KANBAN_STATUSES } from '@/lib/projects/constants';
import { z } from 'zod';

// GET /api/projects - List all projects
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = projectsQuerySchema.parse({
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
      type: searchParams.get('type') || undefined,
      ownerId: searchParams.get('ownerId') || undefined,
      clientId: searchParams.get('clientId') || undefined,
      limit: searchParams.get('limit') || undefined,
      offset: searchParams.get('offset') || undefined,
    });

    const where: Record<string, unknown> = {
      archivedAt: null,
    };

    // Non-admin users can only see projects they're members of or own
    if (session.user.role !== 'ADMIN') {
      where.OR = [
        { ownerId: session.user.id },
        { members: { some: { userId: session.user.id } } },
      ];
    }

    if (query.search) {
      where.AND = [
        {
          OR: [
            { name: { contains: query.search } },
            { code: { contains: query.search } },
            { description: { contains: query.search } },
          ],
        },
      ];
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.ownerId) {
      where.ownerId = query.ownerId;
    }

    if (query.clientId) {
      where.clientId = query.clientId;
    }

    const [projects, total, planning, inProgress, completed] = await Promise.all([
      prisma.projects.findMany({
        where,
        include: {
          owner: {
            select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
          },
          client: {
            select: { id: true, name: true, email: true, phone: true },
          },
          _count: {
            select: { tasks: true, epics: true, sprints: true, members: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: query.limit,
        skip: query.offset,
      }),
      prisma.projects.count({ where }),
      prisma.projects.count({ where: { ...where, status: 'PLANNING' } }),
      prisma.projects.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      prisma.projects.count({ where: { ...where, status: 'COMPLETED' } }),
    ]);

    return NextResponse.json({
      projects,
      stats: { total, planning, inProgress, completed },
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Paramètres invalides', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/projects - Create a new project
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const data = createProjectSchema.parse(body);

    // Generate unique project code
    const existingCodes = await prisma.projects.findMany({
      select: { code: true },
    });
    const code = generateProjectCode(existingCodes.map(p => p.code));

    // Create project with default statuses
    const project = await prisma.projects.create({
      data: {
        code,
        name: data.name,
        description: data.description,
        type: data.type,
        budget: data.budget,
        currency: data.currency,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        deadline: data.deadline ? new Date(data.deadline) : null,
        clientId: data.clientId,
        ownerId: session.user.id,
        aiGenerated: data.aiGenerated,
        aiPrompt: data.aiPrompt,
        // Create default kanban statuses
        statuses: {
          create: DEFAULT_KANBAN_STATUSES.map((status, index) => ({
            name: status.name,
            color: status.color,
            position: index,
            isDefault: status.isDefault,
            isDone: status.isDone,
          })),
        },
        // Add owner as project member
        members: {
          create: {
            userId: session.user.id,
            role: 'OWNER',
          },
        },
      },
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
        statuses: true,
        members: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
            },
          },
        },
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
