'use client';

import { motion } from 'framer-motion';
import {
  Euro,
  TrendingUp,
  Users,
  Calendar,
  Phone,
  FileText,
  Target,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { EnterpriseObjective, METRIC_TYPE_COLORS } from '@/hooks/useEnterpriseObjectives';

interface ObjectiveOverviewProps {
  objectives: EnterpriseObjective[];
  isLoading?: boolean;
}

const ICONS: Record<string, React.ElementType> = {
  CA_MENSUEL: Euro,
  CA_GENERE: TrendingUp,
  NOUVEAUX_DEALS: Users,
  RDV_REALISES: Calendar,
  APPELS_EFFECTUES: Phone,
  DEVIS_ENVOYES: FileText,
  TAUX_CONVERSION: Target,
  CUSTOM: Target,
};

const COLOR_CLASSES: Record<string, { bg: string; border: string; icon: string; text: string }> = {
  green: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: 'bg-green-100 text-green-600',
    text: 'text-green-600',
  },
  emerald: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: 'bg-emerald-100 text-emerald-600',
    text: 'text-emerald-600',
  },
  violet: {
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    icon: 'bg-violet-100 text-violet-600',
    text: 'text-violet-600',
  },
  orange: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    icon: 'bg-orange-100 text-orange-600',
    text: 'text-orange-600',
  },
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'bg-blue-100 text-blue-600',
    text: 'text-blue-600',
  },
  pink: {
    bg: 'bg-pink-50',
    border: 'border-pink-200',
    icon: 'bg-pink-100 text-pink-600',
    text: 'text-pink-600',
  },
  cyan: {
    bg: 'bg-cyan-50',
    border: 'border-cyan-200',
    icon: 'bg-cyan-100 text-cyan-600',
    text: 'text-cyan-600',
  },
  gray: {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    icon: 'bg-gray-100 text-gray-600',
    text: 'text-gray-600',
  },
};

function formatValue(value: number, metricType: string): string {
  if (metricType === 'CA_MENSUEL' || metricType === 'CA_GENERE') {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return `${value.toLocaleString()}`;
  }
  if (metricType === 'TAUX_CONVERSION') {
    return `${value}%`;
  }
  return value.toLocaleString();
}

function getProgressColor(percentage: number): string {
  if (percentage >= 100) return 'bg-green-500';
  if (percentage >= 75) return 'bg-emerald-500';
  if (percentage >= 50) return 'bg-yellow-500';
  if (percentage >= 25) return 'bg-orange-500';
  return 'bg-red-500';
}

function KPICard({ objective, index }: { objective: EnterpriseObjective; index: number }) {
  const Icon = ICONS[objective.metricType] || Target;
  const colorKey = METRIC_TYPE_COLORS[objective.metricType] || 'gray';
  const colors = COLOR_CLASSES[colorKey] || COLOR_CLASSES.gray;
  const isCompleted = objective.percentage >= 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`relative p-4 rounded-xl border-2 ${colors.bg} ${colors.border} hover:shadow-lg transition-all cursor-pointer group`}
    >
      {isCompleted && (
        <div className="absolute -top-2 -right-2">
          <div className="bg-green-500 text-white rounded-full p-1">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2.5 rounded-xl ${colors.icon} group-hover:scale-110 transition-transform`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-600 truncate">
            {objective.title.replace(/\s+(Janvier|Fevrier|Mars|Avril|Mai|Juin|Juillet|Aout|Septembre|Octobre|Novembre|Decembre)\s+\d{4}/i, '')}
          </h4>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <span className={`text-2xl font-bold ${colors.text}`}>
            {formatValue(objective.currentValue, objective.metricType)}
          </span>
          <span className="text-sm text-gray-500">
            / {formatValue(objective.targetValue, objective.metricType)}
          </span>
        </div>

        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(objective.percentage, 100)}%` }}
            transition={{ delay: index * 0.1 + 0.3, duration: 0.5, ease: 'easeOut' }}
            className={`h-full ${getProgressColor(objective.percentage)} rounded-full`}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className={`text-lg font-bold ${isCompleted ? 'text-green-600' : 'text-gray-700'}`}>
            {objective.percentage}%
          </span>
          {objective.remaining > 0 && (
            <span className="text-xs text-gray-500">
              -{formatValue(objective.remaining, objective.metricType)}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function ObjectiveOverview({ objectives, isLoading }: ObjectiveOverviewProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (objectives.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-12 text-center"
      >
        <div className="p-4 bg-gray-100 rounded-full mb-4">
          <AlertCircle className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Aucun objectif defini</h3>
        <p className="text-gray-500 max-w-md">
          Les objectifs du mois n&apos;ont pas encore ete configures.
          Cliquez sur &quot;Initialiser le mois&quot; pour commencer.
        </p>
      </motion.div>
    );
  }

  const completedCount = objectives.filter(o => o.percentage >= 100).length;
  const averageCompletion = Math.round(
    objectives.reduce((sum, o) => sum + o.percentage, 0) / objectives.length
  );

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-500" />
            <span className="text-sm text-gray-600">
              <span className="font-semibold">{completedCount}</span> / {objectives.length} atteints
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-violet-600" />
            <span className="text-sm text-gray-600">
              Moyenne: <span className="font-semibold">{averageCompletion}%</span>
            </span>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {objectives.map((objective, index) => (
          <KPICard key={objective.id} objective={objective} index={index} />
        ))}
      </div>
    </div>
  );
}
