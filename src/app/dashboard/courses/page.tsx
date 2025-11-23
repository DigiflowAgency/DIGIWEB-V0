'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Trophy,
  Plus,
  X,
  Calendar,
  Users,
  Target,
  Phone,
  Mail,
  Video,
  Activity,
  Euro,
  Award,
  Medal,
  Crown,
  RefreshCcw,
  Edit2,
  Trash2,
  Loader2,
} from 'lucide-react';

interface Race {
  id: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  metric: string;
  prizes: string;
  status: string;
  users: {
    id: string;
    firstName: string;
    lastName: string;
  };
  race_participants: {
    id: string;
    score: number;
    rank: number | null;
    users: {
      id: string;
      firstName: string;
      lastName: string;
      avatar: string | null;
      position: string | null;
    };
  }[];
}

const METRIC_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  CA_ENCAISSE: { label: 'CA encaissé', icon: Euro, color: 'from-green-500 to-emerald-600' },
  DEALS_GAGNES: { label: 'Deals gagnés', icon: Trophy, color: 'from-violet-600 to-purple-700' },
  CONTACTS_CREES: { label: 'Contacts créés', icon: Users, color: 'from-blue-500 to-blue-600' },
  ACTIVITES: { label: 'Activités réalisées', icon: Activity, color: 'from-orange-500 to-orange-600' },
  APPELS: { label: 'Appels', icon: Phone, color: 'from-violet-500 to-violet-600' },
  EMAILS: { label: 'Emails', icon: Mail, color: 'from-blue-400 to-blue-500' },
  REUNIONS: { label: 'Réunions', icon: Video, color: 'from-pink-500 to-pink-600' },
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: 'En cours', color: 'bg-green-100 text-green-700' },
  COMPLETED: { label: 'Terminée', color: 'bg-gray-100 text-gray-700' },
  CANCELLED: { label: 'Annulée', color: 'bg-red-100 text-red-700' },
};

