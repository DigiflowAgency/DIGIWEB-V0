'use client';

import { useState } from 'react';
import { Plus, Phone, Mail, MapPin, Euro } from 'lucide-react';

type LeadStatus = 'NOUVEAU' | 'QUALIFIE' | 'RDV' | 'CLOSING' | 'SIGNE';

interface Lead {
  id: number;
  name: string;
  contact: string;
  phone: string;
  email: string;
  city: string;
  activity: string;
  score: number;
  value: string;
  status: LeadStatus;
}

const columns: { id: LeadStatus; title: string; color: string }[] = [
  { id: 'NOUVEAU', title: 'Nouveau', color: 'bg-gray-100 border-gray-300' },
  { id: 'QUALIFIE', title: 'Qualifié', color: 'bg-blue-50 border-blue-300' },
  { id: 'RDV', title: 'RDV Fixé', color: 'bg-violet-50 border-violet-300' },
  { id: 'CLOSING', title: 'Closing', color: 'bg-orange-50 border-orange-300' },
  { id: 'SIGNE', title: 'Signé', color: 'bg-green-50 border-green-300' },
];

const mockLeads: Lead[] = [
  {
    id: 1,
    name: 'Restaurant Le Gourmet',
    contact: 'Pierre Martin',
    phone: '06 12 34 56 78',
    email: 'p.martin@legourmet.fr',
    city: 'Paris',
    activity: 'Site web + SEO',
    score: 95,
    value: '4 500 €',
    status: 'CLOSING',
  },
  {
    id: 2,
    name: 'Boutique Mode Elégance',
    contact: 'Sophie Dubois',
    phone: '06 23 45 67 89',
    email: 's.dubois@elegance.fr',
    city: 'Lyon',
    activity: 'E-commerce',
    score: 88,
    value: '6 200 €',
    status: 'RDV',
  },
  {
    id: 3,
    name: 'Cabinet Avocat Dupont',
    contact: 'Jean Dupont',
    phone: '06 34 56 78 90',
    email: 'j.dupont@avocat.fr',
    city: 'Marseille',
    activity: 'Site vitrine',
    score: 82,
    value: '2 800 €',
    status: 'RDV',
  },
  {
    id: 4,
    name: 'Coiffeur Tendance',
    contact: 'Marie Laurent',
    phone: '06 45 67 89 01',
    email: 'm.laurent@coiffeur.fr',
    city: 'Nice',
    activity: 'Site + Réservation',
    score: 76,
    value: '3 200 €',
    status: 'QUALIFIE',
  },
  {
    id: 5,
    name: 'Garage Auto Pro',
    contact: 'Luc Bernard',
    phone: '06 56 78 90 12',
    email: 'l.bernard@autopro.fr',
    city: 'Toulouse',
    activity: 'Site vitrine',
    score: 70,
    value: '2 500 €',
    status: 'QUALIFIE',
  },
  {
    id: 6,
    name: 'Boulangerie Artisan',
    contact: 'Claire Moreau',
    phone: '06 67 89 01 23',
    email: 'c.moreau@artisan.fr',
    city: 'Bordeaux',
    activity: 'E-commerce',
    score: 65,
    value: '3 800 €',
    status: 'NOUVEAU',
  },
  {
    id: 7,
    name: 'Plombier Express',
    contact: 'Thomas Petit',
    phone: '06 78 90 12 34',
    email: 't.petit@express.fr',
    city: 'Nantes',
    activity: 'Site vitrine',
    score: 60,
    value: '2 200 €',
    status: 'NOUVEAU',
  },
  {
    id: 8,
    name: 'Bijouterie Luxe',
    contact: 'Emma Rousseau',
    phone: '06 89 01 23 45',
    email: 'e.rousseau@luxe.fr',
    city: 'Strasbourg',
    activity: 'E-commerce',
    score: 92,
    value: '8 500 €',
    status: 'SIGNE',
  },
  {
    id: 9,
    name: 'Architecte Moderne',
    contact: 'Hugo Simon',
    phone: '06 90 12 34 56',
    email: 'h.simon@archi.fr',
    city: 'Montpellier',
    activity: 'Site + Portfolio',
    score: 87,
    value: '4 800 €',
    status: 'SIGNE',
  },
  {
    id: 10,
    name: 'Fleuriste Jardin',
    contact: 'Léa Blanc',
    phone: '06 01 23 45 67',
    email: 'l.blanc@jardin.fr',
    city: 'Lille',
    activity: 'Site + Livraison',
    score: 55,
    value: '2 900 €',
    status: 'NOUVEAU',
  },
];

