'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTasksCalendar, CalendarTask } from '@/hooks/projects/useTasksCalendar';
import { getTaskTypeIcon, getTaskPriorityIcon, getInitials, getAvatarColor } from '@/lib/projects/utils';
import type { Epic, Sprint, ProjectMember } from '@/types/projects';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Clock,
  Filter,
  Loader2,
} from 'lucide-react';

interface TaskCalendarProps {
  projectId: string;
  epics?: Epic[];
  sprints?: Sprint[];
  members?: ProjectMember[];
}

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'CRITICAL': return 'border-l-red-500';
    case 'HIGH': return 'border-l-orange-500';
    case 'MEDIUM': return 'border-l-yellow-500';
    case 'LOW': return 'border-l-green-500';
    default: return 'border-l-gray-300';
  }
};

export default function TaskCalendar({ projectId, epics = [], sprints = [], members = [] }: TaskCalendarProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    epicId: '',
    sprintId: '',
    assigneeId: '',
  });

  const { tasks, getTasksForDate, stats, isLoading } = useTasksCalendar({
    projectId,
    year: currentYear,
    month: currentMonth,
    ...filters,
  });

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);
  const totalCells = Math.ceil((daysInMonth + firstDayOfMonth) / 7) * 7;

  const formatDateKey = (day: number) => {
    const m = String(currentMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${currentYear}-${m}-${d}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={goToToday}
              className="px-4 py-2 text-sm font-medium text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
            >
              Aujourd'hui
            </button>
            <h2 className="text-xl font-bold text-gray-900 min-w-[180px] text-center">
              {MONTHS[currentMonth]} {currentYear}
            </h2>
            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
              showFilters ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtres
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg flex flex-wrap gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Epic</label>
              <select
                value={filters.epicId}
                onChange={(e) => setFilters({ ...filters, epicId: e.target.value })}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">Tous les epics</option>
                {epics.map(epic => (
                  <option key={epic.id} value={epic.id}>{epic.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Sprint</label>
              <select
                value={filters.sprintId}
                onChange={(e) => setFilters({ ...filters, sprintId: e.target.value })}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">Tous les sprints</option>
                {sprints.map(sprint => (
                  <option key={sprint.id} value={sprint.id}>{sprint.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Assigné à</label>
              <select
                value={filters.assigneeId}
                onChange={(e) => setFilters({ ...filters, assigneeId: e.target.value })}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">Tous les membres</option>
                {members.map(member => (
                  <option key={member.userId} value={member.userId}>
                    {member.user?.firstName} {member.user?.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilters({ epicId: '', sprintId: '', assigneeId: '' })}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-medium text-gray-500">Total ce mois</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-green-50 rounded-lg border border-green-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-xs font-medium text-green-700">Terminées</span>
          </div>
          <p className="text-2xl font-bold text-green-900">{stats.completed}</p>
        </div>
        <div className="bg-red-50 rounded-lg border border-red-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-xs font-medium text-red-700">En retard</span>
          </div>
          <p className="text-2xl font-bold text-red-900">{stats.overdue}</p>
        </div>
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-medium text-blue-700">À venir</span>
          </div>
          <p className="text-2xl font-bold text-blue-900">{stats.upcoming}</p>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Days header */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {DAYS.map((day) => (
            <div key={day} className="py-3 text-center text-sm font-semibold text-gray-600">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar cells */}
        <div className="grid grid-cols-7">
          {Array.from({ length: totalCells }).map((_, index) => {
            const dayNumber = index - firstDayOfMonth + 1;
            const isCurrentMonth = dayNumber > 0 && dayNumber <= daysInMonth;
            const isToday =
              isCurrentMonth &&
              dayNumber === today.getDate() &&
              currentMonth === today.getMonth() &&
              currentYear === today.getFullYear();

            const dateKey = isCurrentMonth ? formatDateKey(dayNumber) : '';
            const dayTasks = isCurrentMonth ? getTasksForDate(dateKey) : [];

            return (
              <div
                key={index}
                className={`min-h-[120px] border-b border-r border-gray-200 p-2 ${
                  !isCurrentMonth ? 'bg-gray-50' : ''
                } ${isToday ? 'bg-violet-50' : ''}`}
              >
                {isCurrentMonth && (
                  <>
                    <div className={`text-sm font-medium mb-1 ${isToday ? 'text-violet-600' : 'text-gray-700'}`}>
                      {isToday ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-violet-600 text-white rounded-full text-xs">
                          {dayNumber}
                        </span>
                      ) : (
                        dayNumber
                      )}
                    </div>
                    <div className="space-y-1 max-h-[90px] overflow-y-auto">
                      {dayTasks.slice(0, 3).map((task, idx) => (
                        <TaskCalendarItem
                          key={`${task.id}-${task.dateType}-${idx}`}
                          task={task}
                          projectId={projectId}
                        />
                      ))}
                      {dayTasks.length > 3 && (
                        <p className="text-xs text-gray-500 text-center">
                          +{dayTasks.length - 3} autres
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-6 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 bg-white border-l-2 border-l-violet-500 rounded"></span>
          <span>Échéance (due date)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 bg-blue-50 border-l-2 border-l-blue-500 rounded"></span>
          <span>Début (start date)</span>
        </div>
      </div>
    </div>
  );
}

// Task item component
function TaskCalendarItem({ task, projectId }: { task: CalendarTask; projectId: string }) {
  const isStart = task.dateType === 'start';
  const isDone = task.status?.isDone;

  return (
    <Link
      href={`/dashboard/projects/${projectId}/tasks/${task.id}`}
      className={`block px-2 py-1 rounded text-xs truncate border-l-2 transition-all hover:shadow-sm ${
        isStart ? 'bg-blue-50 border-l-blue-500' : `bg-white ${getPriorityColor(task.priority)}`
      } ${isDone ? 'opacity-60' : ''}`}
      title={`${task.code} - ${task.title}`}
    >
      <div className="flex items-center gap-1">
        <span className="flex-shrink-0">{getTaskTypeIcon(task.type)}</span>
        <span className={`truncate ${isDone ? 'line-through' : ''}`}>
          {task.title}
        </span>
        {task.assignee && (
          <div
            className={`w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-medium flex-shrink-0 ${getAvatarColor(task.assignee.id)}`}
          >
            {getInitials(task.assignee.firstName, task.assignee.lastName)}
          </div>
        )}
      </div>
    </Link>
  );
}
