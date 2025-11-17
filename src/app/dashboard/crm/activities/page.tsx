'use client';

import { useState } from 'react';
import {
  Calendar,
  Plus,
  Search,
  Filter,
  Clock,
  Phone,
  Mail,
  MessageSquare,
  Video,
  CheckCircle2,
  User,
  Building2,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { useActivities, useActivityMutations } from '@/hooks/useActivities';
import { useContacts } from '@/hooks/useContacts';
import { useDeals } from '@/hooks/useDeals';
import Modal from '@/components/Modal';

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'APPEL': return Phone;
    case 'REUNION': return Calendar;
    case 'EMAIL': return Mail;
    case 'VISIO': return Video;
    default: return MessageSquare;
  }
};

const getActivityColor = (type: string) => {
  switch (type) {
    case 'APPEL': return 'bg-blue-100 text-blue-600';
    case 'REUNION': return 'bg-orange-100 text-orange-600';
    case 'EMAIL': return 'bg-purple-100 text-purple-600';
    case 'VISIO': return 'bg-green-100 text-green-600';
    default: return 'bg-gray-100 text-gray-600';
  }
};

export default function ActivitiesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'APPEL' as 'APPEL' | 'EMAIL' | 'REUNION' | 'VISIO',
    scheduledAt: '',
    scheduledTime: '',
    duration: '',
    priority: 'MOYENNE' as 'HAUTE' | 'MOYENNE' | 'BASSE',
    contactId: '',
    dealId: '',
  });

  // Utiliser le hook useActivities pour récupérer les données depuis l'API
  const { activities, stats, isLoading, isError, mutate } = useActivities({
    search: searchQuery || undefined,
    type: selectedType !== 'all' ? selectedType.toUpperCase() : undefined,
    status: selectedStatus !== 'all' ? selectedStatus.toUpperCase() : undefined,
  });

  // Hook de mutations
  const { createActivity, loading: submitting, error: submitError } = useActivityMutations();

  // Récupérer les contacts et deals pour les dropdowns
  const { contacts } = useContacts({});
  const { deals } = useDeals({});

  // Gestion du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Combiner date et heure
      const scheduledDateTime = `${formData.scheduledAt}T${formData.scheduledTime}:00`;

      await createActivity({
        title: formData.title,
        description: formData.description || null,
        type: formData.type,
        scheduledAt: scheduledDateTime,
        duration: formData.duration ? parseInt(formData.duration) : null,
        priority: formData.priority,
        contactId: formData.contactId || null,
        dealId: formData.dealId || null,
      });
      setIsModalOpen(false);
      setFormData({
        title: '',
        description: '',
        type: 'APPEL',
        scheduledAt: '',
        scheduledTime: '',
        duration: '',
        priority: 'MOYENNE',
        contactId: '',
        dealId: '',
      });
      mutate(); // Revalider les données
    } catch (err) {
      console.error('Erreur création activité:', err);
    }
  };

  // Group activities by date
  const groupedActivities = activities.reduce((acc, activity) => {
    const date = new Date(activity.scheduledAt).toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(activity);
    return acc;
  }, {} as Record<string, typeof activities>);

  const statsDisplay = [
    { label: 'Total Activités', value: stats.total, color: 'text-orange-600' },
    { label: 'Planifiées', value: stats.planifiees, color: 'text-blue-600' },
    { label: 'Terminées', value: stats.completees, color: 'text-green-600' },
    { label: "Aujourd'hui", value: stats.aujourdhui, color: 'text-purple-600' },
  ];

  // État de chargement
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-violet-600 mx-auto" />
          <p className="mt-4 text-gray-600">Chargement des activités...</p>
        </div>
      </div>
    );
  }

  // État d'erreur
  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Erreur lors du chargement des activités</p>
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Calendar className="h-8 w-8 text-orange-600" />
                Activités
              </h1>
              <p className="text-gray-600 mt-1">Gérez votre planning et vos interactions</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-semibold shadow-sm"
            >
              <Plus className="h-5 w-5" />
              Nouvelle Activité
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {statsDisplay.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par titre, contact ou entreprise..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">Tous les types</option>
              <option value="appel">Appels</option>
              <option value="reunion">Réunions</option>
              <option value="email">Emails</option>
              <option value="visio">Visio</option>
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="planifiee">Planifiées</option>
              <option value="completee">Terminées</option>
              <option value="annulee">Annulées</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="h-5 w-5" />
              Filtres
            </button>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-6">
          {Object.entries(groupedActivities).sort().map(([date, activities]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-gray-200" />
                <div className="bg-orange-100 text-orange-600 px-4 py-2 rounded-lg font-semibold text-sm">
                  {new Date(date).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <div className="space-y-3">
                {activities.sort((a, b) => {
                  const timeA = new Date(a.scheduledAt).getTime();
                  const timeB = new Date(b.scheduledAt).getTime();
                  return timeA - timeB;
                }).map((activity) => {
                  const Icon = getActivityIcon(activity.type);
                  const colorClass = getActivityColor(activity.type);

                  return (
                    <div key={activity.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg ${colorClass}`}>
                          <Icon className="h-5 w-5" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 mb-1">{activity.title}</h3>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                {activity.contact && (
                                  <div className="flex items-center gap-1">
                                    <User className="h-4 w-4" />
                                    <span>{activity.contact.firstName} {activity.contact.lastName}</span>
                                  </div>
                                )}
                                {activity.deal && (
                                  <div className="flex items-center gap-1">
                                    <Building2 className="h-4 w-4" />
                                    <span>{activity.deal.title}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                activity.priority === 'HAUTE'
                                  ? 'bg-red-100 text-red-700'
                                  : activity.priority === 'MOYENNE'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {activity.priority}
                              </span>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                activity.status === 'PLANIFIEE'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-green-100 text-green-700'
                              }`}>
                                {activity.status === 'PLANIFIEE' ? (
                                  <Clock className="h-3 w-3 inline mr-1" />
                                ) : (
                                  <CheckCircle2 className="h-3 w-3 inline mr-1" />
                                )}
                                {activity.status}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-6 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span className="font-semibold">
                                {activity.scheduledAt ? new Date(activity.scheduledAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <ChevronRight className="h-5 w-5 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Modal Nouvelle Activité */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Nouvelle Activité"
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Erreur globale */}
            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {submitError}
              </div>
            )}

            {/* Titre */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Titre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Appel de suivi client"
              />
            </div>

            {/* Type et Priorité */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'APPEL' | 'EMAIL' | 'REUNION' | 'VISIO' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="APPEL">Appel</option>
                  <option value="EMAIL">Email</option>
                  <option value="REUNION">Réunion</option>
                  <option value="VISIO">Visio</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Priorité
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'BASSE' | 'MOYENNE' | 'HAUTE' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="BASSE">Basse</option>
                  <option value="MOYENNE">Moyenne</option>
                  <option value="HAUTE">Haute</option>
                </select>
              </div>
            </div>

            {/* Date et Heure */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Heure <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={formData.scheduledTime}
                  onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Durée */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Durée (minutes)
              </label>
              <input
                type="number"
                min="0"
                step="15"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="30"
              />
            </div>

            {/* Contact et Deal */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Contact
                </label>
                <select
                  value={formData.contactId}
                  onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Aucun contact</option>
                  {contacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.firstName} {contact.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Deal associé
                </label>
                <select
                  value={formData.dealId}
                  onChange={(e) => setFormData({ ...formData, dealId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Aucun deal</option>
                  {deals.map((deal) => (
                    <option key={deal.id} value={deal.id}>
                      {deal.title} ({deal.value.toLocaleString()}€)
                    </option>
                  ))}
                </select>
              </div>
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
                placeholder="Notes sur l'activité..."
                rows={3}
              />
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
                  'Créer l\'activité'
                )}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}
