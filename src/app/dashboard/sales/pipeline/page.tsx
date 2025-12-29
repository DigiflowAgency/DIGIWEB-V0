'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  BarChart3,
  Plus,
  TrendingUp,
  Euro,
  Target,
  Activity,
  ChevronRight,
  Loader2,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Palette
} from 'lucide-react';
import { useDeals } from '@/hooks/useDeals';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

type DealStage = 'A_CONTACTER' | 'EN_DISCUSSION' | 'A_RELANCER' | 'RDV_PRIS' | 'NEGO_HOT' | 'CLOSING';

const stageConfig = [
  { id: 'A_CONTACTER' as DealStage, name: 'À Contacter', color: 'bg-gray-500' },
  { id: 'EN_DISCUSSION' as DealStage, name: 'En Discussion', color: 'bg-blue-500' },
  { id: 'A_RELANCER' as DealStage, name: 'À Relancer', color: 'bg-yellow-500' },
  { id: 'RDV_PRIS' as DealStage, name: 'RDV Pris', color: 'bg-violet-500' },
  { id: 'NEGO_HOT' as DealStage, name: 'Négo Hot 🔥', color: 'bg-orange-500' },
  { id: 'CLOSING' as DealStage, name: 'Closing', color: 'bg-green-500' },
];

const getStageLabel = (stage: string) => {
  const config = stageConfig.find(s => s.id === stage);
  return config?.name || stage;
};

