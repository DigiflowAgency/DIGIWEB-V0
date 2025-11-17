'use client';

import { useState } from 'react';
import { Send, Plus, Search, Play, Pause, Edit, Mail, Clock } from 'lucide-react';

const mockSequences = [
  { id: 1, name: 'Prospection Cold Email', emails: 5, enrolled: 234, completed: 145, opened: 67, replied: 23, status: 'Active' },
  { id: 2, name: 'Nurturing Leads', emails: 7, enrolled: 189, completed: 98, opened: 72, replied: 34, status: 'Active' },
  { id: 3, name: 'Follow-up Demo', emails: 4, enrolled: 156, completed: 112, opened: 81, replied: 45, status: 'Active' },
  { id: 4, name: 'Onboarding Client', emails: 6, enrolled: 89, completed: 67, opened: 78, replied: 12, status: 'Active' },
  { id: 5, name: 'Réactivation', emails: 3, enrolled: 245, completed: 178, opened: 58, replied: 28, status: 'Pause' },
  { id: 6, name: 'Upsell Existing', emails: 5, enrolled: 134, completed: 87, opened: 65, replied: 31, status: 'Active' },
  { id: 7, name: 'Event Invitation', emails: 4, enrolled: 312, completed: 289, opened: 84, replied: 67, status: 'Active' },
  { id: 8, name: 'Survey Request', emails: 2, enrolled: 456, completed: 398, opened: 76, replied: 198, status: 'Active' },
];

export default function SequencesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const totalEnrolled = mockSequences.reduce((sum, s) => sum + s.enrolled, 0);
  const totalOpened = mockSequences.reduce((sum, s) => sum + Math.round((s.enrolled * s.opened) / 100), 0);
  const totalReplied = mockSequences.reduce((sum, s) => sum + Math.round((s.enrolled * s.replied) / 100), 0);

  const stats = [
    { label: 'Total Séquences', value: mockSequences.length, color: 'text-orange-600' },
    { label: 'Contacts Inscrits', value: totalEnrolled.toLocaleString(), color: 'text-blue-600' },
    { label: 'Taux Ouverture', value: `${Math.round((totalOpened / totalEnrolled) * 100)}%`, color: 'text-green-600' },
    { label: 'Taux Réponse', value: `${Math.round((totalReplied / totalEnrolled) * 100)}%`, color: 'text-purple-600' },
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
            <button className="flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-semibold shadow-sm">
              <Plus className="h-5 w-5" />
              Nouvelle Séquence
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
          {mockSequences.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).map((sequence) => (
            <div key={sequence.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{sequence.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span>{sequence.emails} emails</span>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  sequence.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {sequence.status}
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
                  <span className="font-semibold text-green-600">{sequence.opened}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Taux de réponse</span>
                  <span className="font-semibold text-purple-600">{sequence.replied}%</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                  <Edit className="h-4 w-4" />
                  Modifier
                </button>
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  {sequence.status === 'Active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Clock className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
