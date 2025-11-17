'use client';

import { useState } from 'react';
import { Mail, Plus, Search, Send, Eye, Edit, Copy, BarChart3 } from 'lucide-react';

const mockEmails = [
  { id: 1, subject: 'Newsletter Novembre - Nouveautés', sent: 2500, opened: 1250, clicked: 380, status: 'Envoyé', date: '2024-11-15' },
  { id: 2, subject: 'Offre Spéciale Black Friday', sent: 0, opened: 0, clicked: 0, status: 'Brouillon', date: '2024-11-18' },
  { id: 3, subject: 'Rappel: Webinaire SEO Demain', sent: 450, opened: 320, clicked: 180, status: 'Envoyé', date: '2024-11-14' },
  { id: 4, subject: 'Nouveaux Services Marketing', sent: 3200, opened: 1600, clicked: 520, status: 'Envoyé', date: '2024-11-10' },
  { id: 5, subject: 'Invitation Événement Décembre', sent: 0, opened: 0, clicked: 0, status: 'Planifié', date: '2024-11-25' },
  { id: 6, subject: 'Conseils SEO - Édition 42', sent: 2800, opened: 1450, clicked: 420, status: 'Envoyé', date: '2024-11-12' },
  { id: 7, subject: 'Réactivation Clients Inactifs', sent: 1500, opened: 450, clicked: 85, status: 'Envoyé', date: '2024-11-08' },
  { id: 8, subject: 'Nouveauté: Dashboard Analytics', sent: 3500, opened: 1950, clicked: 680, status: 'Envoyé', date: '2024-11-05' },
  { id: 9, subject: 'Sondage Satisfaction Client', sent: 2200, opened: 1100, clicked: 320, status: 'Envoyé', date: '2024-11-13' },
  { id: 10, subject: 'Promotion Fin d\'Année', sent: 0, opened: 0, clicked: 0, status: 'Brouillon', date: '2024-11-18' },
];

export default function EmailPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const totalSent = mockEmails.reduce((sum, e) => sum + e.sent, 0);
  const totalOpened = mockEmails.reduce((sum, e) => sum + e.opened, 0);
  const totalClicked = mockEmails.reduce((sum, e) => sum + e.clicked, 0);
  const openRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : 0;
  const clickRate = totalOpened > 0 ? ((totalClicked / totalOpened) * 100).toFixed(1) : 0;

  const stats = [
    { label: 'Emails Envoyés', value: totalSent.toLocaleString(), color: 'text-orange-600' },
    { label: 'Taux d\'Ouverture', value: `${openRate}%`, color: 'text-blue-600' },
    { label: 'Taux de Clic', value: `${clickRate}%`, color: 'text-green-600' },
    { label: 'Brouillons', value: mockEmails.filter(e => e.status === 'Brouillon').length, color: 'text-purple-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Mail className="h-8 w-8 text-orange-600" />
                Campagnes Email
              </h1>
              <p className="text-gray-600 mt-1">Créez et gérez vos campagnes email</p>
            </div>
            <button className="flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-semibold shadow-sm">
              <Plus className="h-5 w-5" />
              Nouvel Email
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par sujet..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Sujet</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Envoyés</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Ouverts</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Clics</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {mockEmails.filter(e => e.subject.toLowerCase().includes(searchQuery.toLowerCase())).map((email) => (
                <tr key={email.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4"><span className="font-semibold text-gray-900">{email.subject}</span></td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      email.status === 'Envoyé' ? 'bg-green-100 text-green-700' :
                      email.status === 'Planifié' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>{email.status}</span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-900">{email.sent.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-blue-600">{email.opened.toLocaleString()}</span>
                    {email.sent > 0 && <span className="text-xs text-gray-500 ml-2">({((email.opened / email.sent) * 100).toFixed(0)}%)</span>}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-green-600">{email.clicked.toLocaleString()}</span>
                    {email.opened > 0 && <span className="text-xs text-gray-500 ml-2">({((email.clicked / email.opened) * 100).toFixed(0)}%)</span>}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 hover:bg-gray-100 rounded-lg"><Eye className="h-4 w-4" /></button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg"><Edit className="h-4 w-4" /></button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg"><Copy className="h-4 w-4" /></button>
                      {email.status === 'Brouillon' && <button className="p-2 hover:bg-orange-100 rounded-lg"><Send className="h-4 w-4 text-orange-600" /></button>}
                      {email.status === 'Envoyé' && <button className="p-2 hover:bg-gray-100 rounded-lg"><BarChart3 className="h-4 w-4" /></button>}
                    </div>
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
