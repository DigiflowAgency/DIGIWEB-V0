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
  ChevronRight
} from 'lucide-react';

const mockActivities = [
  { id: 1, type: 'call', title: 'Appel de suivi', contact: 'Pierre Martin', company: 'Restaurant Le Gourmet', date: '2024-11-18', time: '14:00', duration: '30min', status: 'Planifié', priority: 'High' },
  { id: 2, type: 'meeting', title: 'Présentation devis', contact: 'Sophie Dubois', company: 'Boutique Mode Élégance', date: '2024-11-18', time: '16:00', duration: '1h', status: 'Planifié', priority: 'High' },
  { id: 3, type: 'email', title: 'Envoi proposition', contact: 'Jean Dupont', company: 'Cabinet Avocat Dupont', date: '2024-11-18', time: '10:30', duration: '-', status: 'Terminé', priority: 'Medium' },
  { id: 4, type: 'call', title: 'Premier contact', contact: 'Marie Lambert', company: 'Salon Tendance', date: '2024-11-19', time: '09:00', duration: '20min', status: 'Planifié', priority: 'Medium' },
  { id: 5, type: 'video', title: 'Démo produit', contact: 'Thomas Bernard', company: 'Garage Auto Pro', date: '2024-11-19', time: '11:00', duration: '45min', status: 'Planifié', priority: 'High' },
  { id: 6, type: 'meeting', title: 'Signature contrat', contact: 'Emma Rousseau', company: 'Boulangerie Tradition', date: '2024-11-17', time: '15:00', duration: '30min', status: 'Terminé', priority: 'High' },
  { id: 7, type: 'call', title: 'Relance prospect', contact: 'Lucas Petit', company: 'Pharmacie Santé', date: '2024-11-19', time: '14:30', duration: '15min', status: 'Planifié', priority: 'Low' },
  { id: 8, type: 'email', title: 'Follow-up devis', contact: 'Camille Moreau', company: 'Fleuriste Jardin', date: '2024-11-17', time: '11:00', duration: '-', status: 'Terminé', priority: 'Low' },
  { id: 9, type: 'meeting', title: 'Kick-off projet', contact: 'Antoine Leroy', company: 'Bistrot Gourmand', date: '2024-11-20', time: '10:00', duration: '2h', status: 'Planifié', priority: 'High' },
  { id: 10, type: 'call', title: 'Qualification lead', contact: 'Julie Blanc', company: 'Librairie Lecture', date: '2024-11-20', time: '15:00', duration: '20min', status: 'Planifié', priority: 'Medium' },
  { id: 11, type: 'email', title: 'Documentation technique', contact: 'Nicolas Garnier', company: 'Épicerie Bio', date: '2024-11-18', time: '09:00', duration: '-', status: 'Terminé', priority: 'Medium' },
  { id: 12, type: 'video', title: 'Formation utilisateur', contact: 'Isabelle Dupuis', company: 'Studio Yoga Zen', date: '2024-11-21', time: '14:00', duration: '1h', status: 'Planifié', priority: 'Medium' },
  { id: 13, type: 'meeting', title: 'Revue trimestrielle', contact: 'Maxime Fontaine', company: 'Agence Immobilière', date: '2024-11-21', time: '16:00', duration: '1h30', status: 'Planifié', priority: 'High' },
  { id: 14, type: 'call', title: 'Support client', contact: 'Sarah Cohen', company: 'Spa Beauté', date: '2024-11-19', time: '16:30', duration: '15min', status: 'Planifié', priority: 'Low' },
  { id: 15, type: 'email', title: 'Proposition commerciale', contact: 'Olivier Roux', company: 'Traiteur Gourmet', date: '2024-11-20', time: '11:30', duration: '-', status: 'Planifié', priority: 'High' },
];

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'call': return Phone;
    case 'meeting': return Calendar;
    case 'email': return Mail;
    case 'video': return Video;
    default: return MessageSquare;
  }
};

const getActivityColor = (type: string) => {
  switch (type) {
    case 'call': return 'bg-blue-100 text-blue-600';
    case 'meeting': return 'bg-orange-100 text-orange-600';
    case 'email': return 'bg-purple-100 text-purple-600';
    case 'video': return 'bg-green-100 text-green-600';
    default: return 'bg-gray-100 text-gray-600';
  }
};

export default function ActivitiesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const filteredActivities = mockActivities.filter(activity => {
    const matchesSearch = activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         activity.contact.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         activity.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || activity.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || activity.status.toLowerCase() === selectedStatus.toLowerCase();
    return matchesSearch && matchesType && matchesStatus;
  });

  // Group activities by date
  const groupedActivities = filteredActivities.reduce((acc, activity) => {
    if (!acc[activity.date]) {
      acc[activity.date] = [];
    }
    acc[activity.date].push(activity);
    return acc;
  }, {} as Record<string, typeof mockActivities>);

  const stats = [
    { label: 'Total Activités', value: mockActivities.length, color: 'text-orange-600' },
    { label: 'Planifiées', value: mockActivities.filter(a => a.status === 'Planifié').length, color: 'text-blue-600' },
    { label: 'Terminées', value: mockActivities.filter(a => a.status === 'Terminé').length, color: 'text-green-600' },
    { label: "Aujourd'hui", value: mockActivities.filter(a => a.date === '2024-11-18').length, color: 'text-purple-600' },
  ];

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
          {stats.map((stat, index) => (
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
              <option value="call">Appels</option>
              <option value="meeting">Réunions</option>
              <option value="email">Emails</option>
              <option value="video">Visio</option>
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="planifié">Planifiées</option>
              <option value="terminé">Terminées</option>
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
