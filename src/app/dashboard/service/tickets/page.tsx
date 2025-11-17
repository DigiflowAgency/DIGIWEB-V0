'use client';

import { useState } from 'react';
import {
  Ticket as TicketIcon,
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  Loader2
} from 'lucide-react';
import { useTickets } from '@/hooks/useTickets';

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'OUVERT': return 'Ouvert';
    case 'EN_COURS': return 'En Cours';
    case 'EN_ATTENTE': return 'En Attente';
    case 'ESCALADE': return 'Escaladé';
    case 'RESOLU': return 'Résolu';
    case 'FERME': return 'Fermé';
    default: return status;
  }
};

const getPriorityLabel = (priority: string) => {
  switch (priority) {
    case 'HAUTE': return 'Haute';
    case 'MOYENNE': return 'Moyenne';
    case 'BASSE': return 'Basse';
    default: return priority;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'OUVERT': return 'bg-blue-100 text-blue-700';
    case 'EN_COURS': return 'bg-yellow-100 text-yellow-700';
    case 'EN_ATTENTE': return 'bg-purple-100 text-purple-700';
    case 'ESCALADE': return 'bg-red-100 text-red-700';
    case 'RESOLU': return 'bg-green-100 text-green-700';
    case 'FERME': return 'bg-gray-100 text-gray-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'HAUTE': return 'bg-red-100 text-red-700';
    case 'MOYENNE': return 'bg-orange-100 text-orange-700';
    case 'BASSE': return 'bg-blue-100 text-blue-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

export default function TicketsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Utiliser le hook useTickets pour récupérer les données depuis l'API
  const { tickets, stats, isLoading, isError } = useTickets({
    search: searchQuery || undefined,
    status: selectedStatus !== 'all' ? selectedStatus.toUpperCase() : undefined,
  });

  // État de chargement
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange-600 mx-auto" />
          <p className="mt-4 text-gray-600">Chargement des tickets...</p>
        </div>
      </div>
    );
  }

  // État d'erreur
  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Erreur lors du chargement des tickets</p>
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
    { label: 'Total Tickets', value: stats.total, color: 'text-orange-600', icon: TicketIcon },
    { label: 'Ouverts', value: stats.ouvert, color: 'text-blue-600', icon: Clock },
    { label: 'En Cours', value: stats.enCours, color: 'text-yellow-600', icon: AlertCircle },
    { label: 'Résolus', value: stats.resolu, color: 'text-green-600', icon: CheckCircle2 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <TicketIcon className="h-8 w-8 text-orange-600" />
                Tickets Support
              </h1>
              <p className="text-gray-600 mt-1">Gérez les demandes de support client</p>
            </div>
            <button className="flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-semibold shadow-sm">
              <Plus className="h-5 w-5" />
              Nouveau Ticket
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {statsDisplay.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </div>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par numéro, sujet ou client..."
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
              <option value="ouvert">Ouverts</option>
              <option value="en_cours">En Cours</option>
              <option value="en_attente">En Attente</option>
              <option value="escalade">Escaladés</option>
              <option value="resolu">Résolus</option>
              <option value="ferme">Fermés</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="h-5 w-5" />
              Filtres
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Sujet</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Client</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Priorité</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Agent</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50 transition-colors cursor-pointer">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-mono text-sm font-semibold text-gray-900">{ticket.number}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-gray-900">{ticket.subject}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{ticket.clientName || '-'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(ticket.priority)}`}>
                      {getPriorityLabel(ticket.priority)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(ticket.status)}`}>
                      {getStatusLabel(ticket.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{ticket.assignedTo?.name || ticket.createdBy.name || 'Non assigné'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">{new Date(ticket.createdAt).toLocaleDateString('fr-FR')}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