const getScoreBadge = (score: number) => {
  if (score >= 90) return { label: 'TRES_CHAUD', color: 'bg-red-500' };
  if (score >= 75) return { label: 'CHAUD', color: 'bg-orange-500' };
  if (score >= 50) return { label: 'TIEDE', color: 'bg-yellow-500' };
  return { label: 'FROID', color: 'bg-blue-500' };
};

export default function CRMPage() {
  const [leads] = useState<Lead[]>(mockLeads);

  const getLeadsByStatus = (status: LeadStatus) => {
    return leads.filter((lead) => lead.status === status);
  };

  return (
    <div className="min-h-screen gradient-mesh py-8">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-700 to-orange-500 bg-clip-text text-transparent">
                CRM Pipeline
              </h1>
              <p className="mt-2 text-gray-600">
                Gérez vos leads et suivez vos opportunités commerciales
              </p>
            </div>
            <button className="btn-primary">
              <Plus className="h-5 w-5 mr-2" />
              Nouveau Lead
            </button>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((column) => {
            const columnLeads = getLeadsByStatus(column.id);
            const totalValue = columnLeads.reduce(
              (sum, lead) => sum + parseFloat(lead.value.replace(/[^\d]/g, '')),
              0
            );

            return (
              <div
                key={column.id}
                className="flex-shrink-0 w-80 bg-gray-50 rounded-xl border-2 border-dashed"
                style={{ borderColor: column.color.split(' ')[1].replace('border-', '') }}
              >
                {/* Column Header */}
                <div className={`px-4 py-3 rounded-t-xl ${column.color}`}>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-semibold text-gray-900">{column.title}</h3>
                    <span className="px-2 py-1 text-xs font-bold bg-white rounded-full">
                      {columnLeads.length}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 font-medium">
                    {totalValue.toLocaleString()} €
                  </p>
                </div>

                {/* Column Content */}
                <div className="p-3 space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto">
                  {columnLeads.map((lead) => {
                    const badge = getScoreBadge(lead.score);
                    return (
                      <div
                        key={lead.id}
                        className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition cursor-pointer border border-gray-200"
                      >
                        {/* Lead Header */}
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="text-sm font-semibold text-gray-900 flex-1 pr-2">
                            {lead.name}
                          </h4>
                          <span
                            className={`px-2 py-0.5 text-xs font-bold text-white ${badge.color} rounded flex-shrink-0`}
                          >
                            {lead.score}
                          </span>
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-1.5 mb-3">
                          <p className="text-sm font-medium text-gray-700">{lead.contact}</p>
                          <div className="flex items-center text-xs text-gray-600">
                            <Phone className="h-3.5 w-3.5 mr-1.5" />
                            <span>{lead.phone}</span>
                          </div>
                          <div className="flex items-center text-xs text-gray-600">
                            <Mail className="h-3.5 w-3.5 mr-1.5" />
                            <span className="truncate">{lead.email}</span>
                          </div>
                          <div className="flex items-center text-xs text-gray-600">
                            <MapPin className="h-3.5 w-3.5 mr-1.5" />
                            <span>{lead.city}</span>
                          </div>
                        </div>

                        {/* Activity & Value */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <span className="text-xs text-gray-500">{lead.activity}</span>
                          <div className="flex items-center text-sm font-bold text-violet-700">
                            <Euro className="h-4 w-4 mr-1" />
                            <span>{lead.value}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {columnLeads.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      Aucun lead dans cette colonne
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
