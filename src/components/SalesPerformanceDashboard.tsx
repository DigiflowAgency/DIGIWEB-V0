'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Target,
  TrendingUp,
  DollarSign,
  Calendar,
  Award,
  AlertCircle,
  CheckCircle,
  XCircle,
  Sparkles,
} from 'lucide-react';

interface SalesPerformanceDashboardProps {
  userId?: string;
  monthlyRevenue?: number;
  yearlyRevenue?: number;
  signatures?: number;
  rdvCount?: number;
}

export default function SalesPerformanceDashboard({
  userId: _userId,
  monthlyRevenue = 0,
  yearlyRevenue = 0,
  signatures = 0,
  rdvCount = 0,
}: SalesPerformanceDashboardProps) {
  const [calculation, setCalculation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCalculation();
  }, [monthlyRevenue, yearlyRevenue, signatures, rdvCount]);

  const fetchCalculation = async () => {
    try {
      const res = await fetch('/api/sales-performance/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthlyRevenue,
          yearlyRevenue,
          signatures,
          rdvCount,
        }),
      });

      const data = await res.json();
      setCalculation(data.calculation);
    } catch (error) {
      console.error('Erreur calcul performances:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !calculation) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-violet-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const { objectives, commission, reduction, booster, monthlyBonus, yearlyBonus } = calculation;

  return (
    <div className="space-y-6">
      {/* Objectifs Mensuels */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-violet-100 rounded-lg">
            <Target className="h-6 w-6 text-violet-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Objectifs Mensuels</h2>
            <p className="text-sm text-gray-600">Votre progression ce mois-ci</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Signatures */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-gray-600" />
                <span className="font-semibold text-gray-900">Signatures</span>
              </div>
              <div className="text-right">
                <span className={`text-2xl font-bold ${objectives.signatures.reached ? 'text-green-600' : 'text-gray-900'}`}>
                  {objectives.signatures.current}
                </span>
                <span className="text-gray-500"> / {objectives.signatures.goal}</span>
              </div>
            </div>
            <div className="relative w-full bg-gray-200 rounded-full h-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${objectives.signatures.percentage}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className={`h-3 rounded-full ${
                  objectives.signatures.reached
                    ? 'bg-gradient-to-r from-green-500 to-green-600'
                    : 'bg-gradient-to-r from-violet-500 to-violet-600'
                }`}
              />
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-gray-500">{objectives.signatures.percentage.toFixed(0)}%</span>
              {objectives.signatures.reached && (
                <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Atteint
                </span>
              )}
            </div>
          </div>

          {/* RDV */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-600" />
                <span className="font-semibold text-gray-900">RDV pris</span>
              </div>
              <div className="text-right">
                <span className={`text-2xl font-bold ${objectives.rdv.reached ? 'text-green-600' : 'text-gray-900'}`}>
                  {objectives.rdv.current}
                </span>
                <span className="text-gray-500"> / {objectives.rdv.goal}</span>
              </div>
            </div>
            <div className="relative w-full bg-gray-200 rounded-full h-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${objectives.rdv.percentage}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className={`h-3 rounded-full ${
                  objectives.rdv.reached
                    ? 'bg-gradient-to-r from-green-500 to-green-600'
                    : 'bg-gradient-to-r from-violet-500 to-violet-600'
                }`}
              />
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-gray-500">{objectives.rdv.percentage.toFixed(0)}%</span>
              {objectives.rdv.reached && (
                <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Atteint
                </span>
              )}
            </div>
          </div>

          {/* Statut Global */}
          <div className={`p-4 rounded-lg border-2 ${
            objectives.allReached
              ? 'bg-green-50 border-green-200'
              : reduction.percent === 50
              ? 'bg-yellow-50 border-yellow-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-3">
              {objectives.allReached ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : reduction.percent === 50 ? (
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              ) : (
                <XCircle className="h-6 w-6 text-red-600" />
              )}
              <span className={`font-semibold ${
                objectives.allReached
                  ? 'text-green-700'
                  : reduction.percent === 50
                  ? 'text-yellow-700'
                  : 'text-red-700'
              }`}>
                {reduction.message}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Prime Mensuelle */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-green-100 rounded-lg">
            <DollarSign className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Prime du Mois</h2>
            <p className="text-sm text-gray-600">Estimation basée sur votre CA actuel</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Commission par tranches */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Commission mensuelle (par tranches)</h3>
            <div className="space-y-2">
              {commission.breakdown.map((tranche: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="text-sm font-medium text-gray-900">{tranche.tranche}</span>
                    <span className="text-xs text-gray-500 ml-2">({tranche.rate})</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">
                      {tranche.amount.toLocaleString('fr-FR')} €
                    </div>
                    <div className="text-sm font-semibold text-green-600">
                      +{tranche.commission.toLocaleString('fr-FR')} €
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
              <span className="font-semibold text-gray-900">Commission totale</span>
              <span className="text-xl font-bold text-green-600">
                {commission.totalCommission.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
              </span>
            </div>
          </div>

          {/* Impact objectifs */}
          {reduction.percent > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-red-700">
                  Réduction (-{reduction.percent}%)
                </span>
                <span className="text-sm font-bold text-red-700">
                  -{reduction.amountDeducted.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                </span>
              </div>
            </div>
          )}

          {/* Booster */}
          {booster.percent > 0 && (
            <div className="p-4 bg-violet-50 border border-violet-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-violet-600" />
                <span className="text-sm font-semibold text-violet-700">{booster.message}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-violet-600">Bonus booster</span>
                <span className="text-sm font-bold text-violet-700">
                  +{booster.amountAdded.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                </span>
              </div>
            </div>
          )}

          {/* Prime finale */}
          <div className="mt-4 pt-4 border-t-2 border-gray-300">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-gray-900">Prime mensuelle finale</span>
              <span className="text-3xl font-bold text-violet-600">
                {monthlyBonus.final.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Projection Annuelle */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-100 rounded-lg">
            <TrendingUp className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Projection Annuelle</h2>
            <p className="text-sm text-gray-600">Prime basée sur le CA annuel</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">CA annuel actuel</div>
              <div className="text-2xl font-bold text-blue-600">
                {yearlyBonus.yearlyRevenue.toLocaleString('fr-FR')} €
              </div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Prime estimée ({yearlyBonus.rate}%)</div>
              <div className="text-2xl font-bold text-green-600">
                {yearlyBonus.bonus.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
              </div>
            </div>
          </div>

          {yearlyBonus.nextThreshold && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">Progression vers 500k (prime 2%)</span>
                <span className="text-sm text-gray-600">
                  {yearlyBonus.percentToNextThreshold.toFixed(1)}%
                </span>
              </div>
              <div className="relative w-full bg-gray-200 rounded-full h-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${yearlyBonus.percentToNextThreshold}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Encore {(500000 - yearlyBonus.yearlyRevenue).toLocaleString('fr-FR')} € pour passer à 2%
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
