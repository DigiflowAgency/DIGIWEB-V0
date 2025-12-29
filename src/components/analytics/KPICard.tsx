'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  variation?: number | null;
  icon: LucideIcon;
  color: 'violet' | 'green' | 'blue' | 'orange' | 'pink' | 'cyan' | 'emerald' | 'yellow' | 'red';
  format?: 'currency' | 'percent' | 'number' | 'days';
  delay?: number;
}

const colorClasses = {
  violet: {
    gradient: 'from-violet-500 to-violet-600',
    bg: 'bg-violet-50',
    text: 'text-violet-600',
  },
  green: {
    gradient: 'from-green-500 to-emerald-600',
    bg: 'bg-green-50',
    text: 'text-green-600',
  },
  blue: {
    gradient: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-50',
    text: 'text-blue-600',
  },
  orange: {
    gradient: 'from-orange-500 to-orange-600',
    bg: 'bg-orange-50',
    text: 'text-orange-600',
  },
  pink: {
    gradient: 'from-pink-500 to-pink-600',
    bg: 'bg-pink-50',
    text: 'text-pink-600',
  },
  cyan: {
    gradient: 'from-cyan-500 to-cyan-600',
    bg: 'bg-cyan-50',
    text: 'text-cyan-600',
  },
  emerald: {
    gradient: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
  },
  yellow: {
    gradient: 'from-yellow-500 to-yellow-600',
    bg: 'bg-yellow-50',
    text: 'text-yellow-600',
  },
  red: {
    gradient: 'from-red-500 to-red-600',
    bg: 'bg-red-50',
    text: 'text-red-600',
  },
};

export function KPICard({
  title,
  value,
  variation,
  icon: Icon,
  color,
  format = 'number',
  delay = 0,
}: KPICardProps) {
  const colors = colorClasses[color];

  const formatValue = (val: string | number): string => {
    if (typeof val === 'string') return val;

    switch (format) {
      case 'currency':
        return `${val.toLocaleString('fr-FR')} EUR`;
      case 'percent':
        return `${val}%`;
      case 'days':
        return `${val} jours`;
      default:
        return val.toLocaleString('fr-FR');
    }
  };

  const renderVariation = () => {
    if (variation === null || variation === undefined) return null;

    const isPositive = variation > 0;
    const isNeutral = variation === 0;

    return (
      <div
        className={`flex items-center gap-1 text-sm font-medium ${
          isNeutral
            ? 'text-gray-500'
            : isPositive
            ? 'text-green-600'
            : 'text-red-600'
        }`}
      >
        {isNeutral ? (
          <Minus className="h-4 w-4" />
        ) : isPositive ? (
          <TrendingUp className="h-4 w-4" />
        ) : (
          <TrendingDown className="h-4 w-4" />
        )}
        <span>{isPositive ? '+' : ''}{variation}%</span>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="card-premium p-6 group hover:scale-[1.02] transition-transform"
    >
      <div className="flex items-center justify-between mb-4">
        <div
          className={`p-3 rounded-xl bg-gradient-to-br ${colors.gradient} group-hover:scale-110 transition-transform duration-300`}
        >
          <Icon className="h-6 w-6 text-white" />
        </div>
        {renderVariation()}
      </div>
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900">{formatValue(value)}</p>
    </motion.div>
  );
}
