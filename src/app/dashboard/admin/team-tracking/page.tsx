'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { Users, Calendar, TrendingUp, Eye, Filter } from 'lucide-react';

interface CheckIn {
  id: string;
  month: number;
  year: number;
  energy: number;
  motivation: number;
  mentalClarity: string | null;
  teamAmbiance: string | null;
  pride: string | null;
  difficulties: string | null;
  vision6Months: string | null;
  ideas: string | null;
  submittedAt: string;
  users: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export default function TeamTrackingPage() {
  const { data: session, status } = useSession();
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCheckin, setSelectedCheckin] = useState<CheckIn | null>(null);
  const [filterMonth, setFilterMonth] = useState<number>(0);
  const [filterYear, setFilterYear] = useState<number>(0);

  const currentYear = new Date().getFullYear();

  const fetchCheckins = useCallback(async () => {
    try {
      let url = '/api/checkins';
      const params = new URLSearchParams();

      if (filterMonth > 0) params.append('month', filterMonth.toString());
      if (filterYear > 0) params.append('year', filterYear.toString());

      if (params.toString()) url += '?' + params.toString();

      const res = await fetch(url);
      const data = await res.json();
      setCheckins(data.checkins || []);
    } catch (error) {
      console.error('Erreur chargement check-ins:', error);
    } finally {
      setLoading(false);
    }
  }, [filterMonth, filterYear]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      signIn();
    } else if (status === 'authenticated') {
      // Vérifier si l'utilisateur est admin
      if (session?.user?.role !== 'ADMIN') {
        window.location.href = '/dashboard';
      } else {
        fetchCheckins();
      }
    }
  }, [status, session, fetchCheckins]);

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchCheckins();
    }
  }, [filterMonth, filterYear, session, fetchCheckins]);

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (session?.user?.role !== 'ADMIN') {
    return null;
  }

  // Calculer les statistiques globales
  const avgEnergy = checkins.length > 0
    ? checkins.reduce((sum, c) => sum + c.energy, 0) / checkins.length
    : 0;
  const avgMotivation = checkins.length > 0
    ? checkins.reduce((sum, c) => sum + c.motivation, 0) / checkins.length
    : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Users className="h-8 w-8 text-violet-600" />
          Suivi Collaborateur
        </h1>
        <p className="text-gray-600 mt-2">
          Consultez les check-ins mensuels de votre équipe
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-violet-100 text-sm font-medium">Total check-ins</p>
              <p className="text-4xl font-bold mt-2">{checkins.length}</p>
            </div>
            <div className="bg-white/20 rounded-full p-4">
              <Calendar className="h-8 w-8" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Énergie moyenne</p>
              <p className="text-4xl font-bold mt-2">{avgEnergy.toFixed(1)}/10</p>
            </div>
            <div className="bg-white/20 rounded-full p-4">
              <TrendingUp className="h-8 w-8" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-pink-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Motivation moyenne</p>
              <p className="text-4xl font-bold mt-2">{avgMotivation.toFixed(1)}/10</p>
            </div>
            <div className="bg-white/20 rounded-full p-4">
              <TrendingUp className="h-8 w-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-4">
          <Filter className="h-5 w-5 text-gray-500" />
          <div className="flex flex-wrap gap-4 flex-1">
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            >
              <option value="0">Tous les mois</option>
              {MONTH_NAMES.map((name, index) => (
                <option key={index} value={index + 1}>
                  {name}
                </option>
              ))}
            </select>

            <select
              value={filterYear}
              onChange={(e) => setFilterYear(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            >
              <option value="0">Toutes les années</option>
              {[currentYear, currentYear - 1, currentYear - 2].map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>

            {(filterMonth > 0 || filterYear > 0) && (
              <button
                onClick={() => {
                  setFilterMonth(0);
                  setFilterYear(0);
                }}
                className="px-4 py-2 text-violet-600 hover:text-violet-700 font-medium"
              >
                Réinitialiser
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Liste des check-ins */}
      <div>
        {checkins.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucun check-in pour les filtres sélectionnés</p>
          </div>
        ) : (
          <div className="space-y-4">
            {checkins.map((checkin) => (
              <div
                key={checkin.id}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-violet-100 rounded-full w-10 h-10 flex items-center justify-center">
                        <span className="text-violet-700 font-bold text-lg">
                          {checkin.users.firstName.charAt(0)}{checkin.users.lastName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          Check-in {checkin.users.firstName} {checkin.users.lastName} - {MONTH_NAMES[checkin.month - 1]} {checkin.year}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {checkin.users.email} • Soumis le {new Date(checkin.submittedAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Énergie</p>
                      <p className={`text-xl font-bold ${
                        checkin.energy >= 7 ? 'text-emerald-600' : checkin.energy >= 4 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {checkin.energy}/10
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Motivation</p>
                      <p className={`text-xl font-bold ${
                        checkin.motivation >= 7 ? 'text-emerald-600' : checkin.motivation >= 4 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {checkin.motivation}/10
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedCheckin(checkin)}
                      className="ml-4 px-4 py-2 bg-violet-100 text-violet-700 rounded-lg hover:bg-violet-200 transition-colors flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Détails
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal détails */}
      {selectedCheckin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {selectedCheckin.users.firstName} {selectedCheckin.users.lastName}
                </h3>
                <p className="text-gray-500">
                  Check-in {MONTH_NAMES[selectedCheckin.month - 1]} {selectedCheckin.year}
                </p>
              </div>
              <button
                onClick={() => setSelectedCheckin(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-violet-50 rounded-xl p-4">
                  <p className="text-sm text-violet-600 font-medium mb-1">💪 Énergie</p>
                  <p className="text-3xl font-bold text-violet-700">{selectedCheckin.energy}/10</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-4">
                  <p className="text-sm text-emerald-600 font-medium mb-1">🔥 Motivation</p>
                  <p className="text-3xl font-bold text-emerald-700">{selectedCheckin.motivation}/10</p>
                </div>
              </div>

              {selectedCheckin.mentalClarity && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">🧠 Clarté mentale / stress</p>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{selectedCheckin.mentalClarity}</p>
                  </div>
                </div>
              )}

              {selectedCheckin.teamAmbiance && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">🤝 Ambiance équipe</p>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{selectedCheckin.teamAmbiance}</p>
                  </div>
                </div>
              )}

              {selectedCheckin.pride && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">🏆 Fierté du mois</p>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{selectedCheckin.pride}</p>
                  </div>
                </div>
              )}

              {selectedCheckin.difficulties && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">⚠ Difficultés</p>
                  <div className="bg-amber-50 rounded-lg p-4">
                    <p className="text-gray-700">{selectedCheckin.difficulties}</p>
                  </div>
                </div>
              )}

              {selectedCheckin.vision6Months && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">🚀 Vision à 6 mois</p>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{selectedCheckin.vision6Months}</p>
                  </div>
                </div>
              )}

              {selectedCheckin.ideas && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">💬 Idées / suggestions</p>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-gray-700">{selectedCheckin.ideas}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
