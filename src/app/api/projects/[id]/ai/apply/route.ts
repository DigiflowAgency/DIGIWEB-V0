import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateEpicCode, generateTaskCode } from '@/lib/projects/utils';
import type { AIGeneratedEpic, AIImportEpic, AITaskStatus, TaskPriority } from '@/types/projects';

interface ApplyRequest {
  mode: 'new' | 'import';
  epics: (AIGeneratedEpic | AIImportEpic)[];
}

// Helper to check if a task should be in the sprint
function shouldBeInSprint(
  status: AITaskStatus | undefined,
  priority: TaskPriority | undefined,
  mode: 'new' | 'import'
): boolean {
  // For import mode: IN_PROGRESS tasks always in sprint, TODO only if high priority
  if (mode === 'import') {
    if (status === 'IN_PROGRESS') return true;
    if (status === 'DONE') return false;
    // TODO tasks: only high priority in sprint
    return priority === 'CRITICAL' || priority === 'HIGH';
  }
  // For new mode: high priority tasks go to sprint
  return priority === 'CRITICAL' || priority === 'HIGH';
}

// POST /api/projects/[id]/ai/apply - Apply AI-generated structure to project
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
    const body: ApplyRequest = await request.json();
    const { mode, epics } = body;

    if (!epics || !Array.isArray(epics)) {
      return NextResponse.json({ error: 'Epics requis' }, { status: 400 });
    }

    // Get project with statuses
    const project = await prisma.projects.findUnique({
      where: { id: projectId },
      include: { statuses: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Projet non trouvé' }, { status: 404 });
    }

    // Map statuses
    const todoStatus = project.statuses.find(s => s.isDefault) || project.statuses[0];
    const inProgressStatus = project.statuses.find(s => s.name.toLowerCase().includes('cours')) || project.statuses[1];
    const doneStatus = project.statuses.find(s => s.isDone) || project.statuses[project.statuses.length - 1];

    const getStatusId = (status?: AITaskStatus): string => {
      if (!status || status === 'TODO') return todoStatus?.id || project.statuses[0].id;
      if (status === 'IN_PROGRESS') return inProgressStatus?.id || project.statuses[1]?.id || todoStatus.id;
      if (status === 'DONE') return doneStatus?.id || project.statuses[project.statuses.length - 1].id;
      return todoStatus.id;
    };

    // Get existing codes
    const existingEpicCodes = await prisma.epics.findMany({
      where: { projectId },
      select: { code: true },
    });
    const existingTaskCodes = await prisma.tasks.findMany({
      where: { projectId },
      select: { code: true },
    });

    const epicCodes = existingEpicCodes.map(e => e.code);
    const taskCodes = existingTaskCodes.map(t => t.code);

    let createdEpics = 0;
    let createdTasks = 0;
    const createdTaskIds: { id: string; status: AITaskStatus | undefined; priority: TaskPriority | undefined }[] = [];

    // Create epics and tasks
    for (const epicData of epics) {
      // Generate epic code
      const epicCode = generateEpicCode(project.code, epicCodes);
      epicCodes.push(epicCode);

      // Determine epic status for import mode
      let epicStatus: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED' = 'TODO';
      if (mode === 'import' && 'status' in epicData) {
        epicStatus = epicData.status as 'TODO' | 'IN_PROGRESS' | 'DONE';
      }

      const epic = await prisma.epics.create({
        data: {
          projectId,
          code: epicCode,
          title: epicData.title,
          description: epicData.description || null,
          color: epicData.color || '#8B5CF6',
          status: epicStatus,
          aiGenerated: true,
        },
      });
      createdEpics++;

      // Get tasks from epic (different structure for new vs import)
      const tasks = mode === 'import' && 'tasks' in epicData
        ? (epicData as AIImportEpic).tasks
        : 'stories' in epicData
          ? (epicData as AIGeneratedEpic).stories
          : [];

      let position = 0;
      for (const taskData of tasks) {
        // Generate task code
        const taskCode = generateTaskCode(project.code, taskCodes);
        taskCodes.push(taskCode);

        // Determine status
        const taskStatus = mode === 'import' && 'status' in taskData
          ? getStatusId(taskData.status as AITaskStatus)
          : todoStatus.id;

        // Determine if completed
        const isCompleted = mode === 'import' && 'status' in taskData && taskData.status === 'DONE';

        const taskPriority = (taskData.priority || 'MEDIUM') as TaskPriority;
        const taskStatusValue = mode === 'import' && 'status' in taskData
          ? taskData.status as AITaskStatus
          : 'TODO';

        const task = await prisma.tasks.create({
          data: {
            projectId,
            epicId: epic.id,
            code: taskCode,
            title: taskData.title,
            description: taskData.description || null,
            type: taskData.type || 'TASK',
            priority: taskPriority,
            storyPoints: taskData.storyPoints || null,
            statusId: taskStatus,
            reporterId: session.user.id,
            position: position++,
            aiGenerated: true,
            aiEstimated: !!taskData.storyPoints,
            completedAt: isCompleted ? new Date() : null,
          },
        });
        createdTasks++;

        // Track task for sprint assignment (exclude subtasks and completed tasks)
        if (!isCompleted) {
          createdTaskIds.push({
            id: task.id,
            status: taskStatusValue,
            priority: taskPriority,
          });
        }

        // Create subtasks if any
        const subtasks = taskData.subtasks || [];
        let subPosition = 0;
        for (const subData of subtasks) {
          const subCode = generateTaskCode(project.code, taskCodes);
          taskCodes.push(subCode);

          const subStatus = mode === 'import' && 'status' in subData
            ? getStatusId(subData.status as AITaskStatus)
            : todoStatus.id;

          const isSubCompleted = mode === 'import' && 'status' in subData && subData.status === 'DONE';

          await prisma.tasks.create({
            data: {
              projectId,
              epicId: epic.id,
              parentId: task.id,
              code: subCode,
              title: subData.title,
              description: subData.description || null,
              type: 'SUBTASK',
              priority: subData.priority || 'MEDIUM',
              storyPoints: subData.storyPoints || null,
              statusId: subStatus,
              reporterId: session.user.id,
              position: subPosition++,
              aiGenerated: true,
              aiEstimated: !!subData.storyPoints,
              completedAt: isSubCompleted ? new Date() : null,
            },
          });
          createdTasks++;
        }
      }
    }

    // === CREATE SPRINT 1 WITH PRIORITIZED TASKS ===

    // Determine which tasks should go in the sprint
    const sprintTaskIds = createdTaskIds
      .filter(t => shouldBeInSprint(t.status, t.priority, mode))
      .map(t => t.id);

    let createdSprint = null;
    let sprintPlannedPoints = 0;

    // Only create sprint if there are tasks for it
    if (sprintTaskIds.length > 0) {
      // Create Sprint 1 (ACTIVE)
      const sprintStartDate = new Date();
      const sprintEndDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // +2 weeks

      createdSprint = await prisma.sprints.create({
        data: {
          projectId,
          name: 'Sprint 1',
          goal: 'Sprint initial généré par IA - Tâches prioritaires',
          status: 'ACTIVE',
          startDate: sprintStartDate,
          endDate: sprintEndDate,
          startedAt: sprintStartDate,
          plannedPoints: 0, // Will be updated after
          completedPoints: 0,
        },
      });

      // Assign tasks to the sprint
      await prisma.tasks.updateMany({
        where: {
          id: { in: sprintTaskIds },
        },
        data: {
          sprintId: createdSprint.id,
        },
      });

      // Calculate planned points for the sprint
      const pointsResult = await prisma.tasks.aggregate({
        where: { sprintId: createdSprint.id },
        _sum: { storyPoints: true },
      });

      sprintPlannedPoints = pointsResult._sum.storyPoints || 0;

      // Update sprint with calculated points
      await prisma.sprints.update({
        where: { id: createdSprint.id },
        data: { plannedPoints: sprintPlannedPoints },
      });
    }

    return NextResponse.json({
      success: true,
      createdEpics,
      createdTasks,
      sprint: createdSprint ? {
        id: createdSprint.id,
        name: createdSprint.name,
        tasksCount: sprintTaskIds.length,
        plannedPoints: sprintPlannedPoints,
      } : null,
      backlogTasksCount: createdTaskIds.length - sprintTaskIds.length,
    });
  } catch (error) {
    console.error('Error applying AI structure:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