const getDaysInStage = (updatedAt: string) => {
  const updated = new Date(updatedAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - updated.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export default function PipelinePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';

  // États pour le filtre admin
  const [filterMode, setFilterMode] = useState<'mine' | 'all' | 'user'>('mine');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [users, setUsers] = useState<any[]>([]);

  // États pour tri et filtre par montant
  const [sortBy, setSortBy] = useState<'value' | 'createdAt' | 'updatedAt' | 'expectedCloseDate'>('value');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [minValue, setMinValue] = useState<string>('');
  const [maxValue, setMaxValue] = useState<string>('');

  // État pour le seuil et couleurs configurables
  const [colorThreshold, setColorThreshold] = useState<number>(3000);
  const [lowColor, setLowColor] = useState<string>('blue'); // < seuil
  const [highColor, setHighColor] = useState<string>('violet'); // >= seuil
  const [showColorModal, setShowColorModal] = useState(false);
  const [tempThreshold, setTempThreshold] = useState<string>('3000');
  const [tempLowColor, setTempLowColor] = useState<string>('blue');
  const [tempHighColor, setTempHighColor] = useState<string>('violet');

  // Options de couleurs disponibles
  const colorOptions = [
    { id: 'blue', label: 'Bleu', border: 'border-l-blue-500', bg: 'bg-blue-50', preview: 'bg-blue-500' },
    { id: 'violet', label: 'Violet', border: 'border-l-violet-500', bg: 'bg-violet-50', preview: 'bg-violet-500' },
    { id: 'green', label: 'Vert', border: 'border-l-green-500', bg: 'bg-green-50', preview: 'bg-green-500' },
    { id: 'orange', label: 'Orange', border: 'border-l-orange-500', bg: 'bg-orange-50', preview: 'bg-orange-500' },
    { id: 'pink', label: 'Rose', border: 'border-l-pink-500', bg: 'bg-pink-50', preview: 'bg-pink-500' },
    { id: 'yellow', label: 'Jaune', border: 'border-l-yellow-500', bg: 'bg-yellow-50', preview: 'bg-yellow-500' },
    { id: 'red', label: 'Rouge', border: 'border-l-red-500', bg: 'bg-red-50', preview: 'bg-red-500' },
    { id: 'gray', label: 'Gris', border: 'border-l-gray-500', bg: 'bg-gray-50', preview: 'bg-gray-500' },
  ];

  // Charger les paramètres depuis localStorage
  useEffect(() => {
    const savedThreshold = localStorage.getItem('dealColorThreshold');
    const savedLowColor = localStorage.getItem('dealLowColor');
    const savedHighColor = localStorage.getItem('dealHighColor');
    if (savedThreshold) {
      setColorThreshold(Number(savedThreshold));
      setTempThreshold(savedThreshold);
    }
    if (savedLowColor) {
      setLowColor(savedLowColor);
      setTempLowColor(savedLowColor);
    }
    if (savedHighColor) {
      setHighColor(savedHighColor);
      setTempHighColor(savedHighColor);
    }
  }, []);

  // Sauvegarder les paramètres de couleur
  const saveColorSettings = () => {
    const threshold = Number(tempThreshold) || 3000;
    setColorThreshold(threshold);
    setLowColor(tempLowColor);
    setHighColor(tempHighColor);
    localStorage.setItem('dealColorThreshold', String(threshold));
    localStorage.setItem('dealLowColor', tempLowColor);
    localStorage.setItem('dealHighColor', tempHighColor);
    setShowColorModal(false);
  };

  // Fonction pour obtenir la couleur selon le montant
  const getDealColor = (value: number) => {
    const colorConfig = value < colorThreshold
      ? colorOptions.find(c => c.id === lowColor)
      : colorOptions.find(c => c.id === highColor);
    return colorConfig
      ? `border-l-4 ${colorConfig.border} ${colorConfig.bg}`
      : 'border-l-4 border-l-gray-300 bg-gray-50';
  };

  // Charger la liste des utilisateurs (pour les admins)
  useEffect(() => {
    if (isAdmin) {
      fetch('/api/users')
        .then(res => res.json())
        .then(data => {
          if (data.users && Array.isArray(data.users)) {
            setUsers(data.users);
          }
        })
        .catch(err => console.error('Erreur chargement users:', err));
    }
  }, [isAdmin]);

  // Préparer les paramètres pour useDeals
  const dealsParams = useMemo(() => {
    const params: {
      showAll?: boolean;
      ownerId?: string;
      sortBy?: 'value' | 'createdAt' | 'updatedAt' | 'expectedCloseDate';
      sortOrder?: 'asc' | 'desc';
      minValue?: number;
      maxValue?: number;
    } = {};

    // Filtre admin (propriétaire)
    if (isAdmin) {
      if (filterMode === 'all') {
        params.showAll = true;
      } else if (filterMode === 'user' && selectedUserId) {
        params.ownerId = selectedUserId;
      }
    }

    // Tri
    params.sortBy = sortBy;
    params.sortOrder = sortOrder;

    // Filtre par montant
    if (minValue !== '') {
      params.minValue = parseFloat(minValue);
    }
    if (maxValue !== '') {
      params.maxValue = parseFloat(maxValue);
    }

    return params;
  }, [isAdmin, filterMode, selectedUserId, sortBy, sortOrder, minValue, maxValue]);

  // Vérifier si des filtres sont actifs
  const hasActiveFilters = minValue !== '' || maxValue !== '';

  const { deals, isLoading, isError } = useDeals(dealsParams);

  const pipelineStages = useMemo(() => {
    return stageConfig.map(config => {
      const stageDeals = deals.filter(d => d.stage === config.id);
      return {
        id: config.id,
        name: config.name,
        color: config.color,
        deals: stageDeals.length,
        value: stageDeals.reduce((sum, d) => sum + d.value, 0),
      };
    });
  }, [deals]);

  const recentDeals = useMemo(() => {
    // Filtrer les deals non-closing
    let filteredDeals = deals.filter(d => d.stage !== 'CLOSING');

    // Si pas de filtre montant actif, limiter à 8 deals
    // Sinon afficher tous les deals filtrés
    if (!hasActiveFilters) {
      filteredDeals = filteredDeals.slice(0, 8);
    }

    return filteredDeals.map(d => ({
      ...d,
      daysInStage: getDaysInStage(d.updatedAt),
      trend: d.probability >= 70 ? 'up' as const : d.probability <= 40 ? 'down' as const : 'stable' as const,
      contactName: d.contacts ? `${d.contacts.firstName} ${d.contacts.lastName}` : 'N/A',
      companyName: d.companies?.name || d.title,
    }));
  }, [deals, hasActiveFilters]);

  const conversionRates = useMemo(() => {
    return stageConfig.slice(0, -1).map((stage, index) => {
      const currentStageCount = pipelineStages[index].deals;
      const nextStageCount = pipelineStages[index + 1].deals;
      const rate = currentStageCount > 0 ? Math.round((nextStageCount / currentStageCount) * 100) : 0;
      return {
        from: stage.name,
        to: stageConfig[index + 1].name,
        rate,
      };
    });
  }, [pipelineStages]);

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
        <div className="text-center">
          <p className="text-red-600 font-semibold mb-2">Erreur lors du chargement</p>
          <p className="text-gray-600 text-sm">{isError?.message || 'Une erreur est survenue'}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const totalValue = pipelineStages.reduce((sum, stage) => sum + stage.value, 0);
  const totalDeals = pipelineStages.reduce((sum, stage) => sum + stage.deals, 0);
  const avgDealSize = totalDeals > 0 ? Math.round(totalValue / totalDeals) : 0;
  const overallConversion = conversionRates.length > 0
    ? Math.round(conversionRates.reduce((sum, rate) => sum + rate.rate, 0) / conversionRates.length)
    : 0;

  const stats = [
    { label: 'Valeur Pipeline', value: `${totalValue.toLocaleString()}€`, color: 'text-orange-600', icon: Euro },
    { label: 'Deals Actifs', value: totalDeals, color: 'text-blue-600', icon: Activity },
    { label: 'Taille Moyenne', value: `${avgDealSize.toLocaleString()}€`, color: 'text-purple-600', icon: Target },
    { label: 'Taux Conversion', value: `${overallConversion}%`, color: 'text-green-600', icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-orange-600" />
                Pipeline de Ventes
              </h1>
              <p className="text-gray-600 mt-1">Visualisez et optimisez votre pipeline commercial</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {isAdmin && (
                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <select
                    value={filterMode}
                    onChange={(e) => {
                      setFilterMode(e.target.value as 'mine' | 'all' | 'user');
                      if (e.target.value !== 'user') {
                        setSelectedUserId('');
                      }
                    }}
                    className="border-0 bg-transparent text-sm font-medium text-gray-700 focus:ring-0 cursor-pointer"
                  >
                    <option value="mine">Mes deals</option>
                    <option value="all">Tous les deals</option>
                    <option value="user">Par commercial</option>
                  </select>

                  {filterMode === 'user' && (
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="border-l border-gray-200 pl-2 bg-transparent text-sm text-gray-700 focus:ring-0 cursor-pointer"
                    >
                      <option value="">Sélectionner...</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.firstName} {user.lastName}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Tri par */}
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-2">
                <ArrowUpDown className="h-4 w-4 text-gray-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="border-0 bg-transparent text-sm font-medium text-gray-700 focus:ring-0 cursor-pointer"
                >
                  <option value="value">Montant</option>
                  <option value="createdAt">Date création</option>
                  <option value="updatedAt">Date MAJ</option>
                  <option value="expectedCloseDate">Date clôture</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title={sortOrder === 'asc' ? 'Croissant' : 'Décroissant'}
                >
                  {sortOrder === 'asc' ? (
                    <ArrowUp className="h-4 w-4 text-orange-600" />
                  ) : (
                    <ArrowDown className="h-4 w-4 text-orange-600" />
                  )}
                </button>
              </div>

              {/* Filtre par montant */}
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-2">
                <Euro className="h-4 w-4 text-gray-500" />
                <input
                  type="number"
                  value={minValue}
                  onChange={(e) => setMinValue(e.target.value)}
                  placeholder="Min"
                  className="w-20 border-0 bg-transparent text-sm text-gray-700 focus:ring-0 placeholder:text-gray-400"
                />
                <span className="text-gray-400">-</span>
                <input
                  type="number"
                  value={maxValue}
                  onChange={(e) => setMaxValue(e.target.value)}
                  placeholder="Max"
                  className="w-20 border-0 bg-transparent text-sm text-gray-700 focus:ring-0 placeholder:text-gray-400"
                />
                {hasActiveFilters && (
                  <button
                    onClick={() => {
                      setMinValue('');
                      setMaxValue('');
                    }}
                    className="p-1 hover:bg-red-100 rounded transition-colors"
                    title="Réinitialiser les filtres"
                  >
                    <X className="h-4 w-4 text-red-500" />
                  </button>
                )}
              </div>

              {/* Bouton config couleurs */}
              <button
                onClick={() => {
                  setTempThreshold(String(colorThreshold));
                  setTempLowColor(lowColor);
                  setTempHighColor(highColor);
                  setShowColorModal(true);
                }}
                className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-2 hover:bg-gray-50 transition-colors"
                title="Configurer les couleurs par montant"
              >
                <Palette className="h-4 w-4 text-gray-500" />
              </button>

              <button
                onClick={() => router.push('/dashboard/crm/deals')}
                className="flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-semibold shadow-sm"
              >
                <Plus className="h-5 w-5" />
                Nouveau Deal
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
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

        {/* Pipeline Visualization */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Vue du Pipeline</h2>

          <div className="space-y-4">
            {pipelineStages.map((stage, index) => {
              const widthPercentage = (stage.value / totalValue) * 100;

              return (
                <div key={stage.id}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-gray-900">{stage.name}</span>
                      <span className="text-sm text-gray-600">
                        {stage.deals} deals • {stage.value.toLocaleString()}€
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {Math.round(widthPercentage)}%
                    </span>
                  </div>

                  <div className="relative h-12 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className={`h-full ${stage.color} transition-all duration-500 flex items-center justify-between px-4`}
                      style={{ width: `${widthPercentage}%` }}
                    >
                      <span className="text-white font-semibold text-sm">
                        {stage.deals} deals
                      </span>
                      <span className="text-white font-semibold text-sm">
                        {stage.value.toLocaleString()}€
                      </span>
                    </div>
                  </div>

                  {/* Conversion Rate */}
                  {index < pipelineStages.length - 1 && (
                    <div className="flex items-center justify-center py-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <ChevronRight className="h-4 w-4" />
                        <span className="font-semibold text-green-600">
                          {conversionRates[index]?.rate}% conversion
                        </span>
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Deals */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Deals Récents</h2>
              <button
                onClick={() => router.push('/dashboard/crm/deals')}
                className="flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700 font-semibold"
              >
                Voir tout
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              {recentDeals.map((deal) => (
                <div key={deal.id} className={`p-4 border border-gray-200 rounded-lg hover:border-orange-300 transition-colors cursor-pointer ${getDealColor(deal.value)}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{deal.companyName}</h3>
                      <p className="text-xs text-gray-500">{deal.contactName}</p>
                      <span className="inline-block mt-1 px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                        {getStageLabel(deal.stage)}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-orange-600">{deal.value.toLocaleString()}€</p>
                      <p
                        className="text-sm text-gray-600 cursor-help inline-flex items-center gap-1"
                        title="💡 Probabilité de conclusion - Chances estimées de gagner ce deal. Se met à jour automatiquement selon l'étape."
                        onMouseDown={(e) => e.stopPropagation()}
                        draggable={false}
                      >
                        {deal.probability}%
                        <span className="text-xs text-gray-400">ℹ️</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{deal.daysInStage} jours dans cette étape</span>
                    <span className={`px-2 py-1 rounded-full font-semibold ${
                      deal.trend === 'up' ? 'bg-green-100 text-green-700' :
                      deal.trend === 'down' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {deal.trend === 'up' ? '↑' : deal.trend === 'down' ? '↓' : '→'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Conversion Funnel */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Entonnoir de Conversion</h2>

            <div className="space-y-4">
              {pipelineStages.map((stage, index) => {
                const maxDeals = Math.max(...pipelineStages.map(s => s.deals));
                const widthPercentage = (stage.deals / maxDeals) * 100;

                return (
                  <div key={stage.id}>
                    <div className="flex items-center gap-4">
                      <div className="w-32">
                        <p className="text-sm font-semibold text-gray-900">{stage.name}</p>
                      </div>
                      <div className="flex-1">
                        <div className="h-10 bg-gray-100 rounded-lg overflow-hidden">
                          <div
                            className={`h-full ${stage.color} flex items-center justify-between px-3 transition-all duration-500`}
                            style={{ width: `${widthPercentage}%` }}
                          >
                            <span className="text-white font-semibold text-sm">{stage.deals}</span>
                          </div>
                        </div>
                      </div>
                      <div className="w-24 text-right">
                        <p className="text-sm font-bold text-gray-900">
                          {stage.value.toLocaleString()}€
                        </p>
                      </div>
                    </div>

                    {index < pipelineStages.length - 1 && conversionRates[index] && (
                      <div className="ml-32 mt-2 mb-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-px bg-gray-300 relative">
                            <ChevronRight className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          </div>
                          <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">
                            {conversionRates[index].rate}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-600">Taux de conversion global</span>
                <span className="text-2xl font-bold text-green-600">{overallConversion}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal configuration couleurs */}
      {showColorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowColorModal(false)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Palette className="h-5 w-5 text-orange-600" />
                Configuration des couleurs
              </h3>
              <button
                onClick={() => setShowColorModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Seuil de montant */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seuil de montant (€)
                </label>
                <input
                  type="number"
                  value={tempThreshold}
                  onChange={(e) => setTempThreshold(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="3000"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Les deals en dessous de ce montant auront la première couleur
                </p>
              </div>

              {/* Couleur pour petits montants */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Couleur pour montants &lt; {tempThreshold}€
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.id}
                      onClick={() => setTempLowColor(color.id)}
                      className={`p-2 rounded-lg border-2 transition-all ${
                        tempLowColor === color.id
                          ? 'border-orange-500 ring-2 ring-orange-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-full h-6 rounded ${color.preview}`} />
                      <span className="text-xs text-gray-600 mt-1 block">{color.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Couleur pour gros montants */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Couleur pour montants &ge; {tempThreshold}€
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.id}
                      onClick={() => setTempHighColor(color.id)}
                      className={`p-2 rounded-lg border-2 transition-all ${
                        tempHighColor === color.id
                          ? 'border-orange-500 ring-2 ring-orange-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-full h-6 rounded ${color.preview}`} />
                      <span className="text-xs text-gray-600 mt-1 block">{color.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Aperçu */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-2">Aperçu</p>
                <div className="flex gap-3">
                  <div className={`flex-1 p-3 rounded-lg border-l-4 ${colorOptions.find(c => c.id === tempLowColor)?.border} ${colorOptions.find(c => c.id === tempLowColor)?.bg}`}>
                    <p className="text-sm font-semibold">Deal 2 500€</p>
                    <p className="text-xs text-gray-500">&lt; {tempThreshold}€</p>
                  </div>
                  <div className={`flex-1 p-3 rounded-lg border-l-4 ${colorOptions.find(c => c.id === tempHighColor)?.border} ${colorOptions.find(c => c.id === tempHighColor)?.bg}`}>
                    <p className="text-sm font-semibold">Deal 5 000€</p>
                    <p className="text-xs text-gray-500">&ge; {tempThreshold}€</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowColorModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={saveColorSettings}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
