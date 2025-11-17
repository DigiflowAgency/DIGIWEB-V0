'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  Search,
  TrendingUp,
  Users,
  Zap,
  Share2,
  Star,
  Check,
  Plus,
  Eye,
  Edit,
  Download,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';

const packs = [
  {
    id: 1,
    name: 'Site Vitrine Pro',
    category: 'Web',
    price: '2 990 €',
    monthlyPrice: '99 €/mois',
    description: 'Site web professionnel pour votre entreprise',
    icon: Package,
    color: 'from-violet-600 to-violet-700',
    features: [
      'Design responsive moderne',
      '5 pages personnalisées',
      'Hébergement 1 an inclus',
      'Nom de domaine offert',
      'Formulaire de contact',
      'Optimisation SEO basique',
    ],
    popular: true,
  },
  {
    id: 2,
    name: 'Pack SEO Elite',
    category: 'Marketing',
    price: '1 500 €',
    monthlyPrice: '250 €/mois',
    description: 'Boostez votre visibilité Google',
    icon: TrendingUp,
    color: 'from-green-500 to-emerald-600',
    features: [
      'Audit SEO complet',
      'Optimisation technique',
      '10 articles SEO/mois',
      'Netlinking qualité',
      'Suivi positions',
      'Rapport mensuel détaillé',
    ],
    popular: false,
  },
  {
    id: 3,
    name: 'Pack SEA Performance',
    category: 'Publicité',
    price: '800 €',
    monthlyPrice: '300 €/mois',
    description: 'Campagnes Google Ads rentables',
    icon: Search,
    color: 'from-orange-500 to-red-500',
    features: [
      'Setup campagnes Google Ads',
      'Budget publicitaire optimisé',
      'A/B testing continu',
      'Ciblage géolocalisé',
      'Remarketing',
      'Dashboard temps réel',
    ],
    popular: false,
  },
  {
    id: 4,
    name: 'Social Media Manager',
    category: 'Social',
    price: '1 200 €',
    monthlyPrice: '450 €/mois',
    description: 'Gestion complète réseaux sociaux',
    icon: Share2,
    color: 'from-pink-500 to-purple-600',
    features: [
      '20 posts/mois (FB, Insta, LinkedIn)',
      'Stories quotidiennes',
      'Création graphique',
      'Gestion commentaires',
      'Analytics détaillés',
      'Stratégie de contenu',
    ],
    popular: true,
  },
  {
    id: 5,
    name: 'Marketing Automation',
    category: 'Automation',
    price: '2 500 €',
    monthlyPrice: '199 €/mois',
    description: 'Automatisez vos ventes',
    icon: Zap,
    color: 'from-yellow-500 to-orange-500',
    features: [
      'Chatbot IA conversationnel',
      'Email sequences automatisées',
      'CRM intégré',
      'Lead scoring',
      'Workflows personnalisés',
      'Intégration tous outils',
    ],
    popular: false,
  },
  {
    id: 6,
    name: 'Influence Marketing',
    category: 'Influence',
    price: '3 500 €',
    monthlyPrice: '500 €/mois',
    description: 'Campagnes avec micro-influenceurs',
    icon: Star,
    color: 'from-blue-500 to-cyan-500',
    features: [
      'Sélection 5 micro-influenceurs',
      'Négociation partenariats',
      'Création brief créatif',
      'Suivi campagnes',
      'Reporting ROI',
      'Base influenceurs exclusive',
    ],
    popular: false,
  },
];

