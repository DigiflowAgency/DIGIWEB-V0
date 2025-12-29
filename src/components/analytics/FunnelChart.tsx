'use client';

import { motion } from 'framer-motion';
import { Filter, ArrowRight, Users, UserCheck, Calendar, FileText, CheckCircle } from 'lucide-react';

interface FunnelData {
  leads: number;
  contacts: number;
  rdvPris: number;
  devisEnvoyes: number;
  signatures: number;
  taux: {
    leadToContact: number;
    contactToRdv: number;
    rdvToDevis: number;
    devisToSignature: number;
    global: number;
  };
}

interface FunnelChartProps {
  data: FunnelData;
}

export function FunnelChart({ data }: FunnelChartProps) {
  const maxValue = Math.max(data.leads, 1);

  const stages = [
    {
      name: 'Leads',
      value: data.leads,
      icon: Users,
      color: 'bg-gray-500',
      conversionRate: null,
    },
    {
      name: 'Contacts',
      value: data.contacts,
      icon: UserCheck,
      color: 'bg-blue-500',
      conversionRate: data.taux.leadToContact,
    },
    {
      name: 'RDV pris',
      value: data.rdvPris,
      icon: Calendar,
      color: 'bg-violet-500',
      conversionRate: data.taux.contactToRdv,
    },
    {
      name: 'Devis',
      value: data.devisEnvoyes,
      icon: FileText,
      color: 'bg-orange-500',
      conversionRate: data.taux.rdvToDevis,
    },
    {
      name: 'Signatures',
      value: data.signatures,
      icon: CheckCircle,
      color: 'bg-green-500',
      conversionRate: data.taux.devisToSignature,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      className="card-premium p-6"
    >
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Filter className="h-5 w-5 text-violet-600" />
          Funnel de conversion
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Taux global: <span className="font-semibold text-violet-600">{data.taux.global}%</span>
        </p>
      </div>

      {/* Funnel Visualization */}
      <div className="space-y-3">
        {stages.map((stage, index) => {
          const width = maxValue > 0 ? (stage.value / maxValue) * 100 : 0;
          const Icon = stage.icon;

          return (
            <div key={stage.name}>
              <div className="flex items-center gap-4">
                <div className="w-24 flex items-center gap-2">
                  <Icon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">{stage.name}</span>
                </div>
                <div className="flex-1 relative">
                  <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${width}%` }}
                      transition={{ delay: 0.9 + index * 0.1, duration: 0.5 }}
                      className={`h-full ${stage.color} rounded-lg flex items-center justify-end pr-3`}
                      style={{ minWidth: stage.value > 0 ? '40px' : '0' }}
                    >
                      {width > 15 && (
                        <span className="text-white text-sm font-semibold">{stage.value}</span>
                      )}
                    </motion.div>
                  </div>
                  {width <= 15 && stage.value > 0 && (
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-700">
                      {stage.value}
                    </span>
                  )}
                </div>
                <div className="w-16 text-right">
                  {stage.conversionRate !== null && (
                    <span className="text-xs text-gray-500">{stage.conversionRate}%</span>
                  )}
                </div>
              </div>

              {/* Arrow between stages */}
              {index < stages.length - 1 && (
                <div className="flex items-center gap-4 py-1">
                  <div className="w-24" />
                  <div className="flex-1 flex items-center justify-center">
                    <ArrowRight className="h-4 w-4 text-gray-300" />
                    {stages[index + 1].conversionRate !== null && (
                      <span className="ml-2 text-xs font-medium text-violet-600">
                        {stages[index + 1].conversionRate}%
                      </span>
                    )}
                  </div>
                  <div className="w-16" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-xs text-gray-500">Lead &rarr; Contact</p>
            <p className="text-lg font-bold text-blue-600">{data.taux.leadToContact}%</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Contact &rarr; RDV</p>
            <p className="text-lg font-bold text-violet-600">{data.taux.contactToRdv}%</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">RDV &rarr; Devis</p>
            <p className="text-lg font-bold text-orange-600">{data.taux.rdvToDevis}%</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Devis &rarr; Sign.</p>
            <p className="text-lg font-bold text-green-600">{data.taux.devisToSignature}%</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
