'use client';

import { useMemo } from 'react';
import {
  BarChart3,
  Plus,
  TrendingUp,
  Euro,
  Target,
  Activity,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { useDeals } from '@/hooks/useDeals';
import { useRouter } from 'next/navigation';

type DealStage = 'DECOUVERTE' | 'QUALIFICATION' | 'PROPOSITION' | 'NEGOCIATION' | 'GAGNE';

const stageConfig = [
  { id: 'DECOUVERTE' as DealStage, name: 'Découverte', color: 'bg-purple-500' },
  { id: 'QUALIFICATION' as DealStage, name: 'Qualification', color: 'bg-blue-500' },
  { id: 'PROPOSITION' as DealStage, name: 'Proposition', color: 'bg-yellow-500' },
  { id: 'NEGOCIATION' as DealStage, name: 'Négociation', color: 'bg-orange-500' },
  { id: 'GAGNE' as DealStage, name: 'Gagné', color: 'bg-green-500' },
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
  const { deals, isLoading, isError } = useDeals();

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
    return deals
      .filter(d => d.stage !== 'PERDU' && d.stage !== 'GAGNE')
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 8)
      .map(d => ({
        ...d,
        daysInStage: getDaysInStage(d.updatedAt),
        trend: d.probability >= 70 ? 'up' as const : d.probability <= 40 ? 'down' as const : 'stable' as const,
      }));
  }, [deals]);

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
        <p className="text-red-600">Erreur lors du chargement</p>
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
            <button
              onClick={() => router.push('/dashboard/crm/deals')}
              className="flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-semibold shadow-sm"
            >
              <Plus className="h-5 w-5" />
              Nouveau Deal
            </button>
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
                <div key={deal.id} className="p-4 border border-gray-200 rounded-lg hover:border-orange-300 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{deal.title}</h3>
                      <span className="text-sm text-gray-600">{getStageLabel(deal.stage)}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-orange-600">{deal.value.toLocaleString()}€</p>
                      <p className="text-sm text-gray-600">{deal.probability}%</p>
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
    </div>
  );
}