const devisData = [
  {
    id: 'DV-2024-001',
    client: 'Restaurant Le Gourmet',
    pack: 'Site Vitrine Pro',
    amount: '2 990 €',
    status: 'accepte',
    date: '15 Oct 2024',
    validUntil: '15 Nov 2024',
  },
  {
    id: 'DV-2024-002',
    client: 'Boutique Mode Élégance',
    pack: 'Pack SEO Elite',
    amount: '1 500 €',
    status: 'en_attente',
    date: '18 Oct 2024',
    validUntil: '18 Nov 2024',
  },
  {
    id: 'DV-2024-003',
    client: 'Cabinet Avocat Dupont',
    pack: 'Social Media Manager',
    amount: '1 200 €',
    status: 'envoye',
    date: '20 Oct 2024',
    validUntil: '20 Nov 2024',
  },
  {
    id: 'DV-2024-004',
    client: 'Garage Auto Pro',
    pack: 'Pack SEA Performance',
    amount: '800 €',
    status: 'accepte',
    date: '22 Oct 2024',
    validUntil: '22 Nov 2024',
  },
  {
    id: 'DV-2024-005',
    client: 'Coiffeur Tendance',
    pack: 'Site Vitrine Pro',
    amount: '2 990 €',
    status: 'refuse',
    date: '25 Oct 2024',
    validUntil: '25 Nov 2024',
  },
  {
    id: 'DV-2024-006',
    client: 'Boulangerie Tradition',
    pack: 'Marketing Automation',
    amount: '2 500 €',
    status: 'en_attente',
    date: '28 Oct 2024',
    validUntil: '28 Nov 2024',
  },
  {
    id: 'DV-2024-007',
    client: 'Pizzeria Bella',
    pack: 'Social Media Manager',
    amount: '1 200 €',
    status: 'envoye',
    date: '30 Oct 2024',
    validUntil: '30 Nov 2024',
  },
  {
    id: 'DV-2024-008',
    client: 'Fleuriste Rose',
    pack: 'Pack SEO Elite',
    amount: '1 500 €',
    status: 'accepte',
    date: '01 Nov 2024',
    validUntil: '01 Dec 2024',
  },
  {
    id: 'DV-2024-009',
    client: 'Plombier Express',
    pack: 'Pack SEA Performance',
    amount: '800 €',
    status: 'en_attente',
    date: '02 Nov 2024',
    validUntil: '02 Dec 2024',
  },
  {
    id: 'DV-2024-010',
    client: 'Pharmacie Santé',
    pack: 'Site Vitrine Pro',
    amount: '2 990 €',
    status: 'envoye',
    date: '03 Nov 2024',
    validUntil: '03 Dec 2024',
  },
];

const statusConfig = {
  accepte: {
    label: 'Accepté',
    color: 'bg-green-100 text-green-700 border-green-200',
    icon: CheckCircle2,
  },
  refuse: {
    label: 'Refusé',
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: XCircle,
  },
  en_attente: {
    label: 'En attente',
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    icon: Clock,
  },
  envoye: {
    label: 'Envoyé',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: AlertCircle,
  },
};

