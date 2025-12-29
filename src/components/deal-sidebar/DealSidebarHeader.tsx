'use client';

import { X, Edit2, Save, Trash2 } from 'lucide-react';

interface DealSidebarHeaderProps {
  title: string;
  isEditing: boolean;
  isSaving: boolean;
  onClose: () => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export default function DealSidebarHeader({
  title,
  isEditing,
  isSaving,
  onClose,
  onEdit,
  onSave,
  onCancel,
  onDelete,
}: DealSidebarHeaderProps) {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-violet-600 to-orange-500">
        <h2 className="text-xl font-bold text-white truncate flex-1">{title}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        {onDelete && !isEditing && (
          <button
            onClick={onDelete}
            className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Supprimer
          </button>
        )}
        <div className="flex items-center gap-2 ml-auto">
          {!isEditing ? (
            <button
              onClick={onEdit}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
            >
              <Edit2 className="h-4 w-4" />
              Modifier
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={onSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
