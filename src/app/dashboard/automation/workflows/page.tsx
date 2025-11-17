'use client';

import { useState } from 'react';
import { Zap, Plus, Search, Play, Pause, Edit, BarChart3 } from 'lucide-react';

const mockWorkflows = [
  { id: 1, name: 'Bienvenue Nouveau Client', trigger: 'Nouveau Contact', actions: 5, status: 'Active', executions: 145 },
  { id: 2, name: 'Relance Devis Non Signé', trigger: 'Devis Envoyé +3j', actions: 3, status: 'Active', executions: 89 },
  { id: 3, name: 'Onboarding Client', trigger: 'Deal Gagné', actions: 8, status: 'Active', executions: 34 },
  { id: 4, name: 'Réactivation Inactif', trigger: 'Inactif 30j', actions: 4, status: 'Pause', executions: 56 },
  { id: 5, name: 'Lead Scoring Auto', trigger: 'Nouvelle Activité', actions: 2, status: 'Active', executions: 267 },
  { id: 6, name: 'Rappel RDV', trigger: 'RDV -24h', actions: 3, status: 'Active', executions: 198 },
  { id: 7, name: 'Follow-up Post Demo', trigger: 'Demo Terminée', actions: 6, status: 'Active', executions: 45 },
  { id: 8, name: 'Notification Deal', trigger: 'Deal Créé', actions: 2, status: 'Active', executions: 112 },
  { id: 9, name: 'Survey Satisfaction', trigger: 'Ticket Résolu', actions: 4, status: 'Pause', executions: 78 },
  { id: 10, name: 'Assignation Auto', trigger: 'Nouveau Lead', actions: 3, status: 'Active', executions: 156 },
];

export default function WorkflowsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const stats = [
    { label: 'Total Workflows', value: mockWorkflows.length, color: 'text-orange-600' },
    { label: 'Actifs', value: mockWorkflows.filter(w => w.status === 'Active').length, color: 'text-green-600' },
    { label: 'Exécutions', value: mockWorkflows.reduce((sum, w) => sum + w.executions, 0).toLocaleString(), color: 'text-blue-600' },
    { label: 'Taux Succès', value: '98%', color: 'text-purple-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Zap className="h-8 w-8 text-orange-600" />
                Workflows Automation
              </h1>
              <p className="text-gray-600 mt-1">Automatisez vos processus métier</p>
            </div>
            <button className="flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-semibold shadow-sm">
              <Plus className="h-5 w-5" />
              Nouveau Workflow
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
              placeholder="Rechercher un workflow..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockWorkflows.filter(w => w.name.toLowerCase().includes(searchQuery.toLowerCase())).map((workflow) => (
            <div key={workflow.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex-1">{workflow.name}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  workflow.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {workflow.status}
                </span>
              </div>

              <div className="space-y-2 mb-4 text-sm text-gray-600">
                <div className="flex items-center justify-between">
                  <span>Déclencheur</span>
                  <span className="font-semibold text-gray-900">{workflow.trigger}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Actions</span>
                  <span className="font-semibold text-gray-900">{workflow.actions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Exécutions</span>
                  <span className="font-semibold text-orange-600">{workflow.executions}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                  <Edit className="h-4 w-4" />
                  Modifier
                </button>
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  {workflow.status === 'Active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <BarChart3 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
