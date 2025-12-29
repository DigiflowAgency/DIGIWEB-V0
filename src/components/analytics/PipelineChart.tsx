'use client';

import { motion } from 'framer-motion';
import { Briefcase } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface StageData {
  stage: string;
  label: string;
  count: number;
  value: number;
}

interface PipelineChartProps {
  data: StageData[];
  total: {
    count: number;
    value: number;
    weighted: number;
    avgDeal: number;
  };
}

const STAGE_COLORS: Record<string, string> = {
  A_CONTACTER: '#6b7280',
  EN_DISCUSSION: '#3b82f6',
  A_RELANCER: '#f59e0b',
  RDV_PRIS: '#8b5cf6',
  NEGO_HOT: '#f97316',
  CLOSING: '#10b981',
  REFUSE: '#ef4444',
};

export function PipelineChart({ data, total }: PipelineChartProps) {
  const chartData = data.map((item) => ({
    name: item.label,
    value: item.value,
    count: item.count,
    stage: item.stage,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3">
          <p className="font-semibold text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">{data.count} deal(s)</p>
          <p className="text-sm font-medium text-violet-600">
            {data.value.toLocaleString()} EUR
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-xs font-semibold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4 }}
      className="card-premium p-6"
    >
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-violet-600" />
          Pipeline par stage
        </h3>
        <p className="text-sm text-gray-500 mt-1">Repartition des deals actifs</p>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              innerRadius={50}
              outerRadius={90}
              dataKey="value"
              paddingAngle={2}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={STAGE_COLORS[entry.stage] || '#6b7280'}
                  stroke="white"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 mt-4">
        {chartData.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: STAGE_COLORS[item.stage] || '#6b7280' }}
            />
            <span className="text-xs text-gray-600 truncate">{item.name}</span>
            <span className="text-xs font-semibold text-gray-900 ml-auto">
              {item.count}
            </span>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="mt-6 pt-4 border-t border-gray-200 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-500">Valeur totale</p>
          <p className="text-lg font-bold text-gray-900">
            {total.value.toLocaleString()} EUR
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Previsionnel</p>
          <p className="text-lg font-bold text-violet-600">
            {total.weighted.toLocaleString()} EUR
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Nb deals</p>
          <p className="text-lg font-bold text-gray-900">{total.count}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Deal moyen</p>
          <p className="text-lg font-bold text-gray-900">
            {total.avgDeal.toLocaleString()} EUR
          </p>
        </div>
      </div>
    </motion.div>
  );
}
