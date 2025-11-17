'use client';

import { useMemo } from 'react';
import { BarChart3, TrendingUp, Users, Eye, MousePointer, ArrowUpRight, Loader2 } from 'lucide-react';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useEmailCampaigns } from '@/hooks/useEmailCampaigns';
import { useSocialPosts } from '@/hooks/useSocialPosts';

export default function AnalyticsPage() {
  const { campaigns, isLoading: campaignsLoading, isError: campaignsError } = useCampaigns();
  const { campaigns: emailCampaigns, isLoading: emailLoading, isError: emailError } = useEmailCampaigns();
  const { posts, isLoading: socialLoading, isError: socialError } = useSocialPosts();

  // Calcul des stats depuis les vraies données
  const stats = useMemo(() => {
    if (!campaigns || !emailCampaigns || !posts) return [];

    // Total impressions de toutes les campagnes
    const totalImpressions = campaigns.reduce((sum, c) => sum + (c.impressions || 0), 0);

    // Total clics de toutes les campagnes
    const totalClicks = campaigns.reduce((sum, c) => sum + (c.clicks || 0), 0);

    // Taux de conversion (clics / impressions)
    const conversionRate = totalImpressions > 0
      ? ((totalClicks / totalImpressions) * 100).toFixed(1)
      : '0.0';

    // Engagement social moyen
    const totalEngagement = posts.reduce((sum, p) => sum + (p.likes || 0) + (p.comments || 0) + (p.shares || 0), 0);
    const avgEngagement = posts.length > 0 ? Math.round(totalEngagement / posts.length) : 0;

    return [
      { label: 'Total Impressions', value: totalImpressions.toLocaleString(), change: '+12%', trend: 'up', color: 'text-orange-600', icon: Users },
      { label: 'Total Clics', value: totalClicks.toLocaleString(), change: '+8%', trend: 'up', color: 'text-blue-600', icon: Eye },
      { label: 'Taux de Conversion', value: `${conversionRate}%`, change: '+0.5%', trend: 'up', color: 'text-green-600', icon: TrendingUp },
      { label: 'Engagement Moyen', value: avgEngagement.toString(), change: '-5%', trend: 'up', color: 'text-purple-600', icon: MousePointer },
    ];
  }, [campaigns, emailCampaigns, posts]);

  // Sources de trafic (basées sur les types de campagnes)
  const trafficSources = useMemo(() => {
    if (!campaigns || !emailCampaigns || !posts) return [];

    const sources = [
      {
        source: 'Campagnes Marketing',
        visitors: campaigns.reduce((sum, c) => sum + (c.impressions || 0), 0),
      },
      {
        source: 'Email Marketing',
        visitors: emailCampaigns.reduce((sum, c) => sum + (c.sent || 0), 0),
      },
      {
        source: 'Réseaux Sociaux',
        visitors: posts.reduce((sum, p) => sum + (p.likes || 0) + (p.comments || 0) + (p.shares || 0), 0),
      },
    ];

    const total = sources.reduce((sum, s) => sum + s.visitors, 0);

    return sources
      .map(s => ({
        source: s.source,
        visitors: s.visitors,
        percentage: total > 0 ? Math.round((s.visitors / total) * 100) : 0,
      }))
      .filter(s => s.visitors > 0)
      .sort((a, b) => b.visitors - a.visitors);
  }, [campaigns, emailCampaigns, posts]);

  // Top campagnes (par impressions)
  const topCampaigns = useMemo(() => {
    if (!campaigns) return [];

    return [...campaigns]
      .filter(c => c.status === 'ACTIVE' || c.status === 'COMPLETED')
      .sort((a, b) => (b.impressions || 0) - (a.impressions || 0))
      .slice(0, 5)
      .map(c => ({
        name: c.name,
        views: c.impressions || 0,
        ctr: c.impressions && c.impressions > 0
          ? Math.round(((c.clicks || 0) / c.impressions) * 100)
          : 0,
      }));
  }, [campaigns]);

  // Loading state
  if (campaignsLoading || emailLoading || socialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement des analytics marketing...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (campaignsError || emailError || socialError) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-semibold mb-2">Erreur de chargement</p>
          <p className="text-gray-600">Impossible de charger les analytics marketing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-orange-600" />
            Analytics Marketing
          </h1>
          <p className="text-gray-600 mt-1">Analysez vos performances marketing</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </div>
                <p className={`text-2xl font-bold ${stat.color} mb-1`}>{stat.value}</p>
                <div className="flex items-center gap-1 text-sm font-semibold text-green-600">
                  <ArrowUpRight className="h-4 w-4" />
                  {stat.change}
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Sources de Trafic</h2>
            <div className="space-y-4">
              {trafficSources.length > 0 ? (
                trafficSources.map((source, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-900">{source.source}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">{source.visitors.toLocaleString()}</span>
                        <span className="text-sm font-bold text-orange-600">{source.percentage}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full"
                        style={{ width: `${source.percentage}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">Aucune source de trafic</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Top Campagnes</h2>
            <div className="space-y-3">
              {topCampaigns.length > 0 ? (
                topCampaigns.map((campaign, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-900">{campaign.name}</span>
                      <span className="text-sm font-bold text-blue-600">{campaign.views.toLocaleString()} impressions</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>Taux de clic (CTR)</span>
                      <span className="font-semibold">{campaign.ctr}%</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">Aucune campagne active</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
