'use client';

import { useParams } from 'next/navigation';
import { useProject, useProjectStats } from '@/hooks/projects';
import ProjectHeader from '@/components/projects/ProjectHeader';
import ProjectStats from '@/components/projects/ProjectStats';
import { Loader2, Target, CheckCircle, AlertCircle, Clock, Users, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function ProjectDashboardPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const { project, isLoading: projectLoading } = useProject(projectId);
  const { stats, isLoading: statsLoading } = useProjectStats(projectId);

  const isLoading = projectLoading || statsLoading;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Projet non trouvé</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
              <Target className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Tâches</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalTasks || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Complétées</p>
              <p className="text-2xl font-bold text-green-600">{stats?.completedTasks || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">En cours</p>
              <p className="text-2xl font-bold text-blue-600">{stats?.inProgressTasks || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Progression</p>
              <p className="text-2xl font-bold text-orange-600">{stats?.progress || 0}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Progression globale</h2>

            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Avancement</span>
                <span className="font-medium">{stats?.progress || 0}%</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-violet-600 rounded-full transition-all"
                  style={{ width: `${stats?.progress || 0}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{stats?.totalPoints || 0}</p>
                <p className="text-xs text-gray-500">Story points</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{stats?.completedPoints || 0}</p>
                <p className="text-xs text-gray-500">Points complétés</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {(stats?.totalPoints || 0) - (stats?.completedPoints || 0)}
                </p>
                <p className="text-xs text-gray-500">Points restants</p>
              </div>
            </div>
          </div>

          {/* Active Sprint */}
          {stats?.activeSprint && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Sprint actif</h2>
                <Link
                  href={`/dashboard/projects/${projectId}/sprints`}
                  className="text-sm text-violet-600 hover:underline"
                >
                  Voir les sprints
                </Link>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                  En cours
                </span>
                <h3 className="font-medium text-gray-900">{stats.activeSprint.name}</h3>
              </div>

              {stats.activeSprint.goal && (
                <p className="text-sm text-gray-500 mb-4">{stats.activeSprint.goal}</p>
              )}

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Progression</span>
                  <span className="font-medium">
                    {stats.activeSprint.completedPoints}/{stats.activeSprint.plannedPoints} pts
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{
                      width: stats.activeSprint.plannedPoints > 0
                        ? `${(stats.activeSprint.completedPoints / stats.activeSprint.plannedPoints) * 100}%`
                        : '0%'
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>
                  {new Date(stats.activeSprint.startDate).toLocaleDateString('fr-FR')} - {new Date(stats.activeSprint.endDate).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          )}

          {/* Recent Activity / Tasks by Status */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Répartition par statut</h2>

            {stats?.tasksByStatus && stats.tasksByStatus.length > 0 ? (
              <div className="space-y-3">
                {stats.tasksByStatus.map((item, index) => {
                  const total = stats.totalTasks || 1;
                  const percentage = Math.round((item.count / total) * 100);

                  return (
                    <div key={item.id || item.status || index}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-gray-700">{item.name || item.status}</span>
                        </div>
                        <span className="font-medium">{item.count}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: item.color
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Aucune tâche créée</p>
            )}
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Quick Links */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Accès rapide</h2>
            <div className="space-y-2">
              <Link
                href={`/dashboard/projects/${projectId}/board`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Tableau Kanban</p>
                  <p className="text-xs text-gray-500">Gérer les tâches</p>
                </div>
              </Link>

              <Link
                href={`/dashboard/projects/${projectId}/backlog`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Backlog</p>
                  <p className="text-xs text-gray-500">Prioriser les tâches</p>
                </div>
              </Link>

              <Link
                href={`/dashboard/projects/${projectId}/sprints`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Sprints</p>
                  <p className="text-xs text-gray-500">Planifier les itérations</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Team Members */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Équipe</h2>
              <span className="text-sm text-gray-500">{project._count?.members || 0} membres</span>
            </div>

            {project.members && project.members.length > 0 ? (
              <div className="space-y-3">
                {project.members.slice(0, 5).map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center text-sm font-medium text-violet-600">
                      {member.user?.firstName?.[0]}{member.user?.lastName?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {member.user?.firstName} {member.user?.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{member.role}</p>
                    </div>
                  </div>
                ))}
                {project.members.length > 5 && (
                  <p className="text-sm text-gray-500">
                    +{project.members.length - 5} autres membres
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Aucun membre</p>
            )}
          </div>

          {/* Project Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations</h2>
            <div className="space-y-3 text-sm">
              {project.budget && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Budget</span>
                  <span className="font-medium">
                    {project.budget.toLocaleString()} {project.currency}
                  </span>
                </div>
              )}
              {project.startDate && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Début</span>
                  <span className="font-medium">
                    {new Date(project.startDate).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              )}
              {project.deadline && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Deadline</span>
                  <span className="font-medium">
                    {new Date(project.deadline).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Créé le</span>
                <span className="font-medium">
                  {new Date(project.createdAt).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
