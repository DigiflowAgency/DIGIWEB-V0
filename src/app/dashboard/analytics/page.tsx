'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Loader2,
  Filter,
  Euro,
  CheckCircle,
  Users,
  FileText,
  Target,
  ShoppingCart,
  Briefcase,
  TrendingUp,
  Clock,
  Calendar,
} from 'lucide-react';
import {
  KPICard,
  EvolutionChart,
  PipelineChart,
  ActivityChart,
  QualificationChart,
  AlertsPanel,
  FunnelChart,
  CommerciauxTable,
} from '@/components/analytics';

interface Analytics {
  period: {
    current: { start: string; end: string; label: string };
    previous: { start: string; end: string } | null;
  };
  kpis: {
    current: {
      caGenere: number;
      caEncaisse: number;
      leads: number;
      devisEnvoyes: number;
      conversionRate: number;
      panierMoyen: number;
      activeDeals: number;
      forecastCA: number;
      tempsClosing: number;
    };
    previous: {
      caGenere: number;
      caEncaisse: number;
      leads: number;
      devisEnvoyes: number;
      panierMoyen: number;
      tempsClosing: number;
    } | null;
    variations: {
      caGenere: number;
      caEncaisse: number;
      leads: number;
      devisEnvoyes: number;
      panierMoyen: number;
      tempsClosing: number;
    } | null;
  };
  activities: {
    appels: {
      total: number;
      repondus: number;
      messagerie: number;
      pasReponse: number;
      rappel: number;
      tauxReponse: number;
      dureeMoyenne: number;
    };
    rdv: {
      total: number;
      effectues: number;
      annules: number;
      tauxHonore: number;
      dureeMoyenne: number;
    };
    emails: { total: number };
  };
  qualification: {
    temperature: { hot: number; warm: number; cold: number };
    budget: { discute: number; nonDiscute: number };
    decideur: { identifie: number; nonIdentifie: number };
    objections: Array<{ type: string; label: string; count: number; percentage: number }>;
    nextActions: Array<{ type: string; label: string; count: number }>;
  };
  pipeline: {
    byStage: Array<{ stage: string; label: string; count: number; value: number }>;
    total: { count: number; value: number; weighted: number; avgDeal: number };
  };
  devis: {
    envoyes: number;
    acceptes: number;
    refuses: number;
    expires: number;
    enAttente: number;
    tauxAcceptation: number;
    valeurMoyenne: number;
    tempsMoyenAcceptation: number;
    expirantSemaine: number;
  };
  funnel: {
    leads: number;
    contacts: number;
    rdvPris: number;
    devisEnvoyes: number;
    signatures: number;
    taux: {
      leadToContact: number;
      contactToRdv: number;
      rdvToDevis: number;
      devisToSignature: number;
      global: number;
    };
  };
  evolution: {
    monthly: Array<{ month: string; ca: number; leads: number; deals: number; devis: number }>;
    weekly: Array<{ week: string; startDate: string; ca: number; appels: number; rdv: number }>;
  };
  alerts: Array<{
    type: 'WARNING' | 'CRITICAL' | 'INFO';
    title: string;
    description: string;
    count?: number;
    link?: string;
  }>;
  commerciaux: Array<{
    id: string;
    name: string;
    avatar: string | null;
    ca: number;
    caVariation: number;
    deals: number;
    appels: number;
    rdv: number;
    tauxClosing: number;
    sparkline: number[];
  }>;
  insights: {
    bestDay: string;
    bestDayPercentage: number;
    avgClosingTime: number;
    closingTimeVariation: number;
  };
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?period=${period}`);
      const data = await res.json();
      setAnalytics(data.analytics);
    } catch (error) {
      console.error('Erreur lors du chargement des analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      fetchAnalytics();
    }
  }, [status, session, period, fetchAnalytics]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-violet-600" />
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const { kpis, activities, qualification, pipeline, funnel, evolution, alerts, commerciaux, insights } = analytics;

  return (
    <div className="min-h-screen gradient-mesh py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-700 to-orange-500 bg-clip-text text-transparent flex items-center gap-3">
                <BarChart3 className="h-10 w-10 text-violet-600" />
                Analytics
              </h1>
              <p className="mt-2 text-gray-600">
                {analytics.period.current.label}
                {analytics.period.previous && (
                  <span className="text-sm text-gray-500 ml-2">
                    ({analytics.period.current.start} - {analytics.period.current.end})
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="input-field"
              >
                <option value="week">7 derniers jours</option>
                <option value="month">30 derniers jours</option>
                <option value="quarter">3 derniers mois</option>
                <option value="year">12 derniers mois</option>
                <option value="all">Depuis le debut</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* KPIs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          <KPICard
            title="CA Genere"
            value={kpis.current.caGenere}
            variation={kpis.variations?.caGenere}
            icon={Euro}
            color="green"
            format="currency"
            delay={0.05}
          />
          <KPICard
            title="CA Encaisse"
            value={kpis.current.caEncaisse}
            variation={kpis.variations?.caEncaisse}
            icon={CheckCircle}
            color="emerald"
            format="currency"
            delay={0.1}
          />
          <KPICard
            title="Nouveaux Leads"
            value={kpis.current.leads}
            variation={kpis.variations?.leads}
            icon={Users}
            color="blue"
            delay={0.15}
          />
          <KPICard
            title="Devis Envoyes"
            value={kpis.current.devisEnvoyes}
            variation={kpis.variations?.devisEnvoyes}
            icon={FileText}
            color="violet"
            delay={0.2}
          />
          <KPICard
            title="Taux Conversion"
            value={kpis.current.conversionRate}
            icon={Target}
            color="orange"
            format="percent"
            delay={0.25}
          />
          <KPICard
            title="Panier Moyen"
            value={kpis.current.panierMoyen}
            variation={kpis.variations?.panierMoyen}
            icon={ShoppingCart}
            color="pink"
            format="currency"
            delay={0.3}
          />
          <KPICard
            title="Deals Actifs"
            value={kpis.current.activeDeals}
            icon={Briefcase}
            color="violet"
            delay={0.35}
          />
          <KPICard
            title="Previsions CA"
            value={kpis.current.forecastCA}
            icon={TrendingUp}
            color="yellow"
            format="currency"
            delay={0.4}
          />
          <KPICard
            title="Temps Closing"
            value={kpis.current.tempsClosing}
            variation={kpis.variations?.tempsClosing}
            icon={Clock}
            color="cyan"
            format="days"
            delay={0.45}
          />
          <KPICard
            title="Taux Acceptation Devis"
            value={analytics.devis.tauxAcceptation}
            icon={CheckCircle}
            color="emerald"
            format="percent"
            delay={0.5}
          />
          <KPICard
            title="Total Appels"
            value={activities.appels.total}
            icon={Calendar}
            color="violet"
            delay={0.55}
          />
          <KPICard
            title="RDV Effectues"
            value={activities.rdv.effectues}
            icon={Calendar}
            color="cyan"
            delay={0.6}
          />
        </div>

        {/* Evolution Chart */}
        <div className="mb-8">
          <EvolutionChart data={evolution.monthly} />
        </div>

        {/* Pipeline & Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <PipelineChart data={pipeline.byStage} total={pipeline.total} />
          <ActivityChart data={activities} />
        </div>

        {/* Qualification */}
        <div className="mb-8">
          <QualificationChart data={qualification} />
        </div>

        {/* Alerts & Funnel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <AlertsPanel alerts={alerts} insights={insights} />
          <FunnelChart data={funnel} />
        </div>

        {/* Commerciaux Table */}
        <div className="mb-8">
          <CommerciauxTable data={commerciaux} />
        </div>
      </div>
    </div>
  );
}
