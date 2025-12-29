'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  Plus,
  Edit2,
  Trash2,
  Check,
  Building2,
  User,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  RefreshCw,
  BarChart3,
  Settings,
  Loader2,
  AlertCircle,
  UserPlus,
} from 'lucide-react';
import {
  useEnterpriseObjectives,
  useEnterpriseObjectiveMutations,
  MONTH_NAMES,
  EnterpriseObjective,
  CreateObjectiveData,
  InitObjectivesData,
} from '@/hooks/useEnterpriseObjectives';
import {
  ObjectiveCard,
  ObjectiveOverview,
  ObjectiveHistory,
  ObjectiveForm,
  InitMonthModal,
} from '@/components/objectives';
import useSWR from 'swr';

interface Goal {
  id: string;
  type: 'PERSONAL' | 'SYSTEM';
  title: string;
  description?: string | null;
  targetValue?: number | null;
  currentValue?: number;
  deadline?: string | null;
  completed: boolean;
  completedAt?: string | null;
  metricType?: string | null;
  users?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  assignedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

type TabType = 'enterprise' | 'personal';
type EnterpriseView = 'overview' | 'details' | 'history';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function ObjectivesPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<TabType>('enterprise');
  const [enterpriseView, setEnterpriseView] = useState<EnterpriseView>('overview');

  // Date state for enterprise objectives
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [historyMetricType, setHistoryMetricType] = useState('CA_MENSUEL');

  // Modals
  const [showObjectiveForm, setShowObjectiveForm] = useState(false);
  const [showInitModal, setShowInitModal] = useState(false);
  const [showPersonalGoalModal, setShowPersonalGoalModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingObjective, setEditingObjective] = useState<EnterpriseObjective | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // Form state for personal goals
  const [goalFormData, setGoalFormData] = useState({
    title: '',
    description: '',
    targetValue: '',
    deadline: '',
    assignToUserId: '',
    metricType: '',
  });

  const isAdmin = session?.user?.role === 'ADMIN';

  // Enterprise objectives data
  const { objectives, summary, isLoading: objectivesLoading, mutate: mutateObjectives } = useEnterpriseObjectives({
    year: selectedYear,
    month: selectedMonth,
    period: 'MONTHLY',
  });

  const { createObjective, updateObjective, deleteObjective, initializeMonth, loading: mutationLoading } = useEnterpriseObjectiveMutations();

  // Personal goals data
  const { data: goalsData, mutate: mutateGoals, isLoading: goalsLoading } = useSWR<{ goals: Goal[] }>(
    '/api/goals?type=PERSONAL',
    fetcher
  );

  // Users list for assignment (admin only)
  const { data: usersData } = useSWR<{ users: User[] }>(
    isAdmin ? '/api/users' : null,
    fetcher
  );

  // History data - empty for now, will be populated from real data later
  const historyData: Array<{
    month: number;
    year: number;
    metricType: string;
    targetValue: number;
    currentValue: number;
    percentage: number;
  }> = [];

  const personalGoals = goalsData?.goals || [];
  const commercials = usersData?.users?.filter(u => u.role === 'COMMERCIAL') || [];

  // Navigation functions
  const goToPreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  const goToCurrentMonth = () => {
    setSelectedMonth(currentDate.getMonth() + 1);
    setSelectedYear(currentDate.getFullYear());
  };

  // Enterprise objectives handlers
  const handleCreateOrUpdateObjective = async (data: CreateObjectiveData) => {
    if (editingObjective) {
      await updateObjective(editingObjective.id, data);
    } else {
      await createObjective(data);
    }
    mutateObjectives();
  };

  const handleInitializeMonth = async (data: InitObjectivesData) => {
    await initializeMonth(data);
    mutateObjectives();
  };

  const handleEditObjective = (objective: EnterpriseObjective) => {
    setEditingObjective(objective);
    setShowObjectiveForm(true);
  };

  const handleDeleteObjective = async (id: string) => {
    if (!confirm('Etes-vous sur de vouloir supprimer cet objectif ?')) return;
    await deleteObjective(id);
    mutateObjectives();
  };

