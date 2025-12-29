'use client';

import { motion } from 'framer-motion';
import { Users, TrendingUp, TrendingDown, ChevronRight, Phone, Calendar, Target } from 'lucide-react';
import Link from 'next/link';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface Commercial {
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
}

interface CommerciauxTableProps {
  data: Commercial[];
}

export function CommerciauxTable({ data }: CommerciauxTableProps) {
  const getMedalColor = (index: number) => {
    switch (index) {
      case 0:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white';
      case 1:
        return 'bg-gradient-to-r from-gray-300 to-gray-400 text-white';
      case 2:
        return 'bg-gradient-to-r from-orange-400 to-orange-500 text-white';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9 }}
      className="card-premium overflow-hidden"
    >
      <div className="px-6 py-5 border-b border-gray-200/50">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Users className="h-5 w-5 text-violet-600" />
          Classement commerciaux
        </h3>
        <p className="text-sm text-gray-500 mt-1">Performance par CA genere</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Rang
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Commercial
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                CA
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Evolution
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <Phone className="h-4 w-4 inline" />
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <Calendar className="h-4 w-4 inline" />
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <Target className="h-4 w-4 inline" />
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Trend
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">

              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200/50">
            {data.map((user, index) => {
              const sparklineData = user.sparkline.map((value, i) => ({ value }));
              const isPositive = user.caVariation > 0;
              const isNeutral = user.caVariation === 0;

              return (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1 + index * 0.05 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${getMedalColor(
                        index
                      )}`}
                    >
                      {index + 1}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-orange-500 flex items-center justify-center text-white font-semibold">
                          {user.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.deals} deals</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <p className="text-lg font-bold text-violet-700">
                      {user.ca.toLocaleString()} EUR
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      {isNeutral ? (
                        <span className="text-gray-500 text-sm">-</span>
                      ) : isPositive ? (
                        <>
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          <span className="text-sm font-medium text-green-600">
                            +{user.caVariation}%
                          </span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="h-4 w-4 text-red-500" />
                          <span className="text-sm font-medium text-red-600">
                            {user.caVariation}%
                          </span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm font-medium text-gray-700">{user.appels}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm font-medium text-gray-700">{user.rdv}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        user.tauxClosing >= 50
                          ? 'bg-green-100 text-green-700'
                          : user.tauxClosing >= 25
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {user.tauxClosing}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-20 h-8">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={sparklineData}>
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke={isPositive ? '#10b981' : isNeutral ? '#6b7280' : '#ef4444'}
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <Link
                      href={`/dashboard/analytics/commerciaux/${user.id}`}
                      className="text-violet-600 hover:text-violet-700 transition-colors"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Link>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {data.length === 0 && (
        <div className="px-6 py-12 text-center text-gray-500">
          Aucun commercial trouve
        </div>
      )}
    </motion.div>
  );
}
