'use client';

import { useParams } from 'next/navigation';
import { useProject, useEpics, useSprints } from '@/hooks/projects';
import TaskCalendar from '@/components/projects/calendar/TaskCalendar';
import { CalendarDays, Loader2 } from 'lucide-react';

export default function ProjectCalendarPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const { project, isLoading: projectLoading } = useProject(projectId);
  const { epics, isLoading: epicsLoading } = useEpics(projectId);
  const { sprints, isLoading: sprintsLoading } = useSprints(projectId);

  const isLoading = projectLoading || epicsLoading || sprintsLoading;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-12 w-12 animate-spin text-violet-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-7 w-7 text-violet-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Calendrier</h1>
            <p className="text-sm text-gray-500">Vue mensuelle des tâches par échéance</p>
          </div>
        </div>
      </div>

      {/* Calendar Component */}
      <TaskCalendar
        projectId={projectId}
        epics={epics}
        sprints={sprints}
        members={project?.members || []}
      />
    </div>
  );
}
