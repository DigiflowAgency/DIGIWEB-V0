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
import { useActivities } from '@/hooks/useActivities';

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

  // Utiliser le hook useActivities pour récupérer les données depuis l'API
  const { activities, stats, isLoading, isError } = useActivities({
    search: searchQuery || undefined,
    type: selectedType !== 'all' ? selectedType.toUpperCase() : undefined,
    status: selectedStatus !== 'all' ? selectedStatus.toUpperCase() : undefined,
  });

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
            <button className="flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-semibold shadow-sm">
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
                {activities.sort((a, b) => a.time.localeCompare(b.time)).map((activity) => {
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
                                <div className="flex items-center gap-1">
                                  <User className="h-4 w-4" />
                                  <span>{activity.contact}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Building2 className="h-4 w-4" />
                                  <span>{activity.company}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                activity.priority === 'High'
                                  ? 'bg-red-100 text-red-700'
                                  : activity.priority === 'Medium'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {activity.priority}
                              </span>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                activity.status === 'Planifié'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-green-100 text-green-700'
                              }`}>
                                {activity.status === 'Planifié' ? (
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
                              <span className="font-semibold">{activity.time}</span>
                            </div>
                            {activity.duration !== '-' && (
                              <div className="flex items-center gap-2">
                                <span>Durée: {activity.duration}</span>
                              </div>
                            )}
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
      </div>
    </div>
  );
}
