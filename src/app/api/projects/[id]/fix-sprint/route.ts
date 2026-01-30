import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { task_priority } from '@prisma/client';

// POST /api/projects/[id]/fix-sprint - Create Sprint 1 for existing projects without sprints
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Get project with statuses
    const project = await prisma.projects.findUnique({
      where: { id: projectId },
      include: {
        statuses: true,
        sprints: {
          where: { status: 'ACTIVE' }
        }
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Projet non trouvé' }, { status: 404 });
    }

    // Check if an active sprint already exists
    if (project.sprints.length > 0) {
      return NextResponse.json({
        error: 'Un sprint actif existe déjà',
        sprint: {
          id: project.sprints[0].id,
          name: project.sprints[0].name,
        }
      }, { status: 400 });
    }

    // Get status IDs
    const todoStatus = project.statuses.find(s => s.isDefault) || project.statuses[0];
    const inProgressStatus = project.statuses.find(s => s.name.toLowerCase().includes('cours')) || project.statuses[1];
    const doneStatus = project.statuses.find(s => s.isDone);

    // Get all tasks without sprint (backlog) that are not completed
    const backlogTasks = await prisma.tasks.findMany({
      where: {
        projectId,
        sprintId: null,
        parentId: null, // Exclude subtasks
        statusId: doneStatus ? { not: doneStatus.id } : undefined,
      },
      select: {
        id: true,
        priority: true,
        statusId: true,
      },
    });

    if (backlogTasks.length === 0) {
      return NextResponse.json({
        message: 'Aucune tâche à assigner au sprint',
        sprint: null,
      });
    }

    // Determine which tasks should go in the sprint
    const shouldBeInSprint = (task: { priority: task_priority; statusId: string }): boolean => {
      // IN_PROGRESS tasks always in sprint
      if (inProgressStatus && task.statusId === inProgressStatus.id) return true;
      // High priority TODO tasks in sprint
      return task.priority === 'CRITICAL' || task.priority === 'HIGH';
    };

    const sprintTaskIds = backlogTasks
      .filter(shouldBeInSprint)
      .map(t => t.id);

    if (sprintTaskIds.length === 0) {
      return NextResponse.json({
        message: 'Aucune tâche prioritaire à assigner au sprint (toutes les tâches sont de priorité basse)',
        sprint: null,
        backlogTasksCount: backlogTasks.length,
      });
    }

    // Create Sprint 1 (ACTIVE)
    const sprintStartDate = new Date();
    const sprintEndDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // +2 weeks

    const sprint = await prisma.sprints.create({
      data: {
        projectId,
        name: 'Sprint 1',
        goal: 'Sprint initial - Tâches prioritaires',
        status: 'ACTIVE',
        startDate: sprintStartDate,
        endDate: sprintEndDate,
        startedAt: sprintStartDate,
        plannedPoints: 0,
        completedPoints: 0,
      },
    });

    // Assign tasks to the sprint
    await prisma.tasks.updateMany({
      where: {
        id: { in: sprintTaskIds },
      },
      data: {
        sprintId: sprint.id,
      },
    });

    // Calculate planned points for the sprint
    const pointsResult = await prisma.tasks.aggregate({
      where: { sprintId: sprint.id },
      _sum: { storyPoints: true },
    });

    const sprintPlannedPoints = pointsResult._sum.storyPoints || 0;

    // Update sprint with calculated points
    await prisma.sprints.update({
      where: { id: sprint.id },
      data: { plannedPoints: sprintPlannedPoints },
    });

    return NextResponse.json({
      success: true,
      message: 'Sprint créé avec succès',
      sprint: {
        id: sprint.id,
        name: sprint.name,
        tasksCount: sprintTaskIds.length,
        plannedPoints: sprintPlannedPoints,
        startDate: sprintStartDate,
        endDate: sprintEndDate,
      },
      backlogTasksCount: backlogTasks.length - sprintTaskIds.length,
    });
  } catch (error) {
    console.error('Error fixing sprint:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
