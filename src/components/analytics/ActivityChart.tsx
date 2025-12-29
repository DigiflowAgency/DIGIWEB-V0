'use client';

import { motion } from 'framer-motion';
import { Activity, Phone, Calendar, Mail } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface ActivitiesData {
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
}

interface ActivityChartProps {
  data: ActivitiesData;
}

export function ActivityChart({ data }: ActivityChartProps) {
  const chartData = [
    {
      type: 'Appels',
      total: data.appels.total,
      completed: data.appels.repondus,
    },
    {
      type: 'RDV',
      total: data.rdv.total,
      completed: data.rdv.effectues,
    },
    {
      type: 'Emails',
      total: data.emails.total,
      completed: data.emails.total,
    },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4 }}
      className="card-premium p-6"
    >
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Activity className="h-5 w-5 text-violet-600" />
          Activites par type
        </h3>
        <p className="text-sm text-gray-500 mt-1">Repartition et completion</p>
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="type"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={{ stroke: '#e5e7eb' }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={{ stroke: '#e5e7eb' }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: 10 }} />
            <Bar
              dataKey="total"
              name="Total"
              fill="#8b5cf6"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="completed"
              name="Completes"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Stats detaillees */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        {/* Appels */}
        <div className="bg-violet-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Phone className="h-4 w-4 text-violet-600" />
            <span className="text-sm font-semibold text-violet-900">Appels</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Taux reponse</span>
              <span className="font-semibold text-violet-700">
                {data.appels.tauxReponse}%
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Duree moy.</span>
              <span className="font-semibold text-violet-700">
                {data.appels.dureeMoyenne} min
              </span>
            </div>
          </div>
        </div>

        {/* RDV */}
        <div className="bg-cyan-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-cyan-600" />
            <span className="text-sm font-semibold text-cyan-900">RDV</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Taux honore</span>
              <span className="font-semibold text-cyan-700">
                {data.rdv.tauxHonore}%
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Annules</span>
              <span className="font-semibold text-red-600">
                {data.rdv.annules}
              </span>
            </div>
          </div>
        </div>

        {/* Emails */}
        <div className="bg-emerald-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-semibold text-emerald-900">Emails</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Envoyes</span>
              <span className="font-semibold text-emerald-700">
                {data.emails.total}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
