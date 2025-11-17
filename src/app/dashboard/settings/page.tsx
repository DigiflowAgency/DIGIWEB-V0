'use client';

import { useState } from 'react';
import {
  Settings,
  User,
  Building2,
  Bell,
  Lock,
  CreditCard,
  Users,
  Mail,
  Globe,
  Shield,
  Save,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';
import { useUsers } from '@/hooks/useUsers';

export default function SettingsPage() {
  const { users, isLoading } = useUsers();
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);

  const tabs = [
    { id: 'profile', name: 'Profil', icon: User },
    { id: 'company', name: 'Entreprise', icon: Building2 },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'security', name: 'Sécurité', icon: Lock },
    { id: 'billing', name: 'Facturation', icon: CreditCard },
    { id: 'team', name: 'Équipe', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Settings className="h-8 w-8 text-orange-600" />
            Paramètres
          </h1>
          <p className="text-gray-600 mt-1">Gérez vos préférences et votre compte</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                      activeTab === tab.id
                        ? 'bg-orange-50 text-orange-600 font-semibold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {tab.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              {activeTab === 'profile' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Profil Utilisateur</h2>
                  <div className="space-y-6">
                    <div className="flex items-center gap-6">
                      <div className="h-24 w-24 rounded-full bg-orange-100 flex items-center justify-center">
                        <User className="h-12 w-12 text-orange-600" />
                      </div>
                      <div>
                        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                          Changer la photo
                        </button>
                        <p className="text-sm text-gray-500 mt-2">JPG, PNG ou GIF. Max 2MB</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Prénom</label>
                        <input
                          type="text"
                          defaultValue="Jean"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Nom</label>
                        <input
                          type="text"
                          defaultValue="Dupont"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="email"
                          defaultValue="jean.dupont@example.com"
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Téléphone</label>
                      <input
                        type="tel"
                        defaultValue="+33 6 12 34 56 78"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Poste</label>
                      <input
                        type="text"
                        defaultValue="Commercial"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <button className="flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-semibold">
                      <Save className="h-5 w-5" />
                      Enregistrer les modifications
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'company' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Informations Entreprise</h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Nom de l&apos;entreprise</label>
                      <input
                        type="text"
                        defaultValue="DigiWeb Agency"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">SIRET</label>
                        <input
                          type="text"
                          defaultValue="123 456 789 00012"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">N° TVA</label>
                        <input
                          type="text"
                          defaultValue="FR12345678901"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Adresse</label>
                      <input
                        type="text"
                        defaultValue="123 Rue de la Paix"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Code Postal</label>
                        <input
                          type="text"
                          defaultValue="75001"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Ville</label>
                        <input
                          type="text"
                          defaultValue="Paris"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Pays</label>
                        <input
                          type="text"
                          defaultValue="France"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Site Web</label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="url"
                          defaultValue="https://digiweb.fr"
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>

                    <button className="flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-semibold">
                      <Save className="h-5 w-5" />
                      Enregistrer
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Préférences de Notification</h2>
                  <div className="space-y-4">
                    {[
                      { label: 'Nouveaux deals', description: 'Recevoir une notification pour chaque nouveau deal' },
                      { label: 'Mentions', description: 'Quand quelqu\'un vous mentionne' },
                      { label: 'Rappels', description: 'Rappels d\'activités et de tâches' },
                      { label: 'Résumés quotidiens', description: 'Résumé quotidien de votre activité' },
                      { label: 'Newsletters', description: 'Actualités et mises à jour produit' },
                    ].map((notif, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <p className="font-semibold text-gray-900">{notif.label}</p>
                          <p className="text-sm text-gray-600">{notif.description}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Sécurité</h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Mot de passe actuel</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Nouveau mot de passe</label>
                      <input
                        type="password"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Confirmer le mot de passe</label>
                      <input
                        type="password"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <button className="flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-semibold">
                      <Shield className="h-5 w-5" />
                      Mettre à jour le mot de passe
                    </button>

                    <div className="pt-6 border-t border-gray-200">
                      <h3 className="font-semibold text-gray-900 mb-4">Authentification à deux facteurs</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Ajoutez une couche de sécurité supplémentaire à votre compte
                      </p>
                      <button className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold">
                        Activer 2FA
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'billing' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Facturation</h2>
                  <div className="space-y-6">
                    <div className="p-6 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">Plan Professionnel</h3>
                          <p className="text-sm text-gray-600">Facturation mensuelle</p>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-orange-600">99€</p>
                          <p className="text-sm text-gray-600">/mois</p>
                        </div>
                      </div>
                      <button className="w-full bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-semibold">
                        Changer de plan
                      </button>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-4">Moyen de paiement</h3>
                      <div className="p-4 border border-gray-200 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-6 w-6 text-gray-400" />
                          <div>
                            <p className="font-semibold text-gray-900">•••• •••• •••• 4242</p>
                            <p className="text-sm text-gray-600">Expire 12/25</p>
                          </div>
                        </div>
                        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                          Modifier
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-4">Historique des factures</h3>
                      <div className="space-y-2">
                        {[
                          { date: '01/11/2024', amount: '99€', status: 'Payée' },
                          { date: '01/10/2024', amount: '99€', status: 'Payée' },
                          { date: '01/09/2024', amount: '99€', status: 'Payée' },
                        ].map((invoice, index) => (
                          <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                            <div>
                              <p className="font-semibold text-gray-900">{invoice.date}</p>
                              <p className="text-sm text-gray-600">{invoice.amount}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                                {invoice.status}
                              </span>
                              <button className="text-orange-600 hover:text-orange-700 text-sm font-semibold">
                                Télécharger
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'team' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Gestion d&apos;Équipe</h2>
                  <div className="space-y-6">
                    <button className="flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-semibold">
                      <Users className="h-5 w-5" />
                      Inviter un membre
                    </button>

                    <div className="space-y-3">
                      {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
                        </div>
                      ) : users.length > 0 ? (
                        users.map((member) => (
                          <div key={member.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                            <div className="flex items-center gap-4">
                              <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                                <span className="text-orange-600 font-semibold">
                                  {member.firstName?.[0]}{member.lastName?.[0]}
                                </span>
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {member.firstName} {member.lastName}
                                </p>
                                <p className="text-sm text-gray-600">{member.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                                {member.role}
                              </span>
                              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                                Modifier
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-gray-500 py-4">Aucun membre d'équipe</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
