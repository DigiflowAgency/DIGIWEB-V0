'use client';

import { useState } from 'react';
import { Ticket, Plus, Search, Filter, Clock, CheckCircle2, AlertCircle, User } from 'lucide-react';

const mockTickets = [
  { id: 'T-001', subject: 'Problème connexion dashboard', client: 'Restaurant Le Gourmet', priority: 'High', status: 'Ouvert', created: '2024-11-18', agent: 'Sophie M.' },
  { id: 'T-002', subject: 'Question sur facturation', client: 'Boutique Mode', priority: 'Medium', status: 'En Cours', created: '2024-11-18', agent: 'Pierre D.' },
  { id: 'T-003', subject: 'Demande modification site', client: 'Cabinet Avocat', priority: 'Low', status: 'Résolu', created: '2024-11-17', agent: 'Marie L.' },
  { id: 'T-004', subject: 'Bug formulaire contact', client: 'Salon Tendance', priority: 'High', status: 'Ouvert', created: '2024-11-18', agent: 'Jean D.' },
  { id: 'T-005', subject: 'Support technique SEO', client: 'Garage Auto Pro', priority: 'Medium', status: 'En Cours', created: '2024-11-17', agent: 'Sophie M.' },
  { id: 'T-006', subject: 'Mise à jour contenu', client: 'Boulangerie Tradition', priority: 'Low', status: 'Résolu', created: '2024-11-16', agent: 'Pierre D.' },
  { id: 'T-007', subject: 'Problème email', client: 'Pharmacie Santé', priority: 'High', status: 'Escaladé', created: '2024-11-18', agent: 'Marie L.' },
  { id: 'T-008', subject: 'Question hébergement', client: 'Fleuriste Jardin', priority: 'Low', status: 'Résolu', created: '2024-11-15', agent: 'Jean D.' },
  { id: 'T-009', subject: 'Formation utilisateur', client: 'Bistrot Gourmand', priority: 'Medium', status: 'En Attente', created: '2024-11-17', agent: 'Sophie M.' },
  { id: 'T-010', subject: 'Optimisation performance', client: 'Librairie Lecture', priority: 'Medium', status: 'En Cours', created: '2024-11-18', agent: 'Pierre D.' },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Ouvert': return 'bg-blue-100 text-blue-700';
    case 'En Cours': return 'bg-yellow-100 text-yellow-700';
    case 'En Attente': return 'bg-purple-100 text-purple-700';
    case 'Escaladé': return 'bg-red-100 text-red-700';
    case 'Résolu': return 'bg-green-100 text-green-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'High': return 'bg-red-100 text-red-700';
    case 'Medium': return 'bg-orange-100 text-orange-700';
    case 'Low': return 'bg-blue-100 text-blue-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

export default function TicketsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const filteredTickets = mockTickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || ticket.status.toLowerCase() === selectedStatus.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const stats = [
    { label: 'Total Tickets', value: mockTickets.length, color: 'text-orange-600', icon: Ticket },
    { label: 'Ouverts', value: mockTickets.filter(t => t.status === 'Ouvert').length, color: 'text-blue-600', icon: Clock },
    { label: 'En Cours', value: mockTickets.filter(t => t.status === 'En Cours').length, color: 'text-yellow-600', icon: AlertCircle },
    { label: 'Résolus', value: mockTickets.filter(t => t.status === 'Résolu').length, color: 'text-green-600', icon: CheckCircle2 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Ticket className="h-8 w-8 text-orange-600" />
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
          {stats.map((stat, index) => {
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
              <option value="en cours">En Cours</option>
              <option value="en attente">En Attente</option>
              <option value="résolu">Résolus</option>
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
              {filteredTickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50 transition-colors cursor-pointer">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-mono text-sm font-semibold text-gray-900">{ticket.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-gray-900">{ticket.subject}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{ticket.client}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(ticket.status)}`}>
                      {ticket.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{ticket.agent}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">{new Date(ticket.created).toLocaleDateString('fr-FR')}</span>
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