export default function OffresPage() {
  const [activeTab, setActiveTab] = useState<'catalogue' | 'devis'>('catalogue');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const categories = ['all', ...Array.from(new Set(packs.map(p => p.category)))];
  const filteredPacks = selectedCategory === 'all'
    ? packs
    : packs.filter(p => p.category === selectedCategory);

  const filteredDevis = statusFilter === 'all'
    ? devisData
    : devisData.filter(d => d.status === statusFilter);

  return (
    <div className="min-h-screen gradient-mesh py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-700 to-orange-500 bg-clip-text text-transparent">
            Offres & Devis
          </h1>
          <p className="mt-2 text-gray-600">
            Catalogue de packs et gestion de vos devis
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="card-premium p-2 mb-8 inline-flex rounded-2xl"
        >
          <button
            onClick={() => setActiveTab('catalogue')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
              activeTab === 'catalogue'
                ? 'bg-gradient-to-r from-violet-600 to-orange-500 text-white shadow-lg'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Package className="inline-block h-5 w-5 mr-2" />
            Catalogue
          </button>
          <button
            onClick={() => setActiveTab('devis')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
              activeTab === 'devis'
                ? 'bg-gradient-to-r from-violet-600 to-orange-500 text-white shadow-lg'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="inline-block h-5 w-5 mr-2" />
            Mes Devis
          </button>
        </motion.div>

        {/* Catalogue Tab */}
        {activeTab === 'catalogue' && (
          <>
            {/* Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8 flex gap-3 flex-wrap"
            >
              {categories.map((cat, index) => (
                <motion.button
                  key={cat}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-300 ${
                    selectedCategory === cat
                      ? 'bg-gradient-to-r from-violet-600 to-orange-500 text-white shadow-premium'
                      : 'glass hover:glass-violet text-gray-700'
                  }`}
                >
                  {cat === 'all' ? 'Tous' : cat}
                </motion.button>
              ))}
            </motion.div>

            {/* Packs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPacks.map((pack, index) => {
                const Icon = pack.icon;
                return (
                  <motion.div
                    key={pack.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className={`card-premium p-6 group relative overflow-hidden ${
                      pack.popular ? 'card-highlight' : ''
                    }`}
                  >
                    {pack.popular && (
                      <div className="absolute top-4 right-4">
                        <span className="badge badge-violet flex items-center gap-1 animate-pulse">
                          <Star className="h-3 w-3 fill-current" />
                          Populaire
                        </span>
                      </div>
                    )}

                    <div className={`p-4 rounded-2xl bg-gradient-to-br ${pack.color} w-fit mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>

                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{pack.name}</h3>
                      <p className="text-sm text-gray-600 mb-4">{pack.description}</p>

                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-3xl font-bold text-violet-700">{pack.price}</span>
                        <span className="text-sm text-gray-500">setup</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        puis <span className="font-semibold text-orange-600">{pack.monthlyPrice}</span>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      {pack.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <button className="w-full btn-primary group-hover:shadow-glow">
                      <Plus className="inline-block h-5 w-5 mr-2" />
                      Créer un devis
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}

        {/* Devis Tab */}
        {activeTab === 'devis' && (
          <>
            {/* Filters & Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8 flex items-center justify-between"
            >
              <div className="flex gap-3">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-4 py-2 rounded-xl font-medium transition-all ${
                    statusFilter === 'all'
                      ? 'bg-gradient-to-r from-violet-600 to-orange-500 text-white'
                      : 'glass text-gray-700'
                  }`}
                >
                  Tous
                </button>
                {Object.entries(statusConfig).map(([key, config]) => {
                  const StatusIcon = config.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => setStatusFilter(key)}
                      className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
                        statusFilter === key
                          ? 'bg-gradient-to-r from-violet-600 to-orange-500 text-white'
                          : 'glass text-gray-700'
                      }`}
                    >
                      <StatusIcon className="h-4 w-4" />
                      {config.label}
                    </button>
                  );
                })}
              </div>
              <button className="btn-primary">
                <Plus className="inline-block h-5 w-5 mr-2" />
                Nouveau devis
              </button>
            </motion.div>

            {/* Devis Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card-premium overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Référence
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Pack
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Montant
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredDevis.map((devis, index) => {
                      const statusInfo = statusConfig[devis.status as keyof typeof statusConfig];
                      const StatusIcon = statusInfo.icon;
                      return (
                        <motion.tr
                          key={devis.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + index * 0.05 }}
                          className="hover:bg-violet-50/50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-mono text-sm font-semibold text-violet-700">
                              {devis.id}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{devis.client}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-700">{devis.pack}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-bold text-gray-900">{devis.amount}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`badge ${statusInfo.color} flex items-center gap-1 w-fit`}>
                              <StatusIcon className="h-3 w-3" />
                              {statusInfo.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-700">{devis.date}</div>
                            <div className="text-xs text-gray-500">Valide jusqu&apos;au {devis.validUntil}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button className="p-2 hover:bg-violet-100 rounded-lg transition-colors group">
                                <Eye className="h-4 w-4 text-gray-600 group-hover:text-violet-600" />
                              </button>
                              <button className="p-2 hover:bg-orange-100 rounded-lg transition-colors group">
                                <Edit className="h-4 w-4 text-gray-600 group-hover:text-orange-600" />
                              </button>
                              <button className="p-2 hover:bg-green-100 rounded-lg transition-colors group">
                                <Download className="h-4 w-4 text-gray-600 group-hover:text-green-600" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
