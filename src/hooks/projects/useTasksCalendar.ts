'use client';

import useSWR from 'swr';
import { useMemo } from 'react';
import type { Task } from '@/types/projects';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erreur');
  return data;
};

interface CalendarTask extends Task {
  calendarDate: string; // The date to display on calendar (dueDate or startDate)
  dateType: 'due' | 'start';
}

interface UseTasksCalendarParams {
  projectId: string;
  year: number;
  month: number; // 0-indexed
  epicId?: string;
  sprintId?: string;
  assigneeId?: string;
}

interface MonthStats {
  total: number;
  completed: number;
  overdue: number;
  upcoming: number;
}

export function useTasksCalendar(params: UseTasksCalendarParams) {
  const { projectId, year, month, epicId, sprintId, assigneeId } = params;

  // Calculate date range for the month
  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0);

  const queryParams = new URLSearchParams();
  if (epicId) queryParams.append('epicId', epicId);
  if (sprintId) queryParams.append('sprintId', sprintId);
  if (assigneeId) queryParams.append('assigneeId', assigneeId);
  queryParams.append('limit', '500'); // Get all tasks for the month

  const url = `/api/projects/${projectId}/tasks?${queryParams}`;

  const { data, error, isLoading, mutate } = useSWR<{ tasks: Task[]; total: number }>(
    url,
    fetcher
  );

  // Filter and map tasks for the calendar
  const calendarData = useMemo(() => {
    const tasks = data?.tasks || [];
    const calendarTasks: CalendarTask[] = [];
    const tasksByDate: Record<string, CalendarTask[]> = {};

    tasks.forEach(task => {
      // Add task by dueDate
      if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        if (dueDate >= startOfMonth && dueDate <= endOfMonth) {
          const dateKey = task.dueDate.split('T')[0];
          const calendarTask: CalendarTask = {
            ...task,
            calendarDate: dateKey,
            dateType: 'due',
          };
          calendarTasks.push(calendarTask);
          if (!tasksByDate[dateKey]) tasksByDate[dateKey] = [];
          tasksByDate[dateKey].push(calendarTask);
        }
      }

      // Also add by startDate if different from dueDate
      if (task.startDate && task.startDate !== task.dueDate) {
        const startDate = new Date(task.startDate);
        if (startDate >= startOfMonth && startDate <= endOfMonth) {
          const dateKey = task.startDate.split('T')[0];
          const calendarTask: CalendarTask = {
            ...task,
            calendarDate: dateKey,
            dateType: 'start',
          };
          calendarTasks.push(calendarTask);
          if (!tasksByDate[dateKey]) tasksByDate[dateKey] = [];
          tasksByDate[dateKey].push(calendarTask);
        }
      }
    });

    return { calendarTasks, tasksByDate };
  }, [data, startOfMonth, endOfMonth]);

  // Calculate month stats
  const stats = useMemo((): MonthStats => {
    const tasks = calendarData.calendarTasks.filter(t => t.dateType === 'due');
    const now = new Date();

    return {
      total: tasks.length,
      completed: tasks.filter(t => t.status?.isDone).length,
      overdue: tasks.filter(t => {
        if (t.status?.isDone) return false;
        const dueDate = new Date(t.calendarDate);
        return dueDate < now;
      }).length,
      upcoming: tasks.filter(t => {
        if (t.status?.isDone) return false;
        const dueDate = new Date(t.calendarDate);
        return dueDate >= now;
      }).length,
    };
  }, [calendarData]);

  // Get tasks for a specific date
  const getTasksForDate = (dateStr: string): CalendarTask[] => {
    return calendarData.tasksByDate[dateStr] || [];
  };

  return {
    tasks: calendarData.calendarTasks,
    tasksByDate: calendarData.tasksByDate,
    stats,
    getTasksForDate,
    isLoading,
    isError: error,
    mutate,
  };
}

export type { CalendarTask, MonthStats };
