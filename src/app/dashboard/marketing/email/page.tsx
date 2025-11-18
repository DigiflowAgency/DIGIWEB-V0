'use client';

import { useState } from 'react';
import { Mail, Plus, Search, Send, Eye, Edit, Copy, BarChart3, Loader2 } from 'lucide-react';
import { useEmailCampaigns, useEmailCampaignMutations } from '@/hooks/useEmailCampaigns';
import Modal from '@/components/Modal';

export default function EmailPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  const [formData, setFormData] = useState({ subject: '', content: '' });
  const { campaigns, isLoading, isError, mutate } = useEmailCampaigns();
  const { createEmailCampaign, updateEmailCampaign, duplicateEmailCampaign, sendEmailCampaign, loading: submitting, error: submitError } = useEmailCampaignMutations();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createEmailCampaign({ ...formData, status: 'Brouillon' });
      setIsModalOpen(false);
      setFormData({ subject: '', content: '' });
      mutate();
    } catch (err) {
      console.error('Erreur création email:', err);
    }
  };

  const handleEdit = (email: any) => {
    setSelectedEmail(email);
    setFormData({ subject: email.subject, content: email.content || '' });
    setIsEditModalOpen(true);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmail) return;
    try {
      await updateEmailCampaign(selectedEmail.id, formData);
      setIsEditModalOpen(false);
      setFormData({ subject: '', content: '' });
      setSelectedEmail(null);
      mutate();
    } catch (err) {
      console.error('Erreur mise à jour email:', err);
    }
  };

  const handleDuplicate = async (email: any) => {
    try {
      await duplicateEmailCampaign(email.id);
      mutate();
    } catch (err) {
      console.error('Erreur duplication:', err);
    }
  };

  const handleSend = async (email: any) => {
    if (!confirm('Êtes-vous sûr de vouloir envoyer cette campagne ?')) return;
    try {
      await sendEmailCampaign(email.id);
      mutate();
    } catch (err) {
      console.error('Erreur envoi:', err);
    }
  };

  const handleViewDetails = (email: any) => {
    setSelectedEmail(email);
    setIsDetailModalOpen(true);
  };

  const handleViewStats = (email: any) => {
    setSelectedEmail(email);
    setIsStatsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-orange-600" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">Erreur lors du chargement</p>
      </div>
    );
  }

  const totalSent = campaigns.reduce((sum, e) => sum + e.sent, 0);
  const totalOpened = campaigns.reduce((sum, e) => sum + e.opened, 0);
  const totalClicked = campaigns.reduce((sum, e) => sum + e.clicked, 0);
  const openRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : 0;
  const clickRate = totalOpened > 0 ? ((totalClicked / totalOpened) * 100).toFixed(1) : 0;

  const stats = [
    { label: 'Emails Envoyés', value: totalSent.toLocaleString(), color: 'text-orange-600' },
    { label: 'Taux d\'Ouverture', value: `${openRate}%`, color: 'text-blue-600' },
    { label: 'Taux de Clic', value: `${clickRate}%`, color: 'text-green-600' },
    { label: 'Brouillons', value: campaigns.filter(e => e.status === 'Brouillon').length, color: 'text-purple-600' },
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
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-semibold shadow-sm"
            >
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
              {campaigns.filter(e => e.subject.toLowerCase().includes(searchQuery.toLowerCase())).map((email) => (
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
                      <button
                        onClick={() => handleViewDetails(email)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                        title="Voir"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(email)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                        title="Éditer"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDuplicate(email)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                        title="Dupliquer"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      {email.status === 'Brouillon' && (
                        <button
                          onClick={() => handleSend(email)}
                          className="p-2 hover:bg-orange-100 rounded-lg"
                          title="Envoyer"
                        >
                          <Send className="h-4 w-4 text-orange-600" />
                        </button>
                      )}
                      {email.status === 'Envoyé' && (
                        <button
                          onClick={() => handleViewStats(email)}
                          className="p-2 hover:bg-gray-100 rounded-lg"
                          title="Voir les statistiques"
                        >
                          <BarChart3 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal Nouvel Email */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nouvelle Campagne Email" size="lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            {submitError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{submitError}</div>}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Sujet <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Sujet de l'email"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Contenu <span className="text-red-500">*</span></label>
              <textarea
                required
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                rows={10}
                placeholder="Contenu HTML de l'email..."
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button type="button" onClick={() => setIsModalOpen(false)} disabled={submitting} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50">Annuler</button>
              <button type="submit" disabled={submitting} className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold disabled:opacity-50 flex items-center gap-2">{submitting ? <><Loader2 className="h-4 w-4 animate-spin" />Création...</> : 'Créer le brouillon'}</button>
            </div>
          </form>
        </Modal>

        {/* Modal Édition Email */}
        <Modal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setSelectedEmail(null); }} title="Éditer la Campagne Email" size="lg">
          <form onSubmit={handleUpdateSubmit} className="space-y-6">
            {submitError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{submitError}</div>}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Sujet <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Contenu <span className="text-red-500">*</span></label>
              <textarea
                required
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                rows={10}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button type="button" onClick={() => { setIsEditModalOpen(false); setSelectedEmail(null); }} disabled={submitting} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50">Annuler</button>
              <button type="submit" disabled={submitting} className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold disabled:opacity-50 flex items-center gap-2">{submitting ? <><Loader2 className="h-4 w-4 animate-spin" />Enregistrement...</> : 'Enregistrer'}</button>
            </div>
          </form>
        </Modal>

        {/* Modal Détails Email */}
        <Modal isOpen={isDetailModalOpen} onClose={() => { setIsDetailModalOpen(false); setSelectedEmail(null); }} title="Détails de la Campagne" size="lg">
          {selectedEmail && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Sujet</label>
                <p className="text-gray-900 font-semibold text-lg">{selectedEmail.subject}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Contenu</label>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-64 overflow-y-auto">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">{selectedEmail.content || 'Aucun contenu'}</pre>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Envoyés</p>
                  <p className="text-blue-600 font-bold text-xl">{selectedEmail.sent.toLocaleString()}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Ouverts</p>
                  <p className="text-green-600 font-bold text-xl">{selectedEmail.opened.toLocaleString()}</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Clics</p>
                  <p className="text-purple-600 font-bold text-xl">{selectedEmail.clicked.toLocaleString()}</p>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Statut</p>
                  <p className="text-orange-600 font-bold">{selectedEmail.status}</p>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button onClick={() => { setIsDetailModalOpen(false); setSelectedEmail(null); }} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium">Fermer</button>
                <button onClick={() => { setIsDetailModalOpen(false); handleEdit(selectedEmail); }} className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold flex items-center gap-2"><Edit className="h-4 w-4" />Éditer</button>
              </div>
            </div>
          )}
        </Modal>

        {/* Modal Statistiques */}
        <Modal isOpen={isStatsModalOpen} onClose={() => { setIsStatsModalOpen(false); setSelectedEmail(null); }} title="Statistiques de la Campagne" size="lg">
          {selectedEmail && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{selectedEmail.subject}</h3>
                <p className="text-sm text-gray-600">Créé le {new Date(selectedEmail.createdAt).toLocaleDateString('fr-FR')}</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-600 mb-1">Emails envoyés</p>
                  <p className="text-blue-600 font-bold text-2xl">{selectedEmail.sent.toLocaleString()}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-sm text-gray-600 mb-1">Taux d'ouverture</p>
                  <p className="text-green-600 font-bold text-2xl">
                    {selectedEmail.sent > 0 ? ((selectedEmail.opened / selectedEmail.sent) * 100).toFixed(1) : 0}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{selectedEmail.opened.toLocaleString()} ouverts</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <p className="text-sm text-gray-600 mb-1">Taux de clic</p>
                  <p className="text-purple-600 font-bold text-2xl">
                    {selectedEmail.opened > 0 ? ((selectedEmail.clicked / selectedEmail.opened) * 100).toFixed(1) : 0}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{selectedEmail.clicked.toLocaleString()} clics</p>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <h4 className="font-semibold text-gray-700 mb-3">Performance</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Taux d'ouverture</span>
                      <span className="font-semibold">{selectedEmail.sent > 0 ? ((selectedEmail.opened / selectedEmail.sent) * 100).toFixed(1) : 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${selectedEmail.sent > 0 ? Math.min((selectedEmail.opened / selectedEmail.sent) * 100, 100) : 0}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Taux de clic</span>
                      <span className="font-semibold">{selectedEmail.opened > 0 ? ((selectedEmail.clicked / selectedEmail.opened) * 100).toFixed(1) : 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${selectedEmail.opened > 0 ? Math.min((selectedEmail.clicked / selectedEmail.opened) * 100, 100) : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button onClick={() => { setIsStatsModalOpen(false); setSelectedEmail(null); }} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium">Fermer</button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
