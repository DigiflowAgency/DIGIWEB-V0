'use client';

import { useState } from 'react';
import { Send, Plus, Search, Play, Pause, Edit, Mail, Clock, Loader2 } from 'lucide-react';
import { useSequences, useSequenceMutations } from '@/hooks/useSequences';
import Modal from '@/components/Modal';

export default function SequencesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'ACTIVE' as 'ACTIVE' | 'PAUSE',
  });

  // Utiliser le hook useSequences pour récupérer les données depuis l'API
  const { sequences, stats, isLoading, isError, mutate } = useSequences({
    search: searchQuery || undefined,
  });

  const { updateSequenceStatus, createSequence, loading: submitting, error: submitError } = useSequenceMutations();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleToggleStatus = async (sequence: any) => {
    try {
      const newStatus = sequence.status === 'ACTIVE' ? 'PAUSE' : 'ACTIVE';
      await updateSequenceStatus(sequence.id, newStatus);
      mutate();
    } catch (err) {
      console.error('Erreur changement statut:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createSequence({
        name: formData.name,
        description: formData.description || undefined,
        status: formData.status,
      });
      setIsModalOpen(false);
      setFormData({
        name: '',
        description: '',
        status: 'ACTIVE',
      });
      mutate();
    } catch (err) {
      console.error('Erreur création séquence:', err);
    }
  };

  // État de chargement
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange-600 mx-auto" />
          <p className="mt-4 text-gray-600">Chargement des séquences...</p>
        </div>
      </div>
    );
  }

  // État d'erreur
  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Erreur lors du chargement des séquences</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 btn-primary"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const statsDisplay = [
    { label: 'Total Séquences', value: stats.total, color: 'text-orange-600' },
    { label: 'Contacts Inscrits', value: stats.totalEnrolled.toLocaleString(), color: 'text-blue-600' },
    { label: 'Taux Ouverture', value: `${stats.avgOpenRate}%`, color: 'text-green-600' },
    { label: 'Taux Réponse', value: `${stats.avgReplyRate}%`, color: 'text-purple-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Send className="h-8 w-8 text-orange-600" />
                Séquences Email
              </h1>
              <p className="text-gray-600 mt-1">Automatisez vos campagnes email</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-semibold shadow-sm"
            >
              <Plus className="h-5 w-5" />
              Nouvelle Séquence
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {statsDisplay.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une séquence..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sequences.map((sequence) => (
            <div key={sequence.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{sequence.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span>{sequence.emailsCount} emails</span>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  sequence.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {sequence.status === 'ACTIVE' ? 'Actif' : sequence.status === 'PAUSE' ? 'Pause' : 'Archivé'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Inscrits</p>
                  <p className="text-lg font-bold text-blue-600">{sequence.enrolled}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Terminés</p>
                  <p className="text-lg font-bold text-green-600">{sequence.completed}</p>
                </div>
              </div>

              <div className="space-y-2 mb-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Taux d&apos;ouverture</span>
                  <span className="font-semibold text-green-600">{sequence.openRate || 0}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Taux de réponse</span>
                  <span className="font-semibold text-purple-600">{sequence.replyRate || 0}%</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => alert(`Éditer la séquence: ${sequence.name}`)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  <Edit className="h-4 w-4" />
                  Modifier
                </button>
                <button
                  onClick={() => handleToggleStatus(sequence)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  title={sequence.status === 'ACTIVE' ? 'Mettre en pause' : 'Activer'}
                >
                  {sequence.status === 'ACTIVE' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => alert(`Historique de la séquence: ${sequence.name}\nTaux d'ouverture: ${sequence.openRate || 0}%\nTaux de réponse: ${sequence.replyRate || 0}%`)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  title="Voir l'historique"
                >
                  <Clock className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {sequences.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Send className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-2">Aucune séquence trouvée</p>
            <p className="text-gray-500 text-sm">Créez votre première séquence pour automatiser vos campagnes email</p>
          </div>
        )}

        {/* Modal Nouvelle Séquence */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Nouvelle Séquence"
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {submitError}
              </div>
            )}

            {/* Nom */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nom de la séquence <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Campagne de nurturing leads"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Description de la séquence..."
                rows={3}
              />
            </div>

            {/* Statut */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Statut initial
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'PAUSE' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="ACTIVE">Active</option>
                <option value="PAUSE">En pause</option>
              </select>
            </div>

            {/* Boutons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={submitting}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  'Créer la séquence'
                )}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}
