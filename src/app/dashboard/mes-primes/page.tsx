'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import SalesPerformanceDashboard from '@/components/SalesPerformanceDashboard';
import { useDeals } from '@/hooks/useDeals';
import { useActivities } from '@/hooks/useActivities';
import {
  TrendingUp,
  DollarSign,
  Target,
  Calendar,
  Save,
  RefreshCw,
  Filter,
} from 'lucide-react';

export default function MesPrimesPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';

  // États pour le filtre admin
  const [filterMode, setFilterMode] = useState<'mine' | 'all' | 'user'>('mine');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [users, setUsers] = useState<any[]>([]);

  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [yearlyRevenue, setYearlyRevenue] = useState(0);
  const [signatures, setSignatures] = useState(0);
  const [rdvCount, setRdvCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [_currentPerformance, setCurrentPerformance] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  // Charger la liste des utilisateurs (pour les admins)
  useEffect(() => {
    if (isAdmin) {
      fetch('/api/users')
        .then(res => res.json())
        .then(data => {
          if (data.users && Array.isArray(data.users)) {
            setUsers(data.users);
          }
        })
        .catch(err => console.error('Erreur chargement users:', err));
    }
  }, [isAdmin]);

  // Préparer les paramètres pour useDeals
  const dealsParams = useMemo(() => {
    // Utilisateur normal: UNIQUEMENT ses propres deals
    if (!isAdmin) {
      return { ownerId: session?.user?.id };
    }

    // Admin: peut choisir
    if (filterMode === 'all') {
      return { showAll: true };
    } else if (filterMode === 'user' && selectedUserId) {
      return { ownerId: selectedUserId };
    }
    // 'mine' = ses propres deals
    return { ownerId: session?.user?.id };
  }, [isAdmin, filterMode, selectedUserId, session?.user?.id]);

  // Charger les deals et activités
  const { deals } = useDeals(dealsParams);
  const { activities } = useActivities();

  // Calculer automatiquement les données depuis les deals
  useEffect(() => {
    if (!deals || !activities) return;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Calculer le CA mensuel (deals CLOSING ce mois)
    const monthStart = new Date(currentYear, currentMonth, 1);
    const monthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

    const closedDealsThisMonth = deals.filter(d => {
      if (d.stage !== 'CLOSING') return false;
      const dateToCheck = d.closedAt || d.updatedAt;
      if (!dateToCheck) return false;
      const dealDate = new Date(dateToCheck);
      return dealDate >= monthStart && dealDate <= monthEnd;
    });

    const monthlyCA = closedDealsThisMonth.reduce((sum, d) => sum + d.value, 0);
    setMonthlyRevenue(monthlyCA);

    // Calculer le CA annuel (deals CLOSING cette année)
    const yearStart = new Date(currentYear, 0, 1);
    const closedDealsThisYear = deals.filter(d => {
      if (d.stage !== 'CLOSING') return false;
      const dateToCheck = d.closedAt || d.updatedAt;
      if (!dateToCheck) return false;
      const dealDate = new Date(dateToCheck);
      return dealDate >= yearStart && dealDate <= monthEnd;
    });

    const yearlyCA = closedDealsThisYear.reduce((sum, d) => sum + d.value, 0);
    setYearlyRevenue(yearlyCA);

    // Calculer les signatures (deals créés ce mois)
    const newDealsThisMonth = deals.filter(d => {
      const createdDate = new Date(d.createdAt);
      return createdDate >= monthStart && createdDate <= monthEnd;
    });
    setSignatures(newDealsThisMonth.length);

    // Calculer les RDV (activités REUNION/VISIO complétées ce mois)
    const rdvThisMonth = activities.filter(a => {
      if (a.type !== 'REUNION' && a.type !== 'VISIO') return false;
      if (a.status !== 'COMPLETEE') return false;
      const activityDate = new Date(a.scheduledAt);
      return activityDate >= monthStart && activityDate <= monthEnd;
    });
    setRdvCount(rdvThisMonth.length);
  }, [deals, activities]);

  useEffect(() => {
    if (session?.user) {
      fetchCurrentPerformance();
      fetchHistory();
    }
  }, [session]);

  const fetchCurrentPerformance = async () => {
    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      const res = await fetch(`/api/sales-performance?month=${month}&year=${year}`);
      const data = await res.json();

      if (data.performances && data.performances.length > 0) {
        const perf = data.performances[0];
        setCurrentPerformance(perf);
        setMonthlyRevenue(perf.monthlyRevenue);
        setYearlyRevenue(perf.yearlyRevenue);
        setSignatures(perf.signatures);
        setRdvCount(perf.rdvCount);
      }
    } catch (error) {
      console.error('Erreur chargement performances:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/sales-performance');
      const data = await res.json();
      setHistory(data.performances || []);
    } catch (error) {
      console.error('Erreur chargement historique:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      const res = await fetch('/api/sales-performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month,
          year,
          monthlyRevenue,
          yearlyRevenue,
          signatures,
          rdvCount,
        }),
      });

      if (res.ok) {
        alert('Performances sauvegardées avec succès !');
        fetchCurrentPerformance();
      } else {
        throw new Error('Erreur lors de la sauvegarde');
      }
    } catch (_error) {
      alert('Erreur lors de la sauvegarde des performances');
    } finally {
      setSaving(false);
    }
  };

  const currentMonth = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Mes Primes & Objectifs</h1>
            <p className="text-gray-600">
              Suivez vos performances et estimez vos primes en temps réel - {currentMonth}
            </p>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={filterMode}
                onChange={(e) => {
                  setFilterMode(e.target.value as 'mine' | 'all' | 'user');
                  if (e.target.value !== 'user') {
                    setSelectedUserId('');
                  }
                }}
                className="border-0 bg-transparent text-sm font-medium text-gray-700 focus:ring-0 cursor-pointer"
              >
                <option value="mine">Mes deals</option>
                <option value="all">Tous les deals</option>
                <option value="user">Par commercial</option>
              </select>

              {filterMode === 'user' && (
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="border-l border-gray-200 pl-2 bg-transparent text-sm text-gray-700 focus:ring-0 cursor-pointer"
                >
                  <option value="">Sélectionner...</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Formulaire de saisie */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-violet-100 rounded-lg">
            <Target className="h-6 w-6 text-violet-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Données calculées automatiquement</h2>
            <p className="text-sm text-gray-600">Basées sur vos deals et activités du mois</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              CA mensuel (€)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="number"
                value={monthlyRevenue}
                onChange={(e) => setMonthlyRevenue(parseFloat(e.target.value) || 0)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                placeholder="0"
                readOnly
                title="Calculé automatiquement depuis vos deals CLOSING"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              CA annuel cumulé (€)
            </label>
            <div className="relative">
              <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="number"
                value={yearlyRevenue}
                onChange={(e) => setYearlyRevenue(parseFloat(e.target.value) || 0)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                placeholder="0"
                readOnly
                title="Calculé automatiquement depuis vos deals CLOSING de l'année"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Signatures (objectif: 4)
            </label>
            <div className="relative">
              <Target className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="number"
                value={signatures}
                onChange={(e) => setSignatures(parseInt(e.target.value) || 0)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                placeholder="0"
                readOnly
                title="Calculé automatiquement depuis vos nouveaux deals créés ce mois"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              RDV pris (objectif: 20)
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="number"
                value={rdvCount}
                onChange={(e) => setRdvCount(parseInt(e.target.value) || 0)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                placeholder="0"
                readOnly
                title="Calculé automatiquement depuis vos RDV terminés ce mois"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-violet-600 text-white rounded-lg font-semibold flex items-center gap-2 hover:bg-violet-700 disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Sauvegarder
              </>
            )}
          </button>

          <button
            onClick={fetchCurrentPerformance}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold flex items-center gap-2 hover:bg-gray-200"
          >
            <RefreshCw className="h-5 w-5" />
            Actualiser
          </button>
        </div>
      </div>

      {/* Dashboard */}
      <SalesPerformanceDashboard
        monthlyRevenue={monthlyRevenue}
        yearlyRevenue={yearlyRevenue}
        signatures={signatures}
        rdvCount={rdvCount}
      />

      {/* Aide */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-bold text-blue-900 mb-3">ℹ️ Comment ça marche ?</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p><strong>Objectifs mensuels :</strong> 4 signatures + 20 RDV pris</p>
          <p><strong>Commission :</strong> Progressive par tranches (5%, 10%, 15%, 20%)</p>
          <p><strong>Réduction :</strong> -50% si un seul objectif atteint, -100% si aucun</p>
          <p><strong>Booster :</strong> +5% par mois si objectifs atteints (max 3 mois)</p>
          <p><strong>Prime annuelle :</strong> 1% du CA annuel (&lt;500k) ou 2% (&gt;500k)</p>
        </div>
      </div>

      {/* Historique */}
      {history.length > 0 && (
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Historique des Performances</h2>
            <p className="text-sm text-gray-600">Vos performances des derniers mois</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Mois</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">CA Mensuel</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Signatures</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">RDV</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Objectifs</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Commission</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Booster</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Prime Finale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {history.map((perf: any) => {
                  const monthName = new Date(perf.year, perf.month - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
                  return (
                    <tr key={perf.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{monthName}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {perf.monthlyRevenue.toLocaleString('fr-FR')} €
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {perf.signatures} / {perf.signaturesGoal}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {perf.rdvCount} / {perf.rdvGoal}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {perf.objectivesReached ? (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                            ✅ Atteints
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                            ❌ Non atteints
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {perf.monthlyCommission.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                      </td>
                      <td className="px-6 py-4 text-sm text-violet-600 font-semibold">
                        {perf.boosterPercent > 0 ? `+${(perf.boosterPercent * 100).toFixed(0)}%` : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-green-600">
                        {perf.finalMonthlyBonus.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
