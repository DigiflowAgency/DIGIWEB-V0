'use client';

import { useState, useEffect } from 'react';
import { Plus, X, GripVertical } from 'lucide-react';
import Modal from './Modal';
import { ProductionService, useProductionServices } from '@/hooks/useProductionServices';

// Couleurs prédéfinies pour les services
const SERVICE_COLORS = [
  { label: 'Violet', value: '#8B5CF6' },
  { label: 'Bleu', value: '#3B82F6' },
  { label: 'Vert', value: '#10B981' },
  { label: 'Orange', value: '#F97316' },
  { label: 'Rouge', value: '#EF4444' },
  { label: 'Rose', value: '#EC4899' },
  { label: 'Cyan', value: '#06B6D4' },
  { label: 'Indigo', value: '#6366F1' },
];

interface InitialStage {
  id: string;
  name: string;
  color: string;
}

interface ProductionServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  service?: ProductionService | null; // Si fourni, mode édition
}

export default function ProductionServiceModal({
  isOpen,
  onClose,
  service,
}: ProductionServiceModalProps) {
  const { createService, updateService } = useProductionServices();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#8B5CF6');
  const [stages, setStages] = useState<InitialStage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Réinitialiser le formulaire quand la modal s'ouvre/se ferme
  useEffect(() => {
    if (isOpen) {
      if (service) {
        // Mode édition
        setName(service.name);
        setDescription(service.description || '');
        setColor(service.color);
        // Les stages sont gérés dans ProductionStagesModal
        setStages([]);
      } else {
        // Mode création
        setName('');
        setDescription('');
        setColor('#8B5CF6');
        setStages([
          { id: `temp-${Date.now()}-1`, name: 'Étape 1', color: '#E5E7EB' },
        ]);
      }
      setError(null);
    }
  }, [isOpen, service]);

  // Ajouter un stage initial
  const handleAddStage = () => {
    setStages([
      ...stages,
      { id: `temp-${Date.now()}`, name: `Étape ${stages.length + 1}`, color: '#E5E7EB' },
    ]);
  };

  // Modifier un stage
  const handleUpdateStage = (id: string, updates: Partial<InitialStage>) => {
    setStages(prev =>
      prev.map(s => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  // Supprimer un stage
  const handleRemoveStage = (id: string) => {
    setStages(prev => prev.filter(s => s.id !== id));
  };

  // Soumettre le formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Le nom du service est requis');
      return;
    }

    if (!service && stages.length === 0) {
      setError('Ajoutez au moins une étape');
      return;
    }

    setIsSubmitting(true);

    try {
      if (service) {
        // Mode édition
        await updateService(service.id, {
          name: name.trim(),
          description: description.trim() || null,
          color,
        });
      } else {
        // Mode création
        await createService({
          name: name.trim(),
          description: description.trim() || undefined,
          color,
          stages: stages.map(s => ({
            name: s.name,
            color: s.color,
          })),
        });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditing = !!service;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Modifier le service' : 'Créer un nouveau service'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Message d'erreur */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Nom du service */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nom du service <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            placeholder="ex: Site Web, SEO, Influence..."
            autoFocus
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description (optionnel)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
            rows={2}
            placeholder="Description du service..."
          />
        </div>

        {/* Couleur */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Couleur
          </label>
          <div className="flex flex-wrap gap-2">
            {SERVICE_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setColor(c.value)}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  color === c.value
                    ? 'border-gray-800 scale-110'
                    : 'border-transparent hover:scale-105'
                }`}
                style={{ backgroundColor: c.value }}
                title={c.label}
              />
            ))}
          </div>
        </div>

        {/* Stages initiaux (uniquement en création) */}
        {!isEditing && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Étapes / Colonnes
              </label>
              <button
                type="button"
                onClick={handleAddStage}
                className="flex items-center gap-1 text-sm text-violet-600 hover:text-violet-700"
              >
                <Plus className="h-4 w-4" />
                Ajouter
              </button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {stages.map((stage, index) => (
                <div
                  key={stage.id}
                  className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                >
                  <GripVertical className="h-4 w-4 text-gray-400" />
                  <span className="text-xs text-gray-500 w-6">{index + 1}.</span>
                  <input
                    type="text"
                    value={stage.name}
                    onChange={(e) =>
                      handleUpdateStage(stage.id, { name: e.target.value })
                    }
                    className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-violet-500"
                    placeholder="Nom de l'étape"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveStage(stage.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    disabled={stages.length <= 1}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            {stages.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                Ajoutez au moins une étape pour votre service
              </p>
            )}
          </div>
        )}

        {/* Boutons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting
              ? isEditing
                ? 'Modification...'
                : 'Création...'
              : isEditing
              ? 'Modifier'
              : 'Créer le service'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
