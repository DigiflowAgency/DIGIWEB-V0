'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Copy, Sparkles, Loader2, Euro, Users, CalendarCheck, Phone, FileText } from 'lucide-react';
import { MONTH_NAMES, InitObjectivesData } from '@/hooks/useEnterpriseObjectives';

interface InitMonthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: InitObjectivesData) => Promise<void>;
  currentYear: number;
  currentMonth: number;
}

const DEFAULT_VALUES = {
  CA_MENSUEL: 60000,
  NOUVEAUX_DEALS: 12,
  RDV_REALISES: 30,
  APPELS_EFFECTUES: 200,
  DEVIS_ENVOYES: 15,
};

const OBJECTIVE_CONFIGS = [
  { key: 'CA_MENSUEL', label: 'CA Mensuel', icon: Euro, unit: 'EUR', step: 1000 },
  { key: 'NOUVEAUX_DEALS', label: 'Nouveaux Deals', icon: Users, unit: 'deals', step: 1 },
  { key: 'RDV_REALISES', label: 'RDV Realises', icon: CalendarCheck, unit: 'rdv', step: 1 },
  { key: 'APPELS_EFFECTUES', label: 'Appels', icon: Phone, unit: 'appels', step: 10 },
  { key: 'DEVIS_ENVOYES', label: 'Devis', icon: FileText, unit: 'devis', step: 1 },
];

export function InitMonthModal({
  isOpen,
  onClose,
  onSubmit,
  currentYear,
  currentMonth,
}: InitMonthModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'copy' | 'custom'>('custom'); // Default to custom since copy often fails
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [customValues, setCustomValues] = useState(DEFAULT_VALUES);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const data: InitObjectivesData = {
        year: selectedYear,
        month: selectedMonth,
        copyFromPrevious: mode === 'copy',
        defaults: mode === 'custom' ? customValues : undefined,
      };

      await onSubmit(data);
      onClose();
    } catch (err: any) {
      console.error('Erreur lors de l\'initialisation:', err);
      const errorMessage = err.message || 'Une erreur est survenue lors de l\'initialisation';
      setError(errorMessage);
      alert(errorMessage); // Show alert as well for visibility
    } finally {
      setIsSubmitting(false);
    }
  };

  const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
  const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Initialiser un mois</h2>
                    <p className="text-sm text-gray-500">Creer les objectifs standards</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Month Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Mois a initialiser
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                      className="px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    >
                      {MONTH_NAMES.map((name, index) => (
                        <option key={index} value={index + 1}>{name}</option>
                      ))}
                    </select>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                      className="px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    >
                      {[currentYear - 1, currentYear, currentYear + 1].map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Mode Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Mode d&apos;initialisation
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setMode('copy')}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        mode === 'copy'
                          ? 'border-violet-500 bg-violet-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Copy className={`h-6 w-6 ${mode === 'copy' ? 'text-violet-600' : 'text-gray-400'}`} />
                      <span className={`text-sm font-medium ${mode === 'copy' ? 'text-violet-700' : 'text-gray-600'}`}>
                        Copier le mois precedent
                      </span>
                      <span className="text-xs text-gray-500">
                        {MONTH_NAMES[prevMonth - 1]} {prevYear}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('custom')}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        mode === 'custom'
                          ? 'border-violet-500 bg-violet-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Calendar className={`h-6 w-6 ${mode === 'custom' ? 'text-violet-600' : 'text-gray-400'}`} />
                      <span className={`text-sm font-medium ${mode === 'custom' ? 'text-violet-700' : 'text-gray-600'}`}>
                        Valeurs personnalisees
                      </span>
                      <span className="text-xs text-gray-500">
                        Definir manuellement
                      </span>
                    </button>
                  </div>
                </div>

                {/* Custom Values (if mode === 'custom') */}
                <AnimatePresence>
                  {mode === 'custom' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 overflow-hidden"
                    >
                      <label className="block text-sm font-medium text-gray-700">
                        Valeurs cibles
                      </label>
                      <div className="space-y-3">
                        {OBJECTIVE_CONFIGS.map(({ key, label, icon: Icon, unit, step }) => (
                          <div key={key} className="flex items-center gap-4">
                            <div className="flex items-center gap-2 w-40">
                              <Icon className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-600">{label}</span>
                            </div>
                            <div className="flex-1 relative">
                              <input
                                type="number"
                                value={customValues[key as keyof typeof customValues]}
                                onChange={(e) => setCustomValues(prev => ({
                                  ...prev,
                                  [key]: parseFloat(e.target.value) || 0,
                                }))}
                                className="w-full px-4 py-2 pr-16 rounded-lg border border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                                min="0"
                                step={step}
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                                {unit}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Error message */}
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {/* Preview */}
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">5 objectifs</span> seront crees pour{' '}
                    <span className="font-semibold text-violet-600">
                      {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                    </span>
                    {mode === 'copy' && (
                      <span>
                        {' '}avec les memes valeurs que{' '}
                        <span className="font-semibold">{MONTH_NAMES[prevMonth - 1]} {prevYear}</span>
                      </span>
                    )}
                  </p>
                  {mode === 'copy' && (
                    <p className="text-xs text-orange-600 mt-2">
                      Note: Si le mois precedent n&apos;a pas d&apos;objectifs, utilisez les valeurs personnalisees.
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2.5 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-medium hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-200"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Initialisation...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Initialiser
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
