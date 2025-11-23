'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import NotificationDropdown from '@/components/NotificationDropdown';
import MotivationBanner from '@/components/MotivationBanner';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Calendar,
  TrendingUp,
  FileText,
  CreditCard,
  Mail,
  Megaphone,
  Share2,
  BarChart3,
  Ticket,
  BookOpen,
  Smile,
  Zap,
  Workflow,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  GraduationCap,
  Target,
  ClipboardCheck,
  AppWindow,
  ExternalLink,
  MessageCircle,
  Trophy,
} from 'lucide-react';

interface SubNavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
  isExternal?: boolean;
  adminOnly?: boolean;
}

interface NavCategory {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  subItems: SubNavItem[];
  disabled?: boolean;
}

const navigationCategories: NavCategory[] = [
  {
    name: 'Dashboard',
    icon: LayoutDashboard,
    subItems: [],
  },
  {
    name: 'Analytics',
    icon: BarChart3,
    subItems: [
      { name: 'Vue d\'ensemble', href: '/dashboard/analytics', icon: BarChart3, adminOnly: true },
    ],
  },
  {
    name: 'CRM',
    icon: Users,
    subItems: [
      { name: 'Pipeline', href: '/dashboard/crm', icon: Users },
      { name: 'Production', href: '/dashboard/crm/deals', icon: Briefcase },
      { name: 'Prospection', href: '/dashboard/crm/prospection', icon: Target },
      { name: 'Activités', href: '/dashboard/crm/activities', icon: Calendar, disabled: true },
    ],
  },
  {
    name: 'Ventes',
    icon: TrendingUp,
    subItems: [
      { name: 'Pipeline', href: '/dashboard/sales/pipeline', icon: TrendingUp },
      { name: 'Devis', href: '/dashboard/sales/quotes', icon: FileText },
      { name: 'Facturation', href: '/dashboard/sales/invoices', icon: CreditCard, disabled: true },
      { name: 'Suivi commercial', href: '/dashboard/sales/tracking', icon: BarChart3 },
    ],
  },
  {
    name: 'Objectifs',
    icon: Target,
    subItems: [
      { name: 'Mes objectifs', href: '/dashboard/objectives', icon: Target },
      { name: 'Mes primes', href: '/dashboard/mes-primes', icon: TrendingUp },
    ],
  },
  {
    name: 'Check-in',
    icon: ClipboardCheck,
    subItems: [
      { name: 'Mon check-in', href: '/dashboard/checkin', icon: ClipboardCheck },
      { name: 'Suivi collaborateur', href: '/dashboard/admin/team-tracking', icon: Users, adminOnly: true },
    ],
  },
  {
    name: 'Courses',
    icon: Trophy,
    subItems: [
      { name: 'Classements', href: '/dashboard/courses', icon: Trophy },
    ],
  },
  {
    name: 'Administration',
    icon: Settings,
    subItems: [
      { name: 'Gestion utilisateurs', href: '/dashboard/admin/users', icon: Users, adminOnly: true },
    ],
  },
  {
    name: 'Messagerie',
    icon: MessageCircle,
    subItems: [
      { name: 'Mes conversations', href: '/dashboard/messages', icon: MessageCircle },
    ],
  },
  {
    name: 'Marketing',
    icon: Megaphone,
    disabled: true,
    subItems: [
      { name: 'Campagnes', href: '/dashboard/marketing/campaigns', icon: Megaphone },
      { name: 'Email', href: '/dashboard/marketing/email', icon: Mail },
      { name: 'Réseaux sociaux', href: '/dashboard/marketing/social', icon: Share2 },
      { name: 'Analytics', href: '/dashboard/marketing/analytics', icon: BarChart3 },
    ],
  },
  {
    name: 'Service',
    icon: Ticket,
    disabled: true,
    subItems: [
      { name: 'Tickets', href: '/dashboard/service/tickets', icon: Ticket },
      { name: 'Base de connaissances', href: '/dashboard/service/knowledge', icon: BookOpen },
      { name: 'Satisfaction', href: '/dashboard/service/satisfaction', icon: Smile },
    ],
  },
  {
    name: 'Automatisation',
    icon: Zap,
    disabled: true,
    subItems: [
      { name: 'Workflows', href: '/dashboard/automation/workflows', icon: Workflow },
      { name: 'Séquences', href: '/dashboard/automation/sequences', icon: Zap },
    ],
  },
  {
    name: 'Rapports',
    icon: BarChart3,
    disabled: true,
    subItems: [
      { name: 'Analytics', href: '/dashboard/reports/analytics', icon: BarChart3 },
      { name: 'Tableaux de bord', href: '/dashboard/reports/dashboards', icon: LayoutDashboard },
    ],
  },
  {
    name: 'Mes applications',
    icon: AppWindow,
    subItems: [
      { name: 'Payfit', href: 'https://app.payfit.fr', icon: ExternalLink, isExternal: true },
      { name: 'Alan', href: 'https://alan.com/app', icon: ExternalLink, isExternal: true },
    ],
  },
  {
    name: 'Formation',
    icon: GraduationCap,
    subItems: [
      { name: 'Mes formations', href: '/dashboard/formations', icon: GraduationCap },
      { name: 'Gestion formations', href: '/dashboard/admin/formations', icon: BookOpen, adminOnly: true },
    ],
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['Dashboard', 'CRM', 'Ventes']);

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryName)
        ? prev.filter(name => name !== categoryName)
        : [...prev, categoryName]
    );
  };

  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user) {
      setUserEmail(session.user.email || 'user@digiweb.fr');
    }
  }, [status, session, router]);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  // Show loading state while checking auth
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar - Desktop */}
      <aside className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-300 ${
        sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'
      }`}>
        <div className="flex flex-col flex-grow gradient-sidebar border-r border-blue-900/30 pt-5 pb-4 overflow-hidden shadow-light-lg">
          {/* Logo & Collapse Button */}
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} flex-shrink-0 px-4 mb-6`}>
            {sidebarCollapsed ? (
              <button
                onClick={() => setSidebarCollapsed(false)}
                className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center hover:from-blue-500 hover:to-blue-700 transition-all"
                title="Étendre la navigation"
              >
                <span className="text-white font-bold text-base">DW</span>
              </button>
            ) : (
              <>
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-base">DW</span>
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-lg font-bold text-white truncate">DigiWeb</h1>
                    <p className="text-xs text-blue-200">ERP Business</p>
                  </div>
                </div>
                <button
                  onClick={() => setSidebarCollapsed(true)}
                  className="p-1.5 rounded-lg hover:bg-blue-800/50 text-blue-100 transition-colors flex-shrink-0"
                  title="Réduire"
                >
                  <PanelLeftClose className="h-5 w-5" />
                </button>
              </>
            )}
          </div>

          {/* Navigation */}
          <nav className={`flex-1 overflow-y-auto ${sidebarCollapsed ? 'px-2 space-y-1' : 'px-3 space-y-0.5'}`}>
            {navigationCategories.map((category) => {
              const CategoryIcon = category.icon;
              const isExpanded = expandedCategories.includes(category.name);
              const isDashboard = category.name === 'Dashboard';
              const isDashboardActive = isDashboard && pathname === '/dashboard';

              return (
                <div key={category.name}>
                  {/* Category Header */}
                  <button
                    onClick={() => {
                      if (category.disabled) return;
                      if (isDashboard) {
                        router.push('/dashboard');
                      } else {
                        if (sidebarCollapsed) {
                          setSidebarCollapsed(false);
                          setTimeout(() => toggleCategory(category.name), 100);
                        } else {
                          toggleCategory(category.name);
                        }
                      }
                    }}
                    disabled={category.disabled}
                    className={`w-full group flex items-center justify-center ${sidebarCollapsed ? 'px-0 py-3' : 'justify-between px-3 py-2.5'} text-sm font-medium rounded-lg transition-all ${
                      category.disabled
                        ? 'text-blue-300/50 cursor-not-allowed opacity-50'
                        : isDashboardActive
                        ? 'bg-blue-700/50 text-white'
                        : 'text-blue-100 hover:bg-blue-800/50'
                    }`}
                    title={sidebarCollapsed ? category.name : ''}
                  >
                    {sidebarCollapsed ? (
                      <CategoryIcon className={`h-6 w-6 ${category.disabled ? 'text-blue-300/50' : isDashboardActive ? 'text-white' : 'text-blue-200'}`} />
                    ) : (
                      <>
                        <div className="flex items-center">
                          <CategoryIcon className={`h-5 w-5 mr-3 ${category.disabled ? 'text-blue-300/50' : isDashboardActive ? 'text-white' : 'text-blue-200'}`} />
                          <span>{category.name}</span>
                        </div>
                        {!isDashboard && category.subItems.length > 0 && !category.disabled && (
                          isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-blue-200" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-blue-200" />
                          )
                        )}
                      </>
                    )}
                  </button>

                  {/* Sub Items */}
                  {!sidebarCollapsed && isExpanded && category.subItems.length > 0 && !category.disabled && (
                    <div className="ml-4 mt-1 space-y-0.5">
                      {category.subItems.map((subItem) => {
                        const SubIcon = subItem.icon;
                        const isActive = !subItem.isExternal && pathname === subItem.href;
                        const shouldHide = subItem.adminOnly && session?.user?.role !== 'ADMIN';

                        if (shouldHide) return null;

                        return (
                          <button
                            key={subItem.href}
                            onClick={() => {
                              if (subItem.disabled) return;
                              if (subItem.isExternal) {
                                window.open(subItem.href, '_blank');
                              } else {
                                router.push(subItem.href);
                              }
                            }}
                            disabled={subItem.disabled}
                            className={`w-full group flex items-center px-3 py-2 text-sm rounded-lg transition-all ${
                              subItem.disabled
                                ? 'text-blue-300/50 cursor-not-allowed opacity-50'
                                : isActive
                                ? 'bg-blue-700/50 text-white font-medium'
                                : 'text-blue-100 hover:bg-blue-800/50'
                            }`}
                          >
                            <SubIcon className={`mr-3 h-4 w-4 ${subItem.disabled ? 'text-blue-300/50' : isActive ? 'text-white' : 'text-blue-300'}`} />
                            {subItem.name}
                            {subItem.isExternal && <ExternalLink className="ml-auto h-3 w-3 text-blue-300" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Settings at the bottom */}
            <div className="pt-4 mt-4 border-t border-blue-800/50">
              <button
                onClick={() => {
                  if (session?.user?.role === 'VENTE') return;
                  router.push('/dashboard/settings');
                }}
                disabled={session?.user?.role === 'VENTE'}
                className={`w-full group flex items-center justify-center ${sidebarCollapsed ? 'px-0 py-3' : 'px-3 py-2.5'} text-sm font-medium rounded-lg transition-all ${
                  session?.user?.role === 'VENTE'
                    ? 'text-blue-300/50 cursor-not-allowed opacity-50'
                    : pathname === '/dashboard/settings'
                    ? 'bg-blue-700/50 text-white'
                    : 'text-blue-100 hover:bg-blue-800/50'
                }`}
                title={sidebarCollapsed ? (session?.user?.role === 'VENTE' ? 'Accès réservé aux administrateurs' : 'Paramètres') : ''}
              >
                {sidebarCollapsed ? (
                  <Settings className={`h-6 w-6 ${session?.user?.role === 'VENTE' ? 'text-blue-300/50' : 'text-blue-200'}`} />
                ) : (
                  <>
                    <Settings className={`h-5 w-5 mr-3 ${session?.user?.role === 'VENTE' ? 'text-blue-300/50' : 'text-blue-200'}`} />
                    Paramètres
                  </>
                )}
              </button>
            </div>
          </nav>

          {/* User Section */}
          <div className="flex-shrink-0 flex border-t border-blue-800/50 p-4 bg-blue-900/30">
            {sidebarCollapsed ? (
              <div className="w-full flex justify-center">
                <button
                  onClick={handleLogout}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center hover:from-blue-500 hover:to-blue-700 transition-all"
                  title="Déconnexion"
                >
                  <LogOut className="h-5 w-5 text-white" />
                </button>
              </div>
            ) : (
              <div className="flex items-center w-full">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                    <span className="text-white font-semibold text-xs">
                      {userEmail.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{userEmail}</p>
                  <p className="text-xs text-blue-200">Admin</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="ml-2 p-1.5 text-blue-200 hover:text-white transition"
                  title="Déconnexion"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 flex flex-col w-64 gradient-sidebar z-50 shadow-light-lg">
            <div className="flex items-center justify-between px-6 py-5 border-b border-blue-800/50">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-base">DW</span>
                </div>
                <h1 className="text-lg font-bold text-white">DigiWeb</h1>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-blue-200 hover:text-white transition">
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
              {navigationCategories.map((category) => {
                const CategoryIcon = category.icon;
                const isExpanded = expandedCategories.includes(category.name);
                const isDashboard = category.name === 'Dashboard';
                const isDashboardActive = isDashboard && pathname === '/dashboard';

                return (
                  <div key={category.name}>
                    <button
                      onClick={() => {
                        if (category.disabled) return;
                        if (isDashboard) {
                          router.push('/dashboard');
                          setSidebarOpen(false);
                        } else {
                          toggleCategory(category.name);
                        }
                      }}
                      disabled={category.disabled}
                      className={`w-full group flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${
                        category.disabled
                          ? 'text-blue-300/50 cursor-not-allowed opacity-50'
                          : isDashboardActive
                          ? 'bg-blue-700/50 text-white'
                          : 'text-blue-100 hover:bg-blue-800/50'
                      }`}
                    >
                      <div className="flex items-center">
                        <CategoryIcon className={`mr-3 h-5 w-5 ${category.disabled ? 'text-blue-300/50' : isDashboardActive ? 'text-white' : 'text-blue-200'}`} />
                        <span>{category.name}</span>
                      </div>
                      {!isDashboard && category.subItems.length > 0 && !category.disabled && (
                        isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-blue-200" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-blue-200" />
                        )
                      )}
                    </button>

                    {isExpanded && category.subItems.length > 0 && !category.disabled && (
                      <div className="ml-4 mt-1 space-y-0.5">
                        {category.subItems.map((subItem) => {
                          const SubIcon = subItem.icon;
                          const isActive = !subItem.isExternal && pathname === subItem.href;
                          const shouldHide = subItem.adminOnly && session?.user?.role !== 'ADMIN';

                          if (shouldHide) return null;

                          return (
                            <button
                              key={subItem.href}
                              onClick={() => {
                                if (subItem.disabled) return;
                                if (subItem.isExternal) {
                                  window.open(subItem.href, '_blank');
                                } else {
                                  router.push(subItem.href);
                                  setSidebarOpen(false);
                                }
                              }}
                              disabled={subItem.disabled}
                              className={`w-full group flex items-center px-3 py-2 text-sm rounded-lg transition-all ${
                                subItem.disabled
                                  ? 'text-blue-300/50 cursor-not-allowed opacity-50'
                                  : isActive
                                  ? 'bg-blue-700/50 text-white font-medium'
                                  : 'text-blue-100 hover:bg-blue-800/50'
                              }`}
                            >
                              <SubIcon className={`mr-3 h-4 w-4 ${subItem.disabled ? 'text-blue-300/50' : isActive ? 'text-white' : 'text-blue-300'}`} />
                              {subItem.name}
                              {subItem.isExternal && <ExternalLink className="ml-auto h-3 w-3 text-blue-300" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Settings */}
              <div className="pt-4 mt-4 border-t border-blue-800/50">
                <button
                  onClick={() => {
                    if (session?.user?.role === 'VENTE') return;
                    router.push('/dashboard/settings');
                    setSidebarOpen(false);
                  }}
                  disabled={session?.user?.role === 'VENTE'}
                  className={`w-full group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${
                    session?.user?.role === 'VENTE'
                      ? 'text-blue-300/50 cursor-not-allowed opacity-50'
                      : pathname === '/dashboard/settings'
                      ? 'bg-blue-700/50 text-white'
                      : 'text-blue-100 hover:bg-blue-800/50'
                  }`}
                >
                  <Settings className={`mr-3 h-5 w-5 ${session?.user?.role === 'VENTE' ? 'text-blue-300/50' : 'text-blue-200'}`} />
                  Paramètres
                </button>
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={`flex flex-col flex-1 transition-all duration-300 ${
        sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
      }`}>
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex-shrink-0 flex h-14 bg-white border-b border-gray-200 shadow-sm">
          <button
            className="px-4 border-r border-gray-200 text-gray-500 hover:text-gray-700 focus:outline-none lg:hidden transition"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex-1 px-4 flex justify-end items-center">
            {/* Right section */}
            <div className="flex items-center space-x-2">
              {/* Notifications */}
              <NotificationDropdown />

              {/* Avatar */}
              <div className="hidden sm:block">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center cursor-pointer">
                  <span className="text-white font-semibold text-xs">
                    {userEmail.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Motivation Banner */}
        <MotivationBanner />

        {/* Page Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
