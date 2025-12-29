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
  Settings,
  Edit2,
  TrendingDown,
} from 'lucide-react';
import { EnterpriseObjective, METRIC_TYPE_COLORS } from '@/hooks/useEnterpriseObjectives';

interface ObjectiveCardProps {
  objective: EnterpriseObjective;
  onEdit?: (objective: EnterpriseObjective) => void;
  delay?: number;
  compact?: boolean;
}

const ICONS = {
  CA_MENSUEL: Euro,
  CA_GENERE: TrendingUp,
  NOUVEAUX_DEALS: Users,
  RDV_REALISES: Calendar,
  APPELS_EFFECTUES: Phone,
  DEVIS_ENVOYES: FileText,
  TAUX_CONVERSION: Target,
  CUSTOM: Settings,
};

const COLOR_CLASSES = {
  green: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: 'bg-green-100 text-green-600',
    progress: 'bg-green-500',
    text: 'text-green-600',
  },
  emerald: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: 'bg-emerald-100 text-emerald-600',
    progress: 'bg-emerald-500',
    text: 'text-emerald-600',
  },
  violet: {
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    icon: 'bg-violet-100 text-violet-600',
    progress: 'bg-violet-500',
    text: 'text-violet-600',
  },
  orange: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    icon: 'bg-orange-100 text-orange-600',
    progress: 'bg-orange-500',
    text: 'text-orange-600',
  },
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'bg-blue-100 text-blue-600',
    progress: 'bg-blue-500',
    text: 'text-blue-600',
  },
  pink: {
    bg: 'bg-pink-50',
    border: 'border-pink-200',
    icon: 'bg-pink-100 text-pink-600',
    progress: 'bg-pink-500',
    text: 'text-pink-600',
  },
  cyan: {
    bg: 'bg-cyan-50',
    border: 'border-cyan-200',
    icon: 'bg-cyan-100 text-cyan-600',
    progress: 'bg-cyan-500',
    text: 'text-cyan-600',
  },
  gray: {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    icon: 'bg-gray-100 text-gray-600',
    progress: 'bg-gray-500',
    text: 'text-gray-600',
  },
};

export function ObjectiveCard({ objective, onEdit, delay = 0, compact = false }: ObjectiveCardProps) {
  const Icon = ICONS[objective.metricType] || Settings;
  const colorKey = METRIC_TYPE_COLORS[objective.metricType] || 'gray';
  const colors = COLOR_CLASSES[colorKey as keyof typeof COLOR_CLASSES] || COLOR_CLASSES.gray;

  const formatValue = (value: number) => {
    if (objective.metricType === 'CA_MENSUEL' || objective.metricType === 'CA_GENERE') {
      return `${value.toLocaleString()} EUR`;
    }
    if (objective.metricType === 'TAUX_CONVERSION') {
      return `${value}%`;
    }
    return value.toLocaleString();
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-emerald-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay }}
        className={`p-4 rounded-xl border-2 ${colors.bg} ${colors.border} hover:shadow-md transition-shadow`}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className={`p-2 rounded-lg ${colors.icon}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 truncate">{objective.title}</h4>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className={`text-2xl font-bold ${colors.text}`}>
              {formatValue(objective.currentValue)}
            </span>
            <span className="text-sm text-gray-500">
              / {formatValue(objective.targetValue)}
            </span>
          </div>

          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(objective.percentage, 100)}%` }}
              transition={{ delay: delay + 0.2, duration: 0.5 }}
              className={`h-full ${getProgressColor(objective.percentage)} rounded-full`}
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className={`font-semibold ${objective.percentage >= 100 ? 'text-green-600' : 'text-gray-600'}`}>
              {objective.percentage}%
            </span>
            {objective.remaining > 0 && (
              <span className="text-gray-500">
                Reste: {formatValue(objective.remaining)}
              </span>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`p-6 rounded-xl border-2 ${colors.bg} ${colors.border} hover:shadow-lg transition-all`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl ${colors.icon}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{objective.title}</h3>
            {objective.description && (
              <p className="text-sm text-gray-500 mt-1">{objective.description}</p>
            )}
          </div>
        </div>
        {onEdit && (
          <button
            onClick={() => onEdit(objective)}
            className="p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
          >
            <Edit2 className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-baseline justify-between">
          <div>
            <span className={`text-3xl font-bold ${colors.text}`}>
              {formatValue(objective.currentValue)}
            </span>
            <span className="text-gray-400 mx-2">/</span>
            <span className="text-xl text-gray-600">
              {formatValue(objective.targetValue)}
            </span>
          </div>
          <div className={`text-2xl font-bold ${objective.percentage >= 100 ? 'text-green-600' : 'text-gray-700'}`}>
            {objective.percentage}%
          </div>
        </div>

        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(objective.percentage, 100)}%` }}
            transition={{ delay: delay + 0.2, duration: 0.5 }}
            className={`h-full ${getProgressColor(objective.percentage)} rounded-full`}
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            {objective.remaining > 0 && (
              <span className="text-gray-500">
                Reste: <span className="font-semibold">{formatValue(objective.remaining)}</span>
              </span>
            )}
            {objective.projection !== null && (
              <span className="text-gray-500 flex items-center gap-1">
                Projection:
                <span className={`font-semibold flex items-center gap-1 ${
                  objective.projection >= objective.targetValue ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {objective.projection >= objective.targetValue ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  {formatValue(objective.projection)}
                </span>
              </span>
            )}
          </div>
          {objective.percentage >= 100 && (
            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
              Objectif atteint
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
