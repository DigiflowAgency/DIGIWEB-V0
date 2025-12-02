'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Target, Plus, Edit2, Trash2, Check, X, TrendingUp, DollarSign } from 'lucide-react';

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
  users?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

interface Stats {
  totalSales: number;
  totalRevenue: number;
}

export default function ObjectivesPage() {
  const { data: session } = useSession();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [stats, setStats] = useState<Stats>({ totalSales: 0, totalRevenue: 0 });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [formData, setFormData] = useState({
    type: 'PERSONAL' as 'PERSONAL' | 'SYSTEM',
    title: '',
    description: '',
    targetValue: '',
    deadline: '',
  });

  const isAdmin = session?.user?.role === 'ADMIN';

  useEffect(() => {
    fetchGoals();
  }, []);

  useEffect(() => {
    if (session?.user?.id) {
      fetchStats();
    }
  }, [session?.user?.id, isAdmin]);

  const fetchGoals = async () => {
    try {
      const res = await fetch('/api/goals');
      const data = await res.json();
      setGoals(data.goals || []);
    } catch (error) {
      console.error('Erreur chargement objectifs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Récupérer les deals CLOSING (ventes signées) filtrés par utilisateur
      const params = new URLSearchParams();
      params.append('stage', 'CLOSING');

      // Pour les non-admins, filtrer par leur propre ID
      if (!isAdmin && session?.user?.id) {
        params.append('ownerId', session.user.id);
      }

      const res = await fetch(`/api/deals?${params.toString()}`);
      const data = await res.json();

      const totalSales = data.deals?.length || 0;
      const totalRevenue = data.deals?.reduce((sum: number, deal: any) => sum + (deal.value || 0), 0) || 0;

      setStats({ totalSales, totalRevenue });
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        type: formData.type,
        title: formData.title,
        description: formData.description || null,
        targetValue: formData.targetValue ? parseFloat(formData.targetValue) : null,
        deadline: formData.deadline || null,
      };

      if (editingGoal) {
        // Update
        const res = await fetch(`/api/goals/${editingGoal.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const error = await res.json();
          alert(error.error || 'Erreur lors de la modification');
          return;
        }
      } else {
        // Create
        const res = await fetch('/api/goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const error = await res.json();
          alert(error.error || 'Erreur lors de la création');
          return;
        }
      }

      await fetchGoals();
      closeModal();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Une erreur est survenue');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet objectif ?')) return;

    try {
      const res = await fetch(`/api/goals/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchGoals();
      } else {
        const error = await res.json();
        alert(error.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleToggleComplete = async (goal: Goal) => {
    try {
      const res = await fetch(`/api/goals/${goal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !goal.completed }),
      });

      if (res.ok) {
        await fetchGoals();
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const openModal = (goal?: Goal) => {
    if (goal) {
      setEditingGoal(goal);
      setFormData({
        type: goal.type,
        title: goal.title,
        description: goal.description || '',
        targetValue: goal.targetValue?.toString() || '',
        deadline: goal.deadline ? goal.deadline.split('T')[0] : '',
      });
    } else {
      setEditingGoal(null);
      setFormData({
        type: 'PERSONAL',
        title: '',
        description: '',
        targetValue: '',
        deadline: '',
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingGoal(null);
    setFormData({
      type: 'PERSONAL',
      title: '',
      description: '',
      targetValue: '',
      deadline: '',
    });
  };

  const personalGoals = goals.filter(g => g.type === 'PERSONAL');
  const systemGoals = goals.filter(g => g.type === 'SYSTEM');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Target className="h-8 w-8 text-violet-600" />
          Objectifs
        </h1>
        <p className="text-gray-600 mt-2">
          Suivez vos objectifs personnels et les objectifs globaux de l'entreprise
        </p>
      </div>

      {/* Stats d'avancement */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-violet-100 text-sm font-medium">Ventes signées</p>
              <p className="text-4xl font-bold mt-2">{stats.totalSales}</p>
            </div>
            <div className="bg-white/20 rounded-full p-4">
              <TrendingUp className="h-8 w-8" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">CA signé</p>
              <p className="text-4xl font-bold mt-2">{stats.totalRevenue.toLocaleString('fr-FR')} €</p>
            </div>
            <div className="bg-white/20 rounded-full p-4">
              <DollarSign className="h-8 w-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Mes objectifs personnels */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Mes objectifs personnels</h2>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Nouvel objectif
          </button>
        </div>

        {personalGoals.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Target className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Vous n'avez pas encore d'objectif personnel</p>
            <button
              onClick={() => openModal()}
              className="text-violet-600 hover:text-violet-700 font-medium"
            >
              Créer votre premier objectif
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {personalGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={() => openModal(goal)}
                onDelete={() => handleDelete(goal.id)}
                onToggleComplete={() => handleToggleComplete(goal)}
                canEdit={true}
              />
            ))}
          </div>
        )}
      </div>

      {/* Objectifs du système */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Objectifs de l'entreprise</h2>
          {isAdmin && (
            <button
              onClick={() => {
                setFormData(prev => ({ ...prev, type: 'SYSTEM' }));
                openModal();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Ajouter objectif système
            </button>
          )}
        </div>

        {systemGoals.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Target className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucun objectif système défini</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {systemGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={() => openModal(goal)}
                onDelete={() => handleDelete(goal.id)}
                onToggleComplete={() => handleToggleComplete(goal)}
                canEdit={isAdmin}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-900">
                {editingGoal ? 'Modifier l\'objectif' : 'Nouvel objectif'}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {isAdmin && !editingGoal && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type d'objectif
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'PERSONAL' | 'SYSTEM' }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  >
                    <option value="PERSONAL">Personnel</option>
                    <option value="SYSTEM">Système</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  placeholder="Ex: Atteindre 50 ventes ce mois"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  placeholder="Décrivez votre objectif..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valeur cible
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.targetValue}
                    onChange={(e) => setFormData(prev => ({ ...prev, targetValue: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    placeholder="Ex: 50000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date limite
                  </label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium"
                >
                  {editingGoal ? 'Modifier' : 'Créer'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function GoalCard({
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

  return (
    <div className={`bg-white rounded-xl border-2 p-6 ${
      goal.completed ? 'border-emerald-200 bg-emerald-50/30' : isOverdue ? 'border-red-200 bg-red-50/30' : 'border-gray-200'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className={`text-lg font-semibold ${goal.completed ? 'text-emerald-900 line-through' : 'text-gray-900'}`}>
            {goal.title}
          </h3>
          {goal.description && (
            <p className="text-gray-600 text-sm mt-1">{goal.description}</p>
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
              {goal.currentValue?.toLocaleString('fr-FR')} / {goal.targetValue.toLocaleString('fr-FR')}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                goal.completed ? 'bg-emerald-500' : 'bg-violet-600'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        {goal.deadline && (
          <span className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
            {isOverdue ? '⚠️ Échéance dépassée' : `Échéance: ${new Date(goal.deadline).toLocaleDateString('fr-FR')}`}
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
              Terminé
            </>
          ) : (
            <>
              <Target className="h-4 w-4" />
              En cours
            </>
          )}
        </button>
      </div>
    </div>
  );
}
