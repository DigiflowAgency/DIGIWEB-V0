'use client';

import { motion } from 'framer-motion';
import { Flame, Thermometer, Snowflake, Target, MessageSquare } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

interface QualificationData {
  temperature: {
    hot: number;
    warm: number;
    cold: number;
  };
  budget: {
    discute: number;
    nonDiscute: number;
  };
  decideur: {
    identifie: number;
    nonIdentifie: number;
  };
  objections: Array<{ type: string; label: string; count: number; percentage: number }>;
}

interface QualificationChartProps {
  data: QualificationData;
}

const TEMP_COLORS = {
  hot: '#ef4444',
  warm: '#f59e0b',
  cold: '#3b82f6',
};

export function QualificationChart({ data }: QualificationChartProps) {
  const temperatureData = [
    { name: 'Chaud', value: data.temperature.hot, color: TEMP_COLORS.hot },
    { name: 'Tiede', value: data.temperature.warm, color: TEMP_COLORS.warm },
    { name: 'Froid', value: data.temperature.cold, color: TEMP_COLORS.cold },
  ];

  const totalTemp = data.temperature.hot + data.temperature.warm + data.temperature.cold;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const entry = payload[0].payload;
      return (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3">
          <p className="font-semibold text-gray-900">{entry.name || entry.label}</p>
          <p className="text-sm text-gray-600">
            {entry.value || entry.count} ({entry.percentage || Math.round((entry.value / totalTemp) * 100)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Temperature */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="card-premium p-6"
      >
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Target className="h-5 w-5 text-violet-600" />
            Temperature des leads
          </h3>
          <p className="text-sm text-gray-500 mt-1">Qualification des prospects</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="h-40 w-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={temperatureData}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={60}
                  dataKey="value"
                  paddingAngle={2}
                >
                  {temperatureData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="white" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-red-500" />
                <span className="text-sm text-gray-600">Chaud</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">{data.temperature.hot}</span>
                <span className="text-xs text-gray-500">
                  ({totalTemp > 0 ? Math.round((data.temperature.hot / totalTemp) * 100) : 0}%)
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-amber-500" />
                <span className="text-sm text-gray-600">Tiede</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">{data.temperature.warm}</span>
                <span className="text-xs text-gray-500">
                  ({totalTemp > 0 ? Math.round((data.temperature.warm / totalTemp) * 100) : 0}%)
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Snowflake className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-gray-600">Froid</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">{data.temperature.cold}</span>
                <span className="text-xs text-gray-500">
                  ({totalTemp > 0 ? Math.round((data.temperature.cold / totalTemp) * 100) : 0}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress bars pour budget et decideur */}
        <div className="mt-6 pt-4 border-t border-gray-200 space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Budget discute</span>
              <span className="font-semibold text-green-600">
                {data.budget.discute + data.budget.nonDiscute > 0
                  ? Math.round((data.budget.discute / (data.budget.discute + data.budget.nonDiscute)) * 100)
                  : 0}%
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-500"
                style={{
                  width: `${
                    data.budget.discute + data.budget.nonDiscute > 0
                      ? (data.budget.discute / (data.budget.discute + data.budget.nonDiscute)) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Decideur identifie</span>
              <span className="font-semibold text-violet-600">
                {data.decideur.identifie + data.decideur.nonIdentifie > 0
                  ? Math.round((data.decideur.identifie / (data.decideur.identifie + data.decideur.nonIdentifie)) * 100)
                  : 0}%
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-500 rounded-full transition-all duration-500"
                style={{
                  width: `${
                    data.decideur.identifie + data.decideur.nonIdentifie > 0
                      ? (data.decideur.identifie / (data.decideur.identifie + data.decideur.nonIdentifie)) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Objections */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="card-premium p-6"
      >
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-violet-600" />
            Objections principales
          </h3>
          <p className="text-sm text-gray-500 mt-1">Freins identifies</p>
        </div>

        {data.objections.length > 0 ? (
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.objections}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis
                  type="category"
                  dataKey="label"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  width={80}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-52 flex items-center justify-center">
            <p className="text-gray-500">Aucune objection enregistree</p>
          </div>
        )}

        {/* Stats */}
        {data.objections.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4">
              {data.objections.slice(0, 4).map((obj, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">{obj.label}</span>
                  <span className="text-xs font-semibold text-amber-600">{obj.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
