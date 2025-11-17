'use client';

import { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  Mail,
  Phone,
  Building2,
  MapPin,
  MoreVertical,
  Edit,
  Trash2,
  Star,
  Loader2
} from 'lucide-react';
import { useContacts } from '@/hooks/useContacts';

export default function ContactsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Utiliser le hook useContacts pour récupérer les données depuis l'API
  const { contacts, stats, isLoading, isError } = useContacts({
    search: searchQuery || undefined,
    status: selectedStatus !== 'all' ? selectedStatus.toUpperCase() : undefined,
  });

  const statsDisplay = [
    { label: 'Total Contacts', value: stats.total, color: 'text-orange-600' },
    { label: 'Actifs', value: stats.active, color: 'text-green-600' },
    { label: 'Leads', value: stats.leads, color: 'text-blue-600' },
    { label: 'Score Moyen', value: contacts.length > 0 ? Math.round(contacts.reduce((acc, c) => acc + (c.qualityScore || 0), 0) / contacts.length) : 0, color: 'text-violet-600' },
  ];

  // État de chargement
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-violet-600 mx-auto" />
          <p className="mt-4 text-gray-600">Chargement des contacts...</p>
        </div>
      </div>
    );
  }

  // État d'erreur
  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Erreur lors du chargement des contacts</p>
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
                <Users className="h-8 w-8 text-orange-600" />
                Contacts
              </h1>
              <p className="text-gray-600 mt-1">Gérez tous vos contacts professionnels</p>
            </div>
            <button className="flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-semibold shadow-sm">
              <Plus className="h-5 w-5" />
              Nouveau Contact
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
                placeholder="Rechercher par nom, email, entreprise..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="h-5 w-5" />
              Filtres
            </button>
          </div>
        </div>

        {/* Contacts Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nom</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Entreprise</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Localisation</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {contacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                          <span className="text-orange-600 font-semibold">
                            {contact.firstName[0]}{contact.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{contact.firstName} {contact.lastName}</p>
                          <p className="text-sm text-gray-500">{contact.position || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="h-4 w-4" />
                          {contact.email || '-'}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="h-4 w-4" />
                          {contact.phone || '-'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{contact.company?.name || '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{contact.city || '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="font-semibold text-gray-900">{contact.qualityScore || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        contact.status === 'CLIENT'
                          ? 'bg-green-100 text-green-700'
                          : contact.status === 'PROSPECT'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {contact.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <Edit className="h-4 w-4 text-gray-600" />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <Trash2 className="h-4 w-4 text-gray-600" />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <MoreVertical className="h-4 w-4 text-gray-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Affichage de {contacts.length} sur {stats.total} contacts
          </p>
          <div className="flex gap-2">
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
              Précédent
            </button>
            <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium">
              1
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
              2
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
              Suivant
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
