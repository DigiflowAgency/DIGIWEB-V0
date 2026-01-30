'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useImprovementMutations } from '@/hooks/projects';
import type { ImprovementProposal, CreateImprovementData } from '@/types/projects';
import { Save, Send, Loader2 } from 'lucide-react';

interface ProposalFormProps {
  projectId: string;
  proposal?: ImprovementProposal;
  onSave?: () => void;
}

const CATEGORIES = [
  { value: 'FEATURE', label: 'Nouvelle fonctionnalité' },
  { value: 'UX', label: 'Expérience utilisateur' },
  { value: 'PERFORMANCE', label: 'Performance' },
  { value: 'BUG_FIX', label: 'Correction de bug' },
  { value: 'SECURITY', label: 'Sécurité' },
  { value: 'DOCUMENTATION', label: 'Documentation' },
  { value: 'OTHER', label: 'Autre' },
];

const PRIORITIES = [
  { value: 'LOW', label: 'Basse' },
  { value: 'MEDIUM', label: 'Moyenne' },
  { value: 'HIGH', label: 'Haute' },
  { value: 'CRITICAL', label: 'Critique' },
];

export default function ProposalForm({ projectId, proposal, onSave }: ProposalFormProps) {
  const router = useRouter();
  const { createImprovement, updateImprovement, submitImprovement, loading, error } =
    useImprovementMutations();

  const [title, setTitle] = useState(proposal?.title || '');
  const [description, setDescription] = useState(proposal?.description || '');
  const [context, setContext] = useState(proposal?.context || '');
  const [benefits, setBenefits] = useState(proposal?.benefits || '');
  const [category, setCategory] = useState(proposal?.category || '');
  const [priority, setPriority] = useState(proposal?.priority || '');

  useEffect(() => {
    if (proposal) {
      setTitle(proposal.title);
      setDescription(proposal.description);
      setContext(proposal.context || '');
      setBenefits(proposal.benefits || '');
      setCategory(proposal.category || '');
      setPriority(proposal.priority || '');
    }
  }, [proposal]);

  const handleSave = async (submit = false) => {
    const data: CreateImprovementData = {
      title,
      description,
      context: context || undefined,
      benefits: benefits || undefined,
      category: category || undefined,
      priority: priority || undefined,
    };

    try {
      let result: ImprovementProposal;

      if (proposal) {
        result = await updateImprovement(proposal.id, data);
      } else {
        result = await createImprovement(projectId, data);
      }

      if (submit && result.status === 'DRAFT') {
        await submitImprovement(result.id);
      }

      if (!proposal) {
        router.push(`/dashboard/projects/${projectId}/improvements/${result.id}`);
      } else {
        onSave?.();
      }
    } catch (err) {
      console.error('Save error:', err);
    }
  };

  const canEdit = !proposal || ['DRAFT', 'INFO_REQUESTED'].includes(proposal.status);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Titre de l&apos;amélioration *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Ajouter un filtre par date sur le dashboard"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-violet-500 focus:border-violet-500"
          disabled={!canEdit}
          required
        />
      </div>

      {/* Category & Priority */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Catégorie
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-violet-500 focus:border-violet-500"
            disabled={!canEdit}
          >
            <option value="">Sélectionner...</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Priorité suggérée
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-violet-500 focus:border-violet-500"
            disabled={!canEdit}
          >
            <option value="">Sélectionner...</option>
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description *
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Décrivez en détail l'amélioration proposée..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-violet-500 focus:border-violet-500"
          disabled={!canEdit}
          required
        />
      </div>

      {/* Context */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Contexte / Problème actuel
        </label>
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          rows={3}
          placeholder="Pourquoi cette amélioration est-elle importante ? Quel problème résout-elle ?"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-violet-500 focus:border-violet-500"
          disabled={!canEdit}
        />
      </div>

      {/* Benefits */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Bénéfices attendus
        </label>
        <textarea
          value={benefits}
          onChange={(e) => setBenefits(e.target.value)}
          rows={3}
          placeholder="Quels avantages cette amélioration apportera-t-elle ?"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-violet-500 focus:border-violet-500"
          disabled={!canEdit}
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      {/* Actions */}
      {canEdit && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Annuler
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={loading || !title || !description}
              className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Enregistrer brouillon
            </button>
            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={loading || !title || !description}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Soumettre
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
