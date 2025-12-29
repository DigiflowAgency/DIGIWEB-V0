'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Calendar, Loader2 } from 'lucide-react';
import { MONTH_NAMES, METRIC_TYPE_LABELS } from '@/hooks/useEnterpriseObjectives';

interface HistoryData {
  month: number;
  year: number;
  metricType: string;
  targetValue: number;
  currentValue: number;
  percentage: number;
}

interface ObjectiveHistoryProps {
  data: HistoryData[];
  isLoading?: boolean;
  selectedMetricType?: string;
  onMetricTypeChange?: (type: string) => void;
}

const CHART_COLORS = {
  target: '#9CA3AF',
  current: '#8B5CF6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
};

function getBarColor(percentage: number): string {
  if (percentage >= 100) return CHART_COLORS.success;
  if (percentage >= 75) return CHART_COLORS.current;
  if (percentage >= 50) return CHART_COLORS.warning;
  return CHART_COLORS.danger;
}

function getTrendIcon(data: HistoryData[]) {
  if (data.length < 2) return <Minus className="h-5 w-5 text-gray-400" />;

  const lastTwo = data.slice(-2);
  const trend = lastTwo[1].percentage - lastTwo[0].percentage;

  if (trend > 5) return <TrendingUp className="h-5 w-5 text-green-500" />;
  if (trend < -5) return <TrendingDown className="h-5 w-5 text-red-500" />;
  return <Minus className="h-5 w-5 text-gray-400" />;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0]?.payload;

  return (
    <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200">
      <p className="font-semibold text-gray-800 mb-2">{label}</p>
      <div className="space-y-1 text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="text-gray-600">Objectif:</span>
          <span className="font-semibold">{data?.targetValue?.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-gray-600">Realise:</span>
          <span className="font-semibold text-violet-600">{data?.currentValue?.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-gray-600">Completion:</span>
          <span className={`font-bold ${data?.percentage >= 100 ? 'text-green-600' : 'text-gray-700'}`}>
            {data?.percentage}%
          </span>
        </div>
      </div>
    </div>
  );
}

export function ObjectiveHistory({
  data,
  isLoading,
  selectedMetricType = 'CA_MENSUEL',
  onMetricTypeChange,
}: ObjectiveHistoryProps) {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  const chartData = useMemo(() => {
    return data
      .filter(d => d.metricType === selectedMetricType)
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      })
      .map(d => ({
        ...d,
        name: `${MONTH_NAMES[d.month - 1].slice(0, 3)} ${d.year.toString().slice(-2)}`,
        fullName: `${MONTH_NAMES[d.month - 1]} ${d.year}`,
      }));
  }, [data, selectedMetricType]);

  const stats = useMemo(() => {
    if (chartData.length === 0) return null;

    const avgPercentage = Math.round(
      chartData.reduce((sum, d) => sum + d.percentage, 0) / chartData.length
    );
    const successCount = chartData.filter(d => d.percentage >= 100).length;
    const bestMonth = chartData.reduce((best, d) => (d.percentage > best.percentage ? d : best), chartData[0]);
    const worstMonth = chartData.reduce((worst, d) => (d.percentage < worst.percentage ? d : worst), chartData[0]);

    return { avgPercentage, successCount, bestMonth, worstMonth };
  }, [chartData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  const metricTypes = Array.from(new Set(data.map(d => d.metricType)));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Metric Type Selector */}
      {metricTypes.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {metricTypes.map(type => (
            <button
              key={type}
              onClick={() => onMetricTypeChange?.(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedMetricType === type
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {METRIC_TYPE_LABELS[type as keyof typeof METRIC_TYPE_LABELS] || type}
            </button>
          ))}
        </div>
      )}

      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-violet-50 rounded-xl border border-violet-200">
            <div className="text-sm text-violet-600 mb-1">Moyenne</div>
            <div className="text-2xl font-bold text-violet-700">{stats.avgPercentage}%</div>
          </div>
          <div className="p-4 bg-green-50 rounded-xl border border-green-200">
            <div className="text-sm text-green-600 mb-1">Objectifs atteints</div>
            <div className="text-2xl font-bold text-green-700">
              {stats.successCount}/{chartData.length}
            </div>
          </div>
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
            <div className="text-sm text-emerald-600 mb-1">Meilleur mois</div>
            <div className="text-lg font-bold text-emerald-700">
              {stats.bestMonth.fullName}
              <span className="text-sm font-normal ml-1">({stats.bestMonth.percentage}%)</span>
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="text-sm text-gray-600 mb-1 flex items-center gap-2">
              Tendance {getTrendIcon(chartData)}
            </div>
            <div className="text-lg font-bold text-gray-700">
              {chartData.length >= 2
                ? `${chartData[chartData.length - 1].percentage - chartData[chartData.length - 2].percentage > 0 ? '+' : ''}${chartData[chartData.length - 1].percentage - chartData[chartData.length - 2].percentage}%`
                : 'N/A'}
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 ? (
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              onMouseMove={(state) => {
                if (state.activeTooltipIndex !== undefined && typeof state.activeTooltipIndex === 'number') {
                  setHoveredBar(state.activeTooltipIndex);
                }
              }}
              onMouseLeave={() => setHoveredBar(null)}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="name"
                tick={{ fill: '#6B7280', fontSize: 12 }}
                tickLine={{ stroke: '#E5E7EB' }}
              />
              <YAxis
                tick={{ fill: '#6B7280', fontSize: 12 }}
                tickLine={{ stroke: '#E5E7EB' }}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: 20 }}
                formatter={(value) => (
                  <span className="text-sm text-gray-600">{value}</span>
                )}
              />
              <Bar
                dataKey="targetValue"
                name="Objectif"
                fill={CHART_COLORS.target}
                radius={[4, 4, 0, 0]}
                opacity={0.5}
              />
              <Bar
                dataKey="currentValue"
                name="Realise"
                radius={[4, 4, 0, 0]}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getBarColor(entry.percentage)}
                    opacity={hoveredBar === index ? 1 : 0.9}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-4 bg-gray-100 rounded-full mb-4">
            <Calendar className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Pas d&apos;historique</h3>
          <p className="text-gray-500">
            L&apos;historique des objectifs apparaitra ici apres quelques mois.
          </p>
        </div>
      )}
    </motion.div>
  );
}
