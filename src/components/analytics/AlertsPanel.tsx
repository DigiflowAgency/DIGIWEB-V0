'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, AlertCircle, Info, ChevronRight, Lightbulb, TrendingUp, Clock, Calendar } from 'lucide-react';
import Link from 'next/link';

interface Alert {
  type: 'WARNING' | 'CRITICAL' | 'INFO';
  title: string;
  description: string;
  count?: number;
  link?: string;
}

interface Insight {
  bestDay: string;
  bestDayPercentage: number;
  avgClosingTime: number;
  closingTimeVariation: number;
}

interface AlertsPanelProps {
  alerts: Alert[];
  insights: Insight;
}

const alertStyles = {
  CRITICAL: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: AlertCircle,
    iconColor: 'text-red-600',
    titleColor: 'text-red-900',
    textColor: 'text-red-700',
  },
  WARNING: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: AlertTriangle,
    iconColor: 'text-amber-600',
    titleColor: 'text-amber-900',
    textColor: 'text-amber-700',
  },
  INFO: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: Info,
    iconColor: 'text-blue-600',
    titleColor: 'text-blue-900',
    textColor: 'text-blue-700',
  },
};

export function AlertsPanel({ alerts, insights }: AlertsPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
      className="card-premium p-6"
    >
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-violet-600" />
          Alertes & Insights
        </h3>
        <p className="text-sm text-gray-500 mt-1">Actions recommandees et informations</p>
      </div>

      <div className="space-y-4">
        {/* Alerts */}
        {alerts.length > 0 ? (
          alerts.map((alert, index) => {
            const style = alertStyles[alert.type];
            const Icon = style.icon;

            return (
              <div
                key={index}
                className={`${style.bg} ${style.border} border rounded-lg p-4`}
              >
                <div className="flex items-start gap-3">
                  <Icon className={`h-5 w-5 ${style.iconColor} flex-shrink-0 mt-0.5`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className={`font-semibold ${style.titleColor}`}>
                        {alert.title}
                        {alert.count && (
                          <span className="ml-2 px-2 py-0.5 rounded-full bg-white text-xs">
                            {alert.count}
                          </span>
                        )}
                      </h4>
                      {alert.link && (
                        <Link
                          href={alert.link}
                          className={`${style.iconColor} hover:opacity-70 transition-opacity`}
                        >
                          <ChevronRight className="h-5 w-5" />
                        </Link>
                      )}
                    </div>
                    <p className={`text-sm ${style.textColor} mt-1`}>
                      {alert.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-full">
                <Info className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-sm text-green-700">Aucune alerte - Tout est en ordre !</p>
            </div>
          </div>
        )}

        {/* Insights */}
        <div className="pt-4 border-t border-gray-200">
          <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            Insights
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-violet-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-violet-600" />
                <span className="text-sm font-medium text-violet-900">Meilleur jour</span>
              </div>
              <p className="text-lg font-bold text-violet-700">{insights.bestDay}</p>
              <p className="text-xs text-violet-600">{insights.bestDayPercentage}% des ventes</p>
            </div>

            <div className="bg-cyan-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-cyan-600" />
                <span className="text-sm font-medium text-cyan-900">Temps closing</span>
              </div>
              <p className="text-lg font-bold text-cyan-700">{insights.avgClosingTime} jours</p>
              <p className="text-xs text-cyan-600">
                {insights.closingTimeVariation > 0 ? '+' : ''}
                {insights.closingTimeVariation}% vs periode prec.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
