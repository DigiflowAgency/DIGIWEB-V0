import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { task_priority, project_statuses } from '@prisma/client';

// POST /api/projects/fix-all-sprints - Create Sprint 1 for all projects without active sprints
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Get all projects without active sprints
    const projectsWithoutSprints = await prisma.projects.findMany({
      where: {
        sprints: {
          none: {
            status: 'ACTIVE',
          },
        },
      },
      include: {
        statuses: true,
        tasks: {
          where: {
            sprintId: null,
            parentId: null, // Exclude subtasks
          },
          select: {
            id: true,
            priority: true,
            statusId: true,
          },
        },
      },
    });

    const results: {
      projectId: string;
      projectName: string;
      sprintCreated: boolean;
      tasksAssigned: number;
      plannedPoints: number;
      message: string;
    }[] = [];

    for (const project of projectsWithoutSprints) {
      // Get status IDs
      const inProgressStatus = project.statuses.find(
        (s: project_statuses) => s.name.toLowerCase().includes('cours')
      ) || project.statuses[1];
      const doneStatus = project.statuses.find((s: project_statuses) => s.isDone);

      // Filter out completed tasks
      const backlogTasks = project.tasks.filter(
        t => !doneStatus || t.statusId !== doneStatus.id
      );

      if (backlogTasks.length === 0) {
        results.push({
          projectId: project.id,
          projectName: project.name,
          sprintCreated: false,
          tasksAssigned: 0,
          plannedPoints: 0,
          message: 'Aucune tâche disponible',
        });
        continue;
      }

      // Determine which tasks should go in the sprint
      const shouldBeInSprint = (task: { priority: task_priority; statusId: string }): boolean => {
        if (inProgressStatus && task.statusId === inProgressStatus.id) return true;
        return task.priority === 'CRITICAL' || task.priority === 'HIGH';
      };

      const sprintTaskIds = backlogTasks
        .filter(shouldBeInSprint)
        .map(t => t.id);

      if (sprintTaskIds.length === 0) {
        results.push({
          projectId: project.id,
          projectName: project.name,
          sprintCreated: false,
          tasksAssigned: 0,
          plannedPoints: 0,
          message: 'Aucune tâche prioritaire',
        });
        continue;
      }

      // Create Sprint 1 (ACTIVE)
      const sprintStartDate = new Date();
      const sprintEndDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

      const sprint = await prisma.sprints.create({
        data: {
          projectId: project.id,
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

      // Calculate planned points
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

      results.push({
        projectId: project.id,
        projectName: project.name,
        sprintCreated: true,
        tasksAssigned: sprintTaskIds.length,
        plannedPoints: sprintPlannedPoints,
        message: 'Sprint créé avec succès',
      });
    }

    const createdCount = results.filter(r => r.sprintCreated).length;
    const totalTasksAssigned = results.reduce((sum, r) => sum + r.tasksAssigned, 0);

    return NextResponse.json({
      success: true,
      summary: {
        projectsProcessed: projectsWithoutSprints.length,
        sprintsCreated: createdCount,
        totalTasksAssigned,
      },
      details: results,
    });
  } catch (error) {
    console.error('Error fixing all sprints:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
