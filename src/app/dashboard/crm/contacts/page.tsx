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
  Star
} from 'lucide-react';

const mockContacts = [
  { id: 1, name: 'Pierre Martin', email: 'pierre.martin@restaurant.fr', phone: '+33 6 12 34 56 78', company: 'Restaurant Le Gourmet', position: 'Propriétaire', city: 'Paris', status: 'Active', score: 95 },
  { id: 2, name: 'Sophie Dubois', email: 'sophie@boutique.com', phone: '+33 6 23 45 67 89', company: 'Boutique Mode Élégance', position: 'Directrice', city: 'Lyon', status: 'Active', score: 88 },
  { id: 3, name: 'Jean Dupont', email: 'jean.dupont@avocat.fr', phone: '+33 6 34 56 78 90', company: 'Cabinet Avocat Dupont', position: 'Avocat', city: 'Marseille', status: 'Active', score: 82 },
  { id: 4, name: 'Marie Lambert', email: 'marie@coiffure.fr', phone: '+33 6 45 67 89 01', company: 'Salon Tendance', position: 'Gérante', city: 'Toulouse', status: 'Active', score: 76 },
  { id: 5, name: 'Thomas Bernard', email: 'thomas@garage.com', phone: '+33 6 56 78 90 12', company: 'Garage Auto Pro', position: 'Directeur', city: 'Nice', status: 'Active', score: 70 },
  { id: 6, name: 'Emma Rousseau', email: 'emma@boulangerie.fr', phone: '+33 6 67 89 01 23', company: 'Boulangerie Tradition', position: 'Propriétaire', city: 'Nantes', status: 'Active', score: 65 },
  { id: 7, name: 'Lucas Petit', email: 'lucas@pharmacie.fr', phone: '+33 6 78 90 12 34', company: 'Pharmacie Santé', position: 'Pharmacien', city: 'Strasbourg', status: 'Active', score: 58 },
  { id: 8, name: 'Camille Moreau', email: 'camille@fleuriste.com', phone: '+33 6 89 01 23 45', company: 'Fleuriste Jardin', position: 'Fleuriste', city: 'Bordeaux', status: 'Inactive', score: 45 },
  { id: 9, name: 'Antoine Leroy', email: 'antoine@restaurant.com', phone: '+33 6 90 12 34 56', company: 'Bistrot Gourmand', position: 'Chef', city: 'Lille', status: 'Active', score: 52 },
  { id: 10, name: 'Julie Blanc', email: 'julie@librairie.fr', phone: '+33 6 01 23 45 67', company: 'Librairie Lecture', position: 'Libraire', city: 'Rennes', status: 'Active', score: 48 },
  { id: 11, name: 'Nicolas Garnier', email: 'nicolas@epicerie.fr', phone: '+33 6 12 34 56 78', company: 'Épicerie Bio', position: 'Gérant', city: 'Montpellier', status: 'Active', score: 62 },
  { id: 12, name: 'Isabelle Dupuis', email: 'isabelle@yoga.com', phone: '+33 6 23 45 67 89', company: 'Studio Yoga Zen', position: 'Professeur', city: 'Toulouse', status: 'Active', score: 71 },
  { id: 13, name: 'Maxime Fontaine', email: 'maxime@agence.fr', phone: '+33 6 34 56 78 90', company: 'Agence Immobilière', position: 'Agent', city: 'Paris', status: 'Active', score: 80 },
  { id: 14, name: 'Sarah Cohen', email: 'sarah@spa.com', phone: '+33 6 45 67 89 01', company: 'Spa Beauté', position: 'Esthéticienne', city: 'Cannes', status: 'Active', score: 73 },
  { id: 15, name: 'Olivier Roux', email: 'olivier@traiteur.fr', phone: '+33 6 56 78 90 12', company: 'Traiteur Gourmet', position: 'Chef', city: 'Lyon', status: 'Active', score: 67 },
];

export default function ContactsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const filteredContacts = mockContacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         contact.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || contact.status.toLowerCase() === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = [
    { label: 'Total Contacts', value: mockContacts.length, color: 'text-orange-600' },
    { label: 'Actifs', value: mockContacts.filter(c => c.status === 'Active').length, color: 'text-green-600' },
    { label: 'Inactifs', value: mockContacts.filter(c => c.status === 'Inactive').length, color: 'text-gray-600' },
    { label: 'Score Moyen', value: Math.round(mockContacts.reduce((acc, c) => acc + c.score, 0) / mockContacts.length), color: 'text-blue-600' },
  ];

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
                {filteredContacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                          <span className="text-orange-600 font-semibold">
                            {contact.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{contact.name}</p>
                          <p className="text-sm text-gray-500">{contact.position}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="h-4 w-4" />
                          {contact.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="h-4 w-4" />
                          {contact.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{contact.company}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{contact.city}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="font-semibold text-gray-900">{contact.score}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        contact.status === 'Active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
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
            Affichage de {filteredContacts.length} sur {mockContacts.length} contacts
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
