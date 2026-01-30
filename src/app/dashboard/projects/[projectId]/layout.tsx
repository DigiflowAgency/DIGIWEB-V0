'use client';

import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useProject } from '@/hooks/projects';
import {
  LayoutDashboard,
  Columns,
  List,
  Calendar,
  Target,
  Settings,
  ArrowLeft,
  Loader2,
  Tag,
  Github,
  Lightbulb,
} from 'lucide-react';

const navItems = [
  { href: '', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/board', label: 'Kanban', icon: Columns },
  { href: '/backlog', label: 'Backlog', icon: List },
  { href: '/calendar', label: 'Calendrier', icon: Calendar },
  { href: '/sprints', label: 'Sprints', icon: Target },
  { href: '/epics', label: 'Epics', icon: Target },
  { href: '/releases', label: 'Releases', icon: Tag },
  { href: '/repository', label: 'Repository', icon: Github },
  { href: '/improvements', label: 'Améliorations', icon: Lightbulb },
  { href: '/settings', label: 'Paramètres', icon: Settings },
];

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const projectId = params.projectId as string;

  const { project, isLoading, isError } = useProject(projectId);

  const basePath = `/dashboard/projects/${projectId}`;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-violet-600" />
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Projet introuvable</p>
          <Link
            href="/dashboard/projects"
            className="text-violet-600 hover:underline"
          >
            Retour aux projets
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Project Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="py-3">
            <Link
              href="/dashboard/projects"
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Projets
            </Link>
          </div>

          {/* Project Info */}
          <div className="pb-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {project.code}
              </span>
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            </div>
            {project.description && (
              <p className="mt-1 text-gray-500 text-sm line-clamp-1">{project.description}</p>
            )}
          </div>

          {/* Navigation Tabs */}
          <nav className="flex gap-1 -mb-px overflow-x-auto">
            {navItems.map((item) => {
              const href = `${basePath}${item.href}`;
              const isActive = item.href === ''
                ? pathname === basePath
                : pathname.startsWith(href);

              return (
                <Link
                  key={item.href}
                  href={href}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    isActive
                      ? 'border-violet-600 text-violet-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Page Content */}
      <div className="py-6">
        {children}
      </div>
    </div>
  );
}
