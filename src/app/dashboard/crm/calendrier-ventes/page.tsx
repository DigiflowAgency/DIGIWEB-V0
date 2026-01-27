'use client';

import { useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useDeals, Deal as HookDeal } from '@/hooks/useDeals';
import DealSidebar from '@/components/deal-sidebar';
import { Deal as SidebarDeal } from '@/components/deal-sidebar/types';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Lock,
  Euro,
  TrendingUp,
  CheckCircle,
} from 'lucide-react';

// Helpers pour le calendrier
const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
  // Retourne le jour de la semaine (0 = Dimanche, 1 = Lundi, etc.)
  // On veut Lundi = 0, donc on ajuste
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
};

const formatMoney = (value: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
};

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

interface CalendarDeal {
  deal: HookDeal;
  type: 'CLOSING' | 'ENCAISSE';
  date: Date;
}

// Helper pour convertir le deal hook vers le format sidebar
const convertToSidebarDeal = (deal: HookDeal): SidebarDeal => {
  return {
    ...deal,
    expectedCloseDate: deal.expectedCloseDate ? deal.expectedCloseDate.toString() : null,
    closedAt: deal.closedAt ? deal.closedAt.toString() : null,
  } as SidebarDeal;
};

export default function CalendrierVentesPage() {
  const { data: session, status } = useSession();
  const { deals, isLoading } = useDeals({ showAll: true });

  // État du calendrier
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  // Filtres
  const [showClosing, setShowClosing] = useState(true);
  const [showEncaisse, setShowEncaisse] = useState(true);

  // Sidebar
  const [selectedDeal, setSelectedDeal] = useState<HookDeal | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Vérification admin
  const isAdmin = session?.user?.role === 'ADMIN';

  // Filtrer et mapper les deals pour le calendrier
  const calendarDeals = useMemo(() => {
    if (!deals) return [];

    const result: CalendarDeal[] = [];

    deals.forEach((deal) => {
      // Deals CLOSING (closés)
      if (deal.stage === 'CLOSING') {
        const dateStr = deal.closedAt || deal.expectedCloseDate;
        if (dateStr) {
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            result.push({ deal, type: 'CLOSING', date });
          }
        }
      }

      // Deals ENCAISSE - utilise encaisseAt (date de passage en ENCAISSE)
      // Fallback sur updatedAt pour les anciens deals sans encaisseAt
      if (deal.productionStage === 'ENCAISSE') {
        const dateStr = deal.encaisseAt || deal.updatedAt;
        if (dateStr) {
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            result.push({ deal, type: 'ENCAISSE', date });
          }
        }
      }
    });

    return result;
  }, [deals]);

  // Deals du mois courant
  const monthDeals = useMemo(() => {
    return calendarDeals.filter((cd) => {
      const inMonth = cd.date.getMonth() === currentMonth && cd.date.getFullYear() === currentYear;
      const typeMatch = (cd.type === 'CLOSING' && showClosing) || (cd.type === 'ENCAISSE' && showEncaisse);
      return inMonth && typeMatch;
    });
  }, [calendarDeals, currentMonth, currentYear, showClosing, showEncaisse]);

  // Stats du mois
  const monthStats = useMemo(() => {
    const closingDeals = monthDeals.filter(cd => cd.type === 'CLOSING');
    const encaisseDeals = monthDeals.filter(cd => cd.type === 'ENCAISSE');

    return {
      closingCount: closingDeals.length,
      encaisseCount: encaisseDeals.length,
      closingValue: closingDeals.reduce((sum, cd) => sum + (cd.deal.value || 0), 0),
      encaisseValue: encaisseDeals.reduce((sum, cd) => sum + (cd.deal.value || 0), 0),
    };
  }, [monthDeals]);

  // Obtenir les deals d'un jour spécifique
  const getDealsForDay = (day: number) => {
    return monthDeals.filter((cd) => cd.date.getDate() === day);
  };

  // Navigation
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

  // Ouvrir le sidebar
  const handleDealClick = (deal: HookDeal) => {
    setSelectedDeal(deal);
    setIsSidebarOpen(true);
  };

  // Grille du calendrier
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);
  const totalCells = Math.ceil((daysInMonth + firstDayOfMonth) / 7) * 7;

  // Loading
  if (status === 'loading' || isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Non-admin : afficher message d'erreur
  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <Lock className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-700 mb-2">Accès refusé</h2>
          <p className="text-red-600">
            Cette page est réservée aux administrateurs.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <CalendarDays className="h-7 w-7 text-violet-600" />
              Calendrier des Ventes
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Vue mensuelle des deals closés et encaissés
            </p>
          </div>

          {/* Navigation du mois */}
          <div className="flex items-center gap-2">
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
            <span className="text-lg font-semibold text-gray-900 min-w-[160px] text-center">
              {MONTHS[currentMonth]} {currentYear}
            </span>
            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats du mois */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-violet-600" />
            <span className="text-sm font-medium text-violet-700">Closés ce mois</span>
          </div>
          <p className="text-2xl font-bold text-violet-900">{monthStats.closingCount}</p>
          <p className="text-sm text-violet-600">{formatMoney(monthStats.closingValue)}</p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-700">Encaissés ce mois</span>
          </div>
          <p className="text-2xl font-bold text-green-900">{monthStats.encaisseCount}</p>
          <p className="text-sm text-green-600">{formatMoney(monthStats.encaisseValue)}</p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Euro className="h-5 w-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Total closé</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatMoney(monthStats.closingValue)}</p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Euro className="h-5 w-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Total encaissé</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatMoney(monthStats.encaisseValue)}</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex items-center gap-4 mb-6">
        <span className="text-sm font-medium text-gray-700">Filtres :</span>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showClosing}
            onChange={(e) => setShowClosing(e.target.checked)}
            className="w-4 h-4 text-violet-600 rounded border-gray-300 focus:ring-violet-500"
          />
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-violet-500 rounded"></span>
            <span className="text-sm text-gray-700">Closés (CLOSING)</span>
          </span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showEncaisse}
            onChange={(e) => setShowEncaisse(e.target.checked)}
            className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
          />
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-green-500 rounded"></span>
            <span className="text-sm text-gray-700">Encaissés</span>
          </span>
        </label>
      </div>

      {/* Calendrier */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* En-tête des jours */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {DAYS.map((day) => (
            <div
              key={day}
              className="py-3 text-center text-sm font-semibold text-gray-600"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Grille des jours */}
        <div className="grid grid-cols-7">
          {Array.from({ length: totalCells }).map((_, index) => {
            const dayNumber = index - firstDayOfMonth + 1;
            const isCurrentMonth = dayNumber > 0 && dayNumber <= daysInMonth;
            const isToday =
              isCurrentMonth &&
              dayNumber === today.getDate() &&
              currentMonth === today.getMonth() &&
              currentYear === today.getFullYear();

            const dayDeals = isCurrentMonth ? getDealsForDay(dayNumber) : [];

            return (
              <div
                key={index}
                className={`min-h-[120px] border-b border-r border-gray-200 p-2 ${
                  !isCurrentMonth ? 'bg-gray-50' : ''
                } ${isToday ? 'bg-violet-50' : ''}`}
              >
                {isCurrentMonth && (
                  <>
                    <div className={`text-sm font-medium mb-1 ${
                      isToday ? 'text-violet-600' : 'text-gray-700'
                    }`}>
                      {isToday ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-violet-600 text-white rounded-full text-xs">
                          {dayNumber}
                        </span>
                      ) : (
                        dayNumber
                      )}
                    </div>
                    <div className="space-y-1 max-h-[80px] overflow-y-auto">
                      {dayDeals.map((cd, idx) => (
                        <div
                          key={`${cd.deal.id}-${idx}`}
                          onClick={() => handleDealClick(cd.deal)}
                          className={`
                            px-2 py-1 rounded text-xs truncate cursor-pointer transition-all hover:shadow-md
                            ${cd.type === 'CLOSING'
                              ? 'bg-violet-100 border-l-2 border-violet-500 text-violet-700 hover:bg-violet-200'
                              : 'bg-green-100 border-l-2 border-green-500 text-green-700 hover:bg-green-200'
                            }
                          `}
                          title={`${cd.deal.companies?.name || cd.deal.title} - ${formatMoney(cd.deal.value)}`}
                        >
                          <div className="font-medium truncate">
                            {cd.deal.companies?.name || cd.deal.title}
                          </div>
                          <div className="text-[10px] opacity-75">
                            {formatMoney(cd.deal.value)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Légende */}
      <div className="mt-4 flex items-center gap-6 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 bg-violet-100 border-l-2 border-violet-500 rounded"></span>
          <span>Deal Closé (CLOSING)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 bg-green-100 border-l-2 border-green-500 rounded"></span>
          <span>Deal Encaissé</span>
        </div>
      </div>

      {/* DealSidebar */}
      {selectedDeal && (
        <DealSidebar
          deal={convertToSidebarDeal(selectedDeal)}
          isOpen={isSidebarOpen}
          onClose={() => {
            setIsSidebarOpen(false);
            setSelectedDeal(null);
          }}
          onUpdate={() => {
            // Les données se rafraîchissent automatiquement via SWR
          }}
        />
      )}
    </div>
  );
}