  // Personal goals handlers
  const openPersonalGoalModal = (goal?: Goal) => {
    if (goal) {
      setEditingGoal(goal);
      setGoalFormData({
        title: goal.title,
        description: goal.description || '',
        targetValue: goal.targetValue?.toString() || '',
        deadline: goal.deadline ? goal.deadline.split('T')[0] : '',
        assignToUserId: '',
        metricType: goal.metricType || '',
      });
    } else {
      setEditingGoal(null);
      setGoalFormData({
        title: '',
        description: '',
        targetValue: '',
        deadline: '',
        assignToUserId: '',
        metricType: '',
      });
    }
    setShowPersonalGoalModal(true);
  };

  const openAssignModal = () => {
    setGoalFormData({
      title: '',
      description: '',
      targetValue: '',
      deadline: '',
      assignToUserId: '',
      metricType: '',
    });
    setShowAssignModal(true);
  };

  const handleSubmitPersonalGoal = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        type: 'PERSONAL' as const,
        title: goalFormData.title,
        description: goalFormData.description || null,
        targetValue: goalFormData.targetValue ? parseFloat(goalFormData.targetValue) : null,
        deadline: goalFormData.deadline || null,
        metricType: goalFormData.metricType || null,
      };

      if (editingGoal) {
        await fetch(`/api/goals/${editingGoal.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch('/api/goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      mutateGoals();
      setShowPersonalGoalModal(false);
      setEditingGoal(null);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleSubmitAssignGoal = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        type: 'PERSONAL' as const,
        title: goalFormData.title,
        description: goalFormData.description || null,
        targetValue: goalFormData.targetValue ? parseFloat(goalFormData.targetValue) : null,
        deadline: goalFormData.deadline || null,
        assignToUserId: goalFormData.assignToUserId,
        metricType: goalFormData.metricType || null,
      };

      await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      mutateGoals();
      setShowAssignModal(false);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!confirm('Etes-vous sur de vouloir supprimer cet objectif ?')) return;

    try {
      await fetch(`/api/goals/${id}`, { method: 'DELETE' });
      mutateGoals();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleToggleComplete = async (goal: Goal) => {
    try {
      await fetch(`/api/goals/${goal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !goal.completed }),
      });
      mutateGoals();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const isCurrentMonth = selectedYear === currentDate.getFullYear() && selectedMonth === currentDate.getMonth() + 1;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Target className="h-8 w-8 text-violet-600" />
          Objectifs
        </h1>
        <p className="text-gray-600 mt-2">
          Suivez vos objectifs personnels et les objectifs de l&apos;entreprise
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('enterprise')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-colors border-b-2 -mb-px ${
              activeTab === 'enterprise'
                ? 'text-violet-600 border-violet-600 bg-violet-50/50'
                : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Building2 className="h-5 w-5" />
            Objectifs Entreprise
            {objectives.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === 'enterprise' ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {objectives.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('personal')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-colors border-b-2 -mb-px ${
              activeTab === 'personal'
                ? 'text-violet-600 border-violet-600 bg-violet-50/50'
                : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <User className="h-5 w-5" />
            Mes Objectifs
            {personalGoals.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                activeTab === 'personal' ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {personalGoals.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab Content: Objectifs Entreprise */}
      <AnimatePresence mode="wait">
        {activeTab === 'enterprise' && (
          <motion.div
            key="enterprise"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Month Navigation */}
            <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4">
              <button
                onClick={goToPreviousMonth}
                className="p-2 text-gray-600 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                </h2>
                {!isCurrentMonth && (
                  <button
                    onClick={goToCurrentMonth}
                    className="text-sm text-violet-600 hover:text-violet-700 font-medium"
                  >
                    Mois actuel
                  </button>
                )}
              </div>

              <button
                onClick={goToNextMonth}
                className="p-2 text-gray-600 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* View Toggle & Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setEnterpriseView('overview')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    enterpriseView === 'overview'
                      ? 'bg-white text-violet-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Target className="h-4 w-4" />
                  Vue d&apos;ensemble
                </button>
                <button
                  onClick={() => setEnterpriseView('details')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    enterpriseView === 'details'
                      ? 'bg-white text-violet-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Settings className="h-4 w-4" />
                  Details
                </button>
                <button
                  onClick={() => setEnterpriseView('history')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    enterpriseView === 'history'
                      ? 'bg-white text-violet-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <BarChart3 className="h-4 w-4" />
                  Historique
                </button>
              </div>

              {isAdmin && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => mutateObjectives()}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                  >
                    <RefreshCw className={`h-4 w-4 ${objectivesLoading ? 'animate-spin' : ''}`} />
                    Recalculer
                  </button>
                  {objectives.length === 0 ? (
                    <button
                      onClick={() => setShowInitModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg font-medium hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg shadow-violet-200"
                    >
                      <Sparkles className="h-4 w-4" />
                      Initialiser le mois
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingObjective(null);
                        setShowObjectiveForm(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Ajouter
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Enterprise Content */}
            {objectivesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
              </div>
            ) : (
              <>
                {enterpriseView === 'overview' && (
                  <ObjectiveOverview objectives={objectives} isLoading={objectivesLoading} />
                )}

                {enterpriseView === 'details' && (
                  <div className="space-y-4">
                    {objectives.length === 0 ? (
                      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                        <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">
                          Aucun objectif defini pour {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                        </p>
                        {isAdmin && (
                          <button
                            onClick={() => setShowInitModal(true)}
                            className="text-violet-600 hover:text-violet-700 font-medium"
                          >
                            Initialiser ce mois
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {objectives.map((objective, index) => (
                          <ObjectiveCard
                            key={objective.id}
                            objective={objective}
                            onEdit={isAdmin ? () => handleEditObjective(objective) : undefined}
                            delay={index * 0.1}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {enterpriseView === 'history' && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      Historique des performances
                    </h3>
                    <ObjectiveHistory
                      data={historyData}
                      selectedMetricType={historyMetricType}
                      onMetricTypeChange={setHistoryMetricType}
                    />
                  </div>
                )}
              </>
            )}

            {/* Info box */}
            <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
              <p className="text-sm text-violet-800">
                <strong>Note:</strong> Les objectifs entreprise servent de base au calcul de vos primes mensuelles.
                Les valeurs actuelles sont calculees automatiquement depuis vos activites.
              </p>
            </div>
          </motion.div>
        )}

        {/* Tab Content: Mes Objectifs Personnels */}
        {activeTab === 'personal' && (
          <motion.div
            key="personal"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Mes objectifs personnels</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Objectifs personnels et objectifs assignes par l&apos;administration
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <button
                    onClick={openAssignModal}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    <UserPlus className="h-4 w-4" />
                    Assigner un objectif
                  </button>
                )}
                <button
                  onClick={() => openPersonalGoalModal()}
                  className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Nouvel objectif
                </button>
              </div>
            </div>

            {goalsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
              </div>
            ) : personalGoals.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Vous n&apos;avez pas encore d&apos;objectif personnel</p>
                <button
                  onClick={() => openPersonalGoalModal()}
                  className="text-violet-600 hover:text-violet-700 font-medium"
                >
                  Creer votre premier objectif
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {personalGoals.map((goal) => (
                  <PersonalGoalCard
                    key={goal.id}
                    goal={goal}
                    onEdit={() => openPersonalGoalModal(goal)}
                    onDelete={() => handleDeleteGoal(goal.id)}
                    onToggleComplete={() => handleToggleComplete(goal)}
                    canEdit={!goal.assignedBy || isAdmin}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enterprise Objective Form Modal */}
      <ObjectiveForm
        objective={editingObjective}
        isOpen={showObjectiveForm}
        onClose={() => {
          setShowObjectiveForm(false);
          setEditingObjective(null);
        }}
        onSubmit={handleCreateOrUpdateObjective}
        defaultYear={selectedYear}
        defaultMonth={selectedMonth}
      />

      {/* Init Month Modal */}
      <InitMonthModal
        isOpen={showInitModal}
        onClose={() => setShowInitModal(false)}
        onSubmit={handleInitializeMonth}
        currentYear={selectedYear}
        currentMonth={selectedMonth}
      />

      {/* Personal Goal Modal */}
      <AnimatePresence>
        {showPersonalGoalModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPersonalGoalModal(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">
                    {editingGoal ? 'Modifier l\'objectif' : 'Nouvel objectif personnel'}
                  </h3>
                  <button
                    onClick={() => setShowPersonalGoalModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                  >
                    <span className="sr-only">Fermer</span>
                    &times;
                  </button>
                </div>

                <form onSubmit={handleSubmitPersonalGoal} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Titre *</label>
                    <input
                      type="text"
                      required
                      value={goalFormData.title}
                      onChange={(e) => setGoalFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      placeholder="Ex: Ameliorer mes competences en negociation"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={goalFormData.description}
                      onChange={(e) => setGoalFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      placeholder="Decrivez votre objectif..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Valeur cible</label>
                      <input
                        type="number"
                        step="0.01"
                        value={goalFormData.targetValue}
                        onChange={(e) => setGoalFormData(prev => ({ ...prev, targetValue: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        placeholder="Ex: 50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date limite</label>
                      <input
                        type="date"
                        value={goalFormData.deadline}
                        onChange={(e) => setGoalFormData(prev => ({ ...prev, deadline: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium"
                    >
                      {editingGoal ? 'Modifier' : 'Creer'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPersonalGoalModal(false)}
                      className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Assign Goal Modal (Admin) */}
      <AnimatePresence>
        {showAssignModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAssignModal(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-xl">
                      <UserPlus className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Assigner un objectif
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowAssignModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                  >
                    &times;
                  </button>
                </div>

                <form onSubmit={handleSubmitAssignGoal} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Commercial *</label>
                    <select
                      required
                      value={goalFormData.assignToUserId}
                      onChange={(e) => setGoalFormData(prev => ({ ...prev, assignToUserId: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Selectionner un commercial...</option>
                      {commercials.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.firstName} {user.lastName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Titre de l&apos;objectif *</label>
                    <input
                      type="text"
                      required
                      value={goalFormData.title}
                      onChange={(e) => setGoalFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: Augmenter le nombre de RDV"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={goalFormData.description}
                      onChange={(e) => setGoalFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Details de l'objectif..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Valeur cible</label>
                      <input
                        type="number"
                        step="0.01"
                        value={goalFormData.targetValue}
                        onChange={(e) => setGoalFormData(prev => ({ ...prev, targetValue: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ex: 20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date limite</label>
                      <input
                        type="date"
                        value={goalFormData.deadline}
                        onChange={(e) => setGoalFormData(prev => ({ ...prev, deadline: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      Une notification sera envoyee au commercial lors de l&apos;assignation.
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Assigner l&apos;objectif
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAssignModal(false)}
                      className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Personal Goal Card Component
function PersonalGoalCard({
  goal,
  onEdit,
  onDelete,
  onToggleComplete,
  canEdit,
}: {
  goal: Goal;
  onEdit: () => void;
  onDelete: () => void;
  onToggleComplete: () => void;
  canEdit: boolean;
}) {
  const progress = goal.targetValue && goal.currentValue
    ? Math.min(100, (goal.currentValue / goal.targetValue) * 100)
    : 0;

  const isOverdue = goal.deadline && !goal.completed && new Date(goal.deadline) < new Date();
  const isAssigned = !!goal.assignedBy;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl border-2 p-6 ${
        goal.completed
          ? 'border-emerald-200 bg-emerald-50/30'
          : isOverdue
            ? 'border-red-200 bg-red-50/30'
            : isAssigned
              ? 'border-blue-200 hover:border-blue-300'
              : 'border-gray-200 hover:border-violet-200'
      } transition-colors`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`text-lg font-semibold ${goal.completed ? 'text-emerald-900 line-through' : 'text-gray-900'}`}>
              {goal.title}
            </h3>
            {isAssigned && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                Assigne
              </span>
            )}
          </div>
          {goal.description && (
            <p className="text-gray-600 text-sm mt-1">{goal.description}</p>
          )}
          {isAssigned && goal.assignedBy && (
            <p className="text-xs text-blue-600 mt-2">
              Assigne par {goal.assignedBy.firstName} {goal.assignedBy.lastName}
            </p>
          )}
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {goal.targetValue && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">Progression</span>
            <span className="font-semibold text-gray-900">
              {goal.currentValue?.toLocaleString('fr-FR') || 0} / {goal.targetValue.toLocaleString('fr-FR')}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                goal.completed ? 'bg-emerald-500' : isAssigned ? 'bg-blue-600' : 'bg-violet-600'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        {goal.deadline && (
          <span className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
            {isOverdue ? 'Echeance depassee' : `Echeance: ${new Date(goal.deadline).toLocaleDateString('fr-FR')}`}
          </span>
        )}
        <button
          onClick={onToggleComplete}
          className={`ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-sm transition-colors ${
            goal.completed
              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {goal.completed ? (
            <>
              <Check className="h-4 w-4" />
              Termine
            </>
          ) : (
            <>
              <Target className="h-4 w-4" />
              En cours
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
