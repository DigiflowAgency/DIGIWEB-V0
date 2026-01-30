'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProjectMutations } from '@/hooks/projects';
import { useAIGeneration } from '@/hooks/projects/useAIGeneration';
import { PROJECT_TYPES, PROJECT_STATUSES } from '@/lib/projects/constants';
import { ArrowLeft, Loader2, Sparkles, FolderPlus, ChevronRight, Check, AlertCircle, Upload, Clock, CheckCircle2, Circle } from 'lucide-react';
import Link from 'next/link';
import type { ProjectType, ProjectStatus, AIGenerationResponse, AIImportResponse, AIGenerationMode, AITaskStatus } from '@/types/projects';

type WizardStep = 'mode' | 'manual' | 'ai-prompt' | 'ai-preview';
type AIMode = 'new' | 'import';

export default function NewProjectPage() {
  const router = useRouter();
  const { createProject } = useProjectMutations();
  const { generate, isGenerating } = useAIGeneration();

  const [step, setStep] = useState<WizardStep>('mode');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: '',
    description: '',
    type: 'WEB' as ProjectType,
    status: 'PLANNING' as ProjectStatus,
    budget: '',
    currency: 'EUR',
    startDate: '',
    endDate: '',
    deadline: '',
  });

  // AI state
  const [aiMode, setAiMode] = useState<AIMode>('new');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResult, setAiResult] = useState<AIGenerationResponse | null>(null);
  const [aiImportResult, setAiImportResult] = useState<AIImportResponse | null>(null);

  const handleManualSubmit = async () => {
    if (!form.name.trim()) {
      setError('Le nom du projet est requis');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const project = await createProject({
        name: form.name,
        description: form.description || undefined,
        type: form.type,
        status: form.status,
        budget: form.budget ? parseFloat(form.budget) : undefined,
        currency: form.currency,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        deadline: form.deadline || undefined,
      });

      router.push(`/dashboard/projects/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création');
    } finally {
      setIsCreating(false);
    }
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) {
      setError(aiMode === 'import'
        ? 'Décrivez votre projet existant pour l\'importer'
        : 'Décrivez votre projet pour générer la structure');
      return;
    }

    setError(null);

    try {
      const result = await generate({
        description: aiPrompt,
        projectType: form.type,
        estimatePoints: true,
        mode: aiMode,
      });

      if (result.mode === 'import') {
        setAiImportResult(result);
        setAiResult(null);
      } else {
        setAiResult(result);
        setAiImportResult(null);
      }

      setForm(prev => ({
        ...prev,
        name: result.projectName || prev.name,
        description: result.projectDescription || prev.description,
      }));
      setStep('ai-preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la génération');
    }
  };

  const handleAICreate = async () => {
    const result = aiResult || aiImportResult;
    if (!result) return;

    setIsCreating(true);
    setError(null);

    try {
      // Determine project status based on import progress
      let projectStatus: ProjectStatus = 'PLANNING';
      if (aiImportResult) {
        if (aiImportResult.projectProgress >= 100) {
          projectStatus = 'COMPLETED';
        } else if (aiImportResult.projectProgress > 0) {
          projectStatus = 'IN_PROGRESS';
        }
      }

      const project = await createProject({
        name: form.name || result.projectName || 'Nouveau projet',
        description: form.description || result.projectDescription,
        type: form.type,
        status: projectStatus,
        aiGenerated: true,
        aiPrompt: aiPrompt,
        budget: form.budget ? parseFloat(form.budget) : undefined,
        currency: form.currency,
      });

      // Apply AI-generated structure (epics and tasks)
      const epicsToApply = aiImportResult?.epics || aiResult?.epics || [];
      if (epicsToApply.length > 0) {
        const applyRes = await fetch(`/api/projects/${project.id}/ai/apply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: aiImportResult ? 'import' : 'new',
            epics: epicsToApply,
          }),
        });

        if (!applyRes.ok) {
          const applyError = await applyRes.json();
          console.error('Error applying AI structure:', applyError);
          // Continue anyway, project is created
        }
      }

      router.push(`/dashboard/projects/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création');
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusIcon = (status: AITaskStatus) => {
    switch (status) {
      case 'DONE':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'IN_PROGRESS':
        return <Clock className="h-4 w-4 text-orange-500" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: AITaskStatus) => {
    switch (status) {
      case 'DONE':
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
            <Check className="h-3 w-3" /> Fait
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
            <Clock className="h-3 w-3" /> En cours
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            <Circle className="h-3 w-3" /> À faire
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen gradient-mesh py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/projects"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux projets
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Nouveau projet</h1>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Step: Mode Selection */}
        {step === 'mode' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button
              onClick={() => setStep('manual')}
              className="bg-white rounded-xl border-2 border-gray-200 p-8 text-left hover:border-violet-300 hover:shadow-lg transition-all group"
            >
              <div className="w-14 h-14 bg-violet-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-violet-200 transition-colors">
                <FolderPlus className="h-7 w-7 text-violet-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Création manuelle</h3>
              <p className="text-gray-500 mb-4">
                Créez votre projet étape par étape et ajoutez les tâches manuellement.
              </p>
              <span className="inline-flex items-center text-violet-600 font-medium group-hover:gap-2 transition-all">
                Commencer <ChevronRight className="h-4 w-4 ml-1" />
              </span>
            </button>

            <button
              onClick={() => { setAiMode('new'); setStep('ai-prompt'); }}
              className="bg-gradient-to-br from-violet-50 to-orange-50 rounded-xl border-2 border-violet-200 p-8 text-left hover:border-violet-400 hover:shadow-lg transition-all group"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-orange-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Nouveau projet IA</h3>
              <p className="text-gray-500 mb-4">
                Décrivez votre projet et laissez l&apos;IA générer la structure, les epics et les tâches.
              </p>
              <span className="inline-flex items-center text-violet-600 font-medium group-hover:gap-2 transition-all">
                Générer <ChevronRight className="h-4 w-4 ml-1" />
              </span>
            </button>

            <button
              onClick={() => { setAiMode('import'); setStep('ai-prompt'); }}
              className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border-2 border-emerald-200 p-8 text-left hover:border-emerald-400 hover:shadow-lg transition-all group"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Upload className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Importer existant</h3>
              <p className="text-gray-500 mb-4">
                Importez un projet déjà en cours avec son état d&apos;avancement (tâches terminées, en cours).
              </p>
              <span className="inline-flex items-center text-emerald-600 font-medium group-hover:gap-2 transition-all">
                Importer <ChevronRight className="h-4 w-4 ml-1" />
              </span>
            </button>
          </div>
        )}

        {/* Step: Manual Creation */}
        {step === 'manual' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du projet <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  placeholder="Mon super projet"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  placeholder="Décrivez votre projet..."
                />
              </div>

              {/* Type & Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as ProjectType })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  >
                    {PROJECT_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as ProjectStatus })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  >
                    {PROJECT_STATUSES.map(status => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Budget */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
                  <input
                    type="number"
                    value={form.budget}
                    onChange={(e) => setForm({ ...form, budget: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                    placeholder="10000"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Devise</label>
                  <select
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  >
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                  <input
                    type="date"
                    value={form.deadline}
                    onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between pt-6 border-t border-gray-200">
                <button
                  onClick={() => setStep('mode')}
                  className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Retour
                </button>
                <button
                  onClick={handleManualSubmit}
                  disabled={isCreating}
                  className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Création...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Créer le projet
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step: AI Prompt */}
        {step === 'ai-prompt' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  aiMode === 'import'
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-500'
                    : 'bg-gradient-to-br from-violet-500 to-orange-500'
                }`}>
                  {aiMode === 'import' ? (
                    <Upload className="h-5 w-5 text-white" />
                  ) : (
                    <Sparkles className="h-5 w-5 text-white" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {aiMode === 'import' ? 'Import de projet existant' : 'Génération IA'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {aiMode === 'import'
                      ? 'Décrivez votre projet avec son état d\'avancement'
                      : 'Décrivez votre projet en détail'}
                  </p>
                </div>
              </div>

              {/* Project Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type de projet</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as ProjectType })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                >
                  {PROJECT_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              {/* AI Prompt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {aiMode === 'import' ? 'Description du projet existant' : 'Description du projet'} <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  rows={8}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  placeholder={aiMode === 'import'
                    ? `Décrivez votre projet existant avec ce qui a été fait, ce qui est en cours et ce qui reste à faire.

Exemple :
Projet e-commerce "Ma Boutique" - développement d'un site de vente en ligne.

Ce qui est TERMINÉ :
- Design et maquettes validées
- Base de données et modèles produits
- Page d'accueil et catalogue
- Système de filtres

EN COURS :
- Panier et tunnel de commande (70% fait)
- Intégration Stripe (tests en cours)

À FAIRE :
- Interface d'administration
- Gestion des stocks
- Emails transactionnels
- Tests et mise en production`
                    : `Décrivez votre projet en détail : objectifs, fonctionnalités souhaitées, public cible, contraintes techniques...

Exemple : Je veux créer un site e-commerce pour vendre des produits artisanaux. Il doit avoir un catalogue avec filtres, un panier, un système de paiement Stripe, et une interface admin pour gérer les commandes. Le site doit être responsive et optimisé SEO.`}
                />
                <p className="mt-2 text-sm text-gray-500">
                  {aiMode === 'import'
                    ? 'Précisez clairement le statut de chaque élément : terminé, en cours ou à faire.'
                    : 'Plus votre description est détaillée, meilleure sera la génération.'}
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-between pt-6 border-t border-gray-200">
                <button
                  onClick={() => setStep('mode')}
                  className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Retour
                </button>
                <button
                  onClick={handleAIGenerate}
                  disabled={isGenerating}
                  className={`px-6 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2 ${
                    aiMode === 'import'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600'
                      : 'bg-gradient-to-r from-violet-600 to-orange-500 hover:from-violet-700 hover:to-orange-600'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {aiMode === 'import' ? 'Import en cours...' : 'Génération en cours...'}
                    </>
                  ) : (
                    <>
                      {aiMode === 'import' ? <Upload className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                      {aiMode === 'import' ? 'Importer le projet' : 'Générer la structure'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step: AI Preview */}
        {step === 'ai-preview' && (aiResult || aiImportResult) && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  aiImportResult ? 'bg-emerald-100' : 'bg-green-100'
                }`}>
                  <Check className={`h-5 w-5 ${aiImportResult ? 'text-emerald-600' : 'text-green-600'}`} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {aiImportResult ? 'Projet importé' : 'Structure générée'}
                  </h2>
                  <p className="text-sm text-gray-500">Vérifiez et ajustez si nécessaire</p>
                </div>
              </div>

              {/* Import Stats */}
              {aiImportResult && (
                <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-gray-900">{aiImportResult.projectProgress}%</div>
                    <div className="text-sm text-gray-500">Progression</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{aiImportResult.stats.completedTasks}</div>
                    <div className="text-sm text-gray-500">Terminées</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">{aiImportResult.stats.inProgressTasks}</div>
                    <div className="text-sm text-gray-500">En cours</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-gray-600">{aiImportResult.stats.todoTasks}</div>
                    <div className="text-sm text-gray-500">À faire</div>
                  </div>
                </div>
              )}

              {/* Project Name */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du projet</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                />
              </div>

              {/* Project Description */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                />
              </div>

              {/* Epics Preview - Import Mode */}
              {aiImportResult && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Epics importés ({aiImportResult.epics.length})</h3>
                  <div className="space-y-4">
                    {aiImportResult.epics.map((epic, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: epic.color || '#8B5CF6' }}
                            />
                            <h4 className="font-medium text-gray-900">{epic.title}</h4>
                          </div>
                          {getStatusBadge(epic.status)}
                        </div>
                        {epic.description && (
                          <p className="text-sm text-gray-500 mb-3">{epic.description}</p>
                        )}
                        {epic.progress !== undefined && epic.progress > 0 && (
                          <div className="mb-3">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>Progression</span>
                              <span>{epic.progress}%</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${epic.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                        {epic.tasks && epic.tasks.length > 0 && (
                          <div className="pl-4 border-l-2 border-gray-100">
                            <p className="text-xs font-medium text-gray-500 uppercase mb-2">
                              {epic.tasks.length} tâches
                            </p>
                            <ul className="space-y-2">
                              {epic.tasks.slice(0, 6).map((task, taskIndex) => (
                                <li key={taskIndex} className="text-sm text-gray-600 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    {getStatusIcon(task.status)}
                                    <span className={task.status === 'DONE' ? 'line-through text-gray-400' : ''}>
                                      {task.title}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {task.storyPoints && (
                                      <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                                        {task.storyPoints} pts
                                      </span>
                                    )}
                                  </div>
                                </li>
                              ))}
                              {epic.tasks.length > 6 && (
                                <li className="text-xs text-gray-400">
                                  +{epic.tasks.length - 6} autres tâches
                                </li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Epics Preview - New Mode */}
              {aiResult && !aiImportResult && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Epics générés ({aiResult.epics.length})</h3>
                  <div className="space-y-4">
                    {aiResult.epics.map((epic, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: epic.color || '#8B5CF6' }}
                          />
                          <h4 className="font-medium text-gray-900">{epic.title}</h4>
                        </div>
                        {epic.description && (
                          <p className="text-sm text-gray-500 mb-3">{epic.description}</p>
                        )}
                        {epic.stories && epic.stories.length > 0 && (
                          <div className="pl-4 border-l-2 border-gray-100">
                            <p className="text-xs font-medium text-gray-500 uppercase mb-2">
                              {epic.stories.length} stories
                            </p>
                            <ul className="space-y-1">
                              {epic.stories.slice(0, 5).map((story, storyIndex) => (
                                <li key={storyIndex} className="text-sm text-gray-600 flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                                  {story.title}
                                  {story.storyPoints && (
                                    <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                                      {story.storyPoints} pts
                                    </span>
                                  )}
                                </li>
                              ))}
                              {epic.stories.length > 5 && (
                                <li className="text-xs text-gray-400">
                                  +{epic.stories.length - 5} autres stories
                                </li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Total Points */}
              {(aiResult?.estimatedTotalPoints || aiImportResult?.estimatedTotalPoints) && (
                <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between">
                  <span className="text-gray-600">Total estimé</span>
                  <span className={`font-bold ${aiImportResult ? 'text-emerald-600' : 'text-violet-600'}`}>
                    {aiResult?.estimatedTotalPoints || aiImportResult?.estimatedTotalPoints} story points
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-between">
              <button
                onClick={() => setStep('ai-prompt')}
                className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Modifier le prompt
              </button>
              <button
                onClick={handleAICreate}
                disabled={isCreating}
                className={`px-6 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2 ${
                  aiImportResult
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-violet-600 hover:bg-violet-700'
                }`}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Créer le projet
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