export default function CoursesPage() {
  const { data: session } = useSession();
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [_selectedRace, _setSelectedRace] = useState<Race | null>(null);
  const [refreshingScores, setRefreshingScores] = useState<string | null>(null);

  const isAdmin = session?.user?.role === 'ADMIN';

  useEffect(() => {
    fetchRaces();
  }, []);

  const fetchRaces = async () => {
    try {
      const res = await fetch('/api/races');
      const data = await res.json();
      setRaces(data.races || []);
    } catch (error) {
      console.error('Erreur lors du chargement des courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshScores = async (raceId: string) => {
    setRefreshingScores(raceId);
    try {
      const res = await fetch(`/api/races/${raceId}/refresh-scores`, {
        method: 'POST',
      });
      if (res.ok) {
        await fetchRaces();
      }
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des scores:', error);
    } finally {
      setRefreshingScores(null);
    }
  };

  const deleteRace = async (raceId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette course ?')) return;

    try {
      const res = await fetch(`/api/races/${raceId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchRaces();
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  const getRankIcon = (rank: number | null) => {
    if (!rank) return null;
    if (rank === 1) return <Crown className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Medal className="h-6 w-6 text-orange-600" />;
    return null;
  };

  const getRankBadge = (rank: number | null) => {
    if (!rank) return 'bg-gray-100 text-gray-700';
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white';
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-400 text-white';
    if (rank === 3) return 'bg-gradient-to-r from-orange-400 to-orange-500 text-white';
    return 'bg-gray-100 text-gray-700';
  };

  const formatScore = (score: number, metric: string) => {
    if (metric === 'CA_ENCAISSE') {
      return `${score.toLocaleString()} €`;
    }
    return score.toString();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-mesh py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-700 to-orange-500 bg-clip-text text-transparent flex items-center gap-3">
                <Trophy className="h-10 w-10 text-violet-600" />
                Courses commerciales
              </h1>
              <p className="mt-2 text-gray-600">
                Suivez votre performance et comparez-vous avec vos collègues
              </p>
            </div>
            {isAdmin && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateModal(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Nouvelle course
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Liste des courses */}
        {races.length === 0 ? (
          <div className="card-premium p-12 text-center">
            <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune course pour le moment</h3>
            <p className="text-gray-500">
              {isAdmin ? 'Créez la première course pour motiver votre équipe !' : 'Les courses seront bientôt lancées'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {races.map((race, index) => {
              const metricInfo = METRIC_LABELS[race.metric];
              const statusInfo = STATUS_LABELS[race.status];
              const MetricIcon = metricInfo.icon;
              const prizes = JSON.parse(race.prizes);
              const isActive = race.status === 'ACTIVE';
              const userParticipant = race.race_participants.find(
                (p) => p.users.id === session?.user?.id
              );

              return (
                <motion.div
                  key={race.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="card-premium overflow-hidden"
                >
                  {/* Header de la course */}
                  <div className="px-6 py-5 border-b border-gray-200/50 bg-gradient-to-r from-violet-50 to-orange-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`p-2 rounded-lg bg-gradient-to-br ${metricInfo.color}`}>
                            <MetricIcon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold text-gray-900">{race.name}</h2>
                            <p className="text-sm text-gray-600">{race.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-3">
                          <span className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {new Date(race.startDate).toLocaleDateString('fr-FR')} - {new Date(race.endDate).toLocaleDateString('fr-FR')}
                          </span>
                          <span className="flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            {metricInfo.label}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isActive && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => refreshScores(race.id)}
                            disabled={refreshingScores === race.id}
                            className="p-2 rounded-lg bg-white hover:bg-gray-50 border border-gray-200"
                          >
                            <RefreshCcw className={`h-5 w-5 text-gray-600 ${refreshingScores === race.id ? 'animate-spin' : ''}`} />
                          </motion.button>
                        )}
                        {isAdmin && (
                          <>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="p-2 rounded-lg bg-white hover:bg-gray-50 border border-gray-200"
                            >
                              <Edit2 className="h-5 w-5 text-gray-600" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => deleteRace(race.id)}
                              className="p-2 rounded-lg bg-white hover:bg-red-50 border border-red-200"
                            >
                              <Trash2 className="h-5 w-5 text-red-600" />
                            </motion.button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Gains */}
                    <div className="mt-4 flex items-center gap-3">
                      <Award className="h-5 w-5 text-violet-600" />
                      <span className="font-semibold text-gray-700">Récompenses :</span>
                      {Object.entries(prizes).map(([position, prize]) => (
                        <span key={position} className="px-3 py-1 rounded-full bg-white text-sm font-semibold text-gray-700">
                          {position === '1' && '🥇'} {position === '2' && '🥈'} {position === '3' && '🥉'}
                          {position}er : {String(prize)}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Ma position */}
                  {userParticipant && userParticipant.rank && (
                    <div className="px-6 py-4 bg-gradient-to-r from-violet-100 to-orange-100 border-b border-gray-200/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {getRankIcon(userParticipant.rank)}
                          <div>
                            <p className="text-sm text-gray-600">Votre position</p>
                            <p className="text-2xl font-bold text-gray-900">
                              {userParticipant.rank}{userParticipant.rank === 1 ? 'er' : 'ème'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Votre score</p>
                          <p className="text-2xl font-bold text-violet-700">
                            {formatScore(userParticipant.score, race.metric)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Classement */}
                  <div className="divide-y divide-gray-200/50">
                    {race.race_participants.slice(0, 10).map((participant, idx) => {
                      const isCurrentUser = participant.users.id === session?.user?.id;
                      return (
                        <motion.div
                          key={participant.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className={`px-6 py-4 flex items-center gap-4 ${isCurrentUser ? 'bg-violet-50/50' : 'hover:bg-gray-50'}`}
                        >
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${getRankBadge(participant.rank)}`}>
                            {participant.rank || '-'}
                          </div>
                          <div className="flex items-center gap-3 flex-1">
                            {participant.users.avatar ? (
                              <img
                                src={participant.users.avatar}
                                alt={`${participant.users.firstName} ${participant.users.lastName}`}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-orange-500 flex items-center justify-center text-white font-semibold">
                                {participant.users.firstName[0]}{participant.users.lastName[0]}
                              </div>
                            )}
                            <div className="flex-1">
                              <p className={`font-semibold ${isCurrentUser ? 'text-violet-700' : 'text-gray-900'}`}>
                                {participant.users.firstName} {participant.users.lastName}
                                {isCurrentUser && <span className="ml-2 text-xs font-normal text-violet-600">(Vous)</span>}
                              </p>
                              <p className="text-xs text-gray-500">{participant.users.position || 'Commercial'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-gray-900">
                              {formatScore(participant.score, race.metric)}
                            </p>
                            <p className="text-xs text-gray-500">{metricInfo.label}</p>
                          </div>
                          {getRankIcon(participant.rank) && (
                            <div className="ml-2">
                              {getRankIcon(participant.rank)}
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Modal de création */}
        <CreateRaceModal
          show={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchRaces();
          }}
        />
      </div>
    </div>
  );
}

// Modal de création de course
interface CreateRaceModalProps {
  show: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function CreateRaceModal({ show, onClose, onSuccess }: CreateRaceModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    metric: 'CA_ENCAISSE',
    prizes: {
      '1': '',
      '2': '',
      '3': '',
    },
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/races', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        onSuccess();
        setFormData({
          name: '',
          description: '',
          startDate: '',
          endDate: '',
          metric: 'CA_ENCAISSE',
          prizes: { '1': '', '2': '', '3': '' },
        });
      }
    } catch (error) {
      console.error('Erreur lors de la création:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-gray-900">Créer une nouvelle course</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Nom de la course *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
              placeholder="Challenge du mois"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field"
              rows={3}
              placeholder="Description de la course"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Date de début *</label>
              <input
                type="datetime-local"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Date de fin *</label>
              <input
                type="datetime-local"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Métrique *</label>
            <select
              value={formData.metric}
              onChange={(e) => setFormData({ ...formData, metric: e.target.value })}
              className="input-field"
            >
              {Object.entries(METRIC_LABELS).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">Récompenses</label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">🥇 1er prix</label>
                <input
                  type="text"
                  value={formData.prizes['1']}
                  onChange={(e) => setFormData({ ...formData, prizes: { ...formData.prizes, '1': e.target.value } })}
                  className="input-field"
                  placeholder="1000€"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">🥈 2ème prix</label>
                <input
                  type="text"
                  value={formData.prizes['2']}
                  onChange={(e) => setFormData({ ...formData, prizes: { ...formData.prizes, '2': e.target.value } })}
                  className="input-field"
                  placeholder="500€"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">🥉 3ème prix</label>
                <input
                  type="text"
                  value={formData.prizes['3']}
                  onChange={(e) => setFormData({ ...formData, prizes: { ...formData.prizes, '3': e.target.value } })}
                  className="input-field"
                  placeholder="250€"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-300 hover:bg-gray-50 font-semibold"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary"
            >
              {loading ? 'Création...' : 'Créer la course'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
