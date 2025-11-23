'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { ClipboardCheck, Calendar, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

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
}

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export default function CheckInPage() {
  const { data: session } = useSession();
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentCheckin, setCurrentCheckin] = useState<CheckIn | null>(null);
  const [formData, setFormData] = useState({
    energy: 5,
    motivation: 5,
    mentalClarity: '',
    teamAmbiance: '',
    pride: '',
    difficulties: '',
    vision6Months: '',
    ideas: '',
  });

  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const isAdmin = session?.user?.role === 'ADMIN';

  // Vérifier si on est dans la période du 25 au 30
  const canSubmit = (currentDay >= 25 && currentDay <= 30) || isAdmin;

  const fetchCheckins = useCallback(async () => {
    try {
      const res = await fetch('/api/checkins');
      const data = await res.json();
      setCheckins(data.checkins || []);

      // Vérifier si un check-in existe pour le mois en cours
      const current = data.checkins?.find(
        (c: CheckIn) => c.month === currentMonth && c.year === currentYear
      );
      setCurrentCheckin(current || null);
    } catch (error) {
      console.error('Erreur chargement check-ins:', error);
    } finally {
      setLoading(false);
    }
  }, [currentMonth, currentYear]);

  useEffect(() => {
    fetchCheckins();
  }, [fetchCheckins]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: currentMonth,
          year: currentYear,
          energy: formData.energy,
          motivation: formData.motivation,
          mentalClarity: formData.mentalClarity || null,
          teamAmbiance: formData.teamAmbiance || null,
          pride: formData.pride || null,
          difficulties: formData.difficulties || null,
          vision6Months: formData.vision6Months || null,
          ideas: formData.ideas || null,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || 'Erreur lors de la soumission');
        return;
      }

      alert('✅ Check-in soumis avec succès !');
      await fetchCheckins();

      // Reset form
      setFormData({
        energy: 5,
        motivation: 5,
        mentalClarity: '',
        teamAmbiance: '',
        pride: '',
        difficulties: '',
        vision6Months: '',
        ideas: '',
      });
    } catch (error) {
      console.error('Erreur:', error);
      alert('Une erreur est survenue');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <ClipboardCheck className="h-8 w-8 text-violet-600" />
          Check-in Mensuel
        </h1>
        <p className="text-gray-600 mt-2">
          Partagez votre ressenti et vos retours chaque mois (du 25 au 30)
        </p>
      </div>

      {/* Période de disponibilité */}
      <div className={`mb-8 p-4 rounded-xl border-2 ${
        canSubmit
          ? 'bg-emerald-50 border-emerald-200'
          : 'bg-amber-50 border-amber-200'
      }`}>
        <div className="flex items-start gap-3">
          {canSubmit ? (
            <CheckCircle className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <p className={`font-semibold ${canSubmit ? 'text-emerald-900' : 'text-amber-900'}`}>
              {canSubmit
                ? currentCheckin
                  ? `✅ Vous avez déjà rempli le check-in pour ${MONTH_NAMES[currentMonth - 1]} ${currentYear}`
                  : `📝 Le check-in pour ${MONTH_NAMES[currentMonth - 1]} ${currentYear} est disponible`
                : `⏳ Le check-in sera disponible du 25 au 30 ${MONTH_NAMES[currentMonth - 1]}`
              }
            </p>
            <p className={`text-sm mt-1 ${canSubmit ? 'text-emerald-700' : 'text-amber-700'}`}>
              {canSubmit && !currentCheckin
                ? 'Prenez quelques minutes pour partager votre ressenti'
                : !canSubmit
                ? 'Revenez pendant cette période pour soumettre votre check-in'
                : 'Merci pour votre participation ! Rendez-vous le mois prochain'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Formulaire de check-in */}
      {canSubmit && !currentCheckin && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Calendar className="h-6 w-6 text-violet-600" />
            Check-in {MONTH_NAMES[currentMonth - 1]} {currentYear}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Énergie */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                💪 Énergie (1–10)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.energy}
                  onChange={(e) => setFormData(prev => ({ ...prev, energy: parseInt(e.target.value) }))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-2xl font-bold text-violet-600 w-12 text-center">
                  {formData.energy}
                </span>
              </div>
            </div>

            {/* Motivation */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                🔥 Motivation (1–10)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.motivation}
                  onChange={(e) => setFormData(prev => ({ ...prev, motivation: parseInt(e.target.value) }))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-2xl font-bold text-violet-600 w-12 text-center">
                  {formData.motivation}
                </span>
              </div>
            </div>

            {/* Clarté mentale / stress */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                🧠 Clarté mentale / stress
              </label>
              <textarea
                value={formData.mentalClarity}
                onChange={(e) => setFormData(prev => ({ ...prev, mentalClarity: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                placeholder="Comment vous sentez-vous mentalement ? Niveau de stress ?"
              />
            </div>

            {/* Ambiance équipe */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                🤝 Ambiance équipe
              </label>
              <textarea
                value={formData.teamAmbiance}
                onChange={(e) => setFormData(prev => ({ ...prev, teamAmbiance: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                placeholder="Comment percevez-vous l'ambiance dans l'équipe ?"
              />
            </div>

            {/* Fierté du mois */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                🏆 Fierté du mois
              </label>
              <textarea
                value={formData.pride}
                onChange={(e) => setFormData(prev => ({ ...prev, pride: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                placeholder="De quoi êtes-vous le plus fier ce mois-ci ?"
              />
            </div>

            {/* Difficultés */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                ⚠ Difficultés
              </label>
              <textarea
                value={formData.difficulties}
                onChange={(e) => setFormData(prev => ({ ...prev, difficulties: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                placeholder="Quelles difficultés avez-vous rencontrées ?"
              />
            </div>

            {/* Vision à 6 mois */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                🚀 Vision à 6 mois
              </label>
              <textarea
                value={formData.vision6Months}
                onChange={(e) => setFormData(prev => ({ ...prev, vision6Months: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                placeholder="Où vous voyez-vous dans 6 mois ?"
              />
            </div>

            {/* Idées / suggestions */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                💬 Idées / suggestions
              </label>
              <textarea
                value={formData.ideas}
                onChange={(e) => setFormData(prev => ({ ...prev, ideas: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                placeholder="Avez-vous des idées ou suggestions pour améliorer l'entreprise ?"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full px-6 py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg hover:from-violet-700 hover:to-purple-700 transition-all font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Envoi en cours...' : '✅ Soumettre mon check-in'}
            </button>
          </form>
        </div>
      )}

      {/* Historique */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-gray-600" />
          Historique de mes check-ins
        </h2>

        {checkins.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <ClipboardCheck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucun check-in pour le moment</p>
          </div>
        ) : (
          <div className="space-y-4">
            {checkins.map((checkin) => (
              <CheckInCard key={checkin.id} checkin={checkin} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CheckInCard({ checkin }: { checkin: CheckIn }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="bg-violet-100 rounded-full p-3">
            <Calendar className="h-6 w-6 text-violet-600" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">
              Check-in {MONTH_NAMES[checkin.month - 1]} {checkin.year}
            </h3>
            <p className="text-sm text-gray-500">
              Soumis le {new Date(checkin.submittedAt).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-sm text-gray-500">Énergie</p>
            <p className="text-lg font-bold text-violet-600">{checkin.energy}/10</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Motivation</p>
            <p className="text-lg font-bold text-violet-600">{checkin.motivation}/10</p>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-200 p-6 bg-gray-50 space-y-4">
          {checkin.mentalClarity && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">🧠 Clarté mentale / stress</p>
              <p className="text-gray-600">{checkin.mentalClarity}</p>
            </div>
          )}
          {checkin.teamAmbiance && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">🤝 Ambiance équipe</p>
              <p className="text-gray-600">{checkin.teamAmbiance}</p>
            </div>
          )}
          {checkin.pride && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">🏆 Fierté du mois</p>
              <p className="text-gray-600">{checkin.pride}</p>
            </div>
          )}
          {checkin.difficulties && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">⚠ Difficultés</p>
              <p className="text-gray-600">{checkin.difficulties}</p>
            </div>
          )}
          {checkin.vision6Months && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">🚀 Vision à 6 mois</p>
              <p className="text-gray-600">{checkin.vision6Months}</p>
            </div>
          )}
          {checkin.ideas && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">💬 Idées / suggestions</p>
              <p className="text-gray-600">{checkin.ideas}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
