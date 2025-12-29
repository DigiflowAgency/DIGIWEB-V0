'use client';

import { useState } from 'react';
import { User, UserPlus, UserMinus } from 'lucide-react';
import { Deal, User as UserType, DealAssignee } from './types';

interface DealSidebarAssigneesProps {
  deal: Deal;
  users: UserType[];
  isEditing: boolean;
  onUpdate: () => void;
}

export default function DealSidebarAssignees({
  deal,
  users,
  isEditing,
  onUpdate,
}: DealSidebarAssigneesProps) {
  const [showAddAssignee, setShowAddAssignee] = useState(false);
  const [newAssigneeId, setNewAssigneeId] = useState('');
  const [isAddingAssignee, setIsAddingAssignee] = useState(false);

  const handleAddAssignee = async () => {
    if (!newAssigneeId) return;

    setIsAddingAssignee(true);
    try {
      const response = await fetch(`/api/deals/${deal.id}/assignees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: newAssigneeId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de l\'ajout');
      }

      setNewAssigneeId('');
      setShowAddAssignee(false);
      onUpdate();
    } catch (error) {
      console.error('Erreur:', error);
      alert(error instanceof Error ? error.message : 'Erreur lors de l\'ajout de l\'assigné');
    } finally {
      setIsAddingAssignee(false);
    }
  };

  const handleRemoveAssignee = async (userId: string) => {
    try {
      const response = await fetch(`/api/deals/${deal.id}/assignees?userId=${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la suppression');
      }

      onUpdate();
    } catch (error) {
      console.error('Erreur:', error);
      alert(error instanceof Error ? error.message : 'Erreur lors de la suppression de l\'assigné');
    }
  };

  // Filtrer les utilisateurs disponibles (pas déjà assignés et pas le owner)
  const availableUsers = users.filter(
    (u) =>
      u.id !== deal.ownerId &&
      !deal.deal_assignees?.some((a: DealAssignee) => a.user.id === u.id)
  );

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center justify-between">
        <span>Équipe assignée</span>
        {!isEditing && (
          <button
            onClick={() => setShowAddAssignee(!showAddAssignee)}
            className="text-violet-600 hover:text-violet-700 flex items-center gap-1 text-xs"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Ajouter
          </button>
        )}
      </label>

      {/* Formulaire d'ajout d'assigné */}
      {showAddAssignee && !isEditing && (
        <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex gap-2">
            <select
              value={newAssigneeId}
              onChange={(e) => setNewAssigneeId(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="">Sélectionner...</option>
              {availableUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.firstName} {user.lastName}
                </option>
              ))}
            </select>
            <button
              onClick={handleAddAssignee}
              disabled={!newAssigneeId || isAddingAssignee}
              className="px-3 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 text-sm"
            >
              {isAddingAssignee ? '...' : 'OK'}
            </button>
            <button
              onClick={() => {
                setShowAddAssignee(false);
                setNewAssigneeId('');
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-sm"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Liste des assignés */}
      <div className="space-y-2">
        {deal.deal_assignees && deal.deal_assignees.length > 0 ? (
          deal.deal_assignees.map((assignee: DealAssignee) => (
            <div
              key={assignee.id}
              className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center">
                  <User className="h-3.5 w-3.5 text-orange-600" />
                </div>
                <span className="text-sm text-gray-700">
                  {assignee.user.firstName} {assignee.user.lastName}
                </span>
                {assignee.role && (
                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                    {assignee.role}
                  </span>
                )}
              </div>
              {!isEditing && (
                <button
                  onClick={() => handleRemoveAssignee(assignee.user.id)}
                  className="text-red-400 hover:text-red-600 p-1"
                  title="Retirer"
                >
                  <UserMinus className="h-4 w-4" />
                </button>
              )}
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-400 italic">Aucun membre supplémentaire</p>
        )}
      </div>
    </div>
  );
}
