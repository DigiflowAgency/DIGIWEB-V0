'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2, Target, Euro, Users, Calendar, Phone, FileText, TrendingUp, Settings } from 'lucide-react';
import { EnterpriseObjective, METRIC_TYPE_LABELS, MONTH_NAMES, CreateObjectiveData } from '@/hooks/useEnterpriseObjectives';

interface ObjectiveFormProps {
  objective?: EnterpriseObjective | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateObjectiveData) => Promise<void>;
  defaultYear?: number;
  defaultMonth?: number;
}

const ICONS: Record<string, React.ElementType> = {
  CA_MENSUEL: Euro,
  CA_GENERE: TrendingUp,
  NOUVEAUX_DEALS: Users,
  RDV_REALISES: Calendar,
  APPELS_EFFECTUES: Phone,
  DEVIS_ENVOYES: FileText,
  TAUX_CONVERSION: Target,
  CUSTOM: Settings,
};

const METRIC_TYPE_DESCRIPTIONS: Record<string, string> = {
  CA_MENSUEL: 'Chiffre d\'affaires encaisse dans le mois',
  CA_GENERE: 'Chiffre d\'affaires des deals signes',
  NOUVEAUX_DEALS: 'Nombre de nouveaux deals crees',
  RDV_REALISES: 'Nombre de rendez-vous effectues',
  APPELS_EFFECTUES: 'Nombre d\'appels passes',
  DEVIS_ENVOYES: 'Nombre de devis envoyes',
  TAUX_CONVERSION: 'Pourcentage de conversion des deals',
  CUSTOM: 'Objectif personnalise',
};

const DEFAULT_TARGETS: Record<string, number> = {
  CA_MENSUEL: 60000,
  CA_GENERE: 80000,
  NOUVEAUX_DEALS: 12,
  RDV_REALISES: 30,
  APPELS_EFFECTUES: 200,
  DEVIS_ENVOYES: 15,
  TAUX_CONVERSION: 25,
  CUSTOM: 0,
};

export function ObjectiveForm({
  objective,
  isOpen,
  onClose,
  onSubmit,
  defaultYear = new Date().getFullYear(),
  defaultMonth = new Date().getMonth() + 1,
}: ObjectiveFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateObjectiveData>({
    metricType: 'CA_MENSUEL',
    period: 'MONTHLY',
    year: defaultYear,
    month: defaultMonth,
    targetValue: DEFAULT_TARGETS.CA_MENSUEL,
    title: '',
  });

  useEffect(() => {
    if (objective) {
      setFormData({
        metricType: objective.metricType,
        period: objective.period,
        year: objective.year,
        month: objective.month,
        quarter: objective.quarter,
        targetValue: objective.targetValue,
        title: objective.title,
        description: objective.description,
      });
    } else {
      const metricType = 'CA_MENSUEL';
      setFormData({
        metricType,
        period: 'MONTHLY',
        year: defaultYear,
        month: defaultMonth,
        targetValue: DEFAULT_TARGETS[metricType],
        title: `${METRIC_TYPE_LABELS[metricType]} ${MONTH_NAMES[defaultMonth - 1]} ${defaultYear}`,
      });
    }
  }, [objective, defaultYear, defaultMonth, isOpen]);

  const handleMetricTypeChange = (metricType: EnterpriseObjective['metricType']) => {
    setFormData(prev => ({
      ...prev,
      metricType,
      targetValue: objective ? prev.targetValue : DEFAULT_TARGETS[metricType],
      title: metricType === 'CUSTOM'
        ? ''
        : `${METRIC_TYPE_LABELS[metricType]} ${MONTH_NAMES[(prev.month || defaultMonth) - 1]} ${prev.year}`,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const Icon = ICONS[formData.metricType] || Target;

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
                  <div className="p-2 bg-violet-100 rounded-xl">
                    <Icon className="h-6 w-6 text-violet-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {objective ? 'Modifier l\'objectif' : 'Nouvel objectif'}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Metric Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Type d&apos;objectif
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(METRIC_TYPE_LABELS).map(([key, label]) => {
                      const MetricIcon = ICONS[key] || Target;
                      const isSelected = formData.metricType === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleMetricTypeChange(key as EnterpriseObjective['metricType'])}
                          className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left ${
                            isSelected
                              ? 'border-violet-500 bg-violet-50 text-violet-700'
                              : 'border-gray-200 hover:border-gray-300 text-gray-600'
                          }`}
                        >
                          <MetricIcon className={`h-4 w-4 ${isSelected ? 'text-violet-600' : 'text-gray-400'}`} />
                          <span className="text-sm font-medium">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    {METRIC_TYPE_DESCRIPTIONS[formData.metricType]}
                  </p>
                </div>

                {/* Title (editable for CUSTOM) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Titre
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    disabled={formData.metricType !== 'CUSTOM'}
                    className={`w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all ${
                      formData.metricType !== 'CUSTOM' ? 'bg-gray-50 text-gray-500' : ''
                    }`}
                    placeholder="Titre de l'objectif..."
                    required
                  />
                </div>

                {/* Period Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Annee
                    </label>
                    <select
                      value={formData.year}
                      onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    >
                      {[defaultYear - 1, defaultYear, defaultYear + 1].map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mois
                    </label>
                    <select
                      value={formData.month || ''}
                      onChange={(e) => {
                        const month = parseInt(e.target.value);
                        setFormData(prev => ({
                          ...prev,
                          month,
                          title: prev.metricType === 'CUSTOM'
                            ? prev.title
                            : `${METRIC_TYPE_LABELS[prev.metricType]} ${MONTH_NAMES[month - 1]} ${prev.year}`,
                        }));
                      }}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    >
                      {MONTH_NAMES.map((name, index) => (
                        <option key={index} value={index + 1}>{name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Target Value */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valeur cible
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.targetValue}
                      onChange={(e) => setFormData(prev => ({ ...prev, targetValue: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 pr-16 rounded-xl border border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      min="0"
                      step={formData.metricType === 'CA_MENSUEL' || formData.metricType === 'CA_GENERE' ? '1000' : '1'}
                      required
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                      {formData.metricType === 'CA_MENSUEL' || formData.metricType === 'CA_GENERE'
                        ? 'EUR'
                        : formData.metricType === 'TAUX_CONVERSION'
                        ? '%'
                        : 'unites'}
                    </span>
                  </div>
                </div>

                {/* Description (optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description <span className="text-gray-400 font-normal">(optionnel)</span>
                  </label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                    rows={3}
                    placeholder="Notes ou contexte sur cet objectif..."
                  />
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
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        {objective ? 'Modifier' : 'Creer'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
