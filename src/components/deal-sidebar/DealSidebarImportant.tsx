'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, Plus, Trash2, Clock, User as UserIcon } from 'lucide-react';
import { ImportantComment } from './types';

interface DealSidebarImportantProps {
  dealId: string;
  currentUserId: string;
  onCountChange?: (count: number) => void;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "à l'instant";
  if (diffMins < 60) return `il y a ${diffMins} min`;
  if (diffHours < 24) return `il y a ${diffHours}h`;
  if (diffDays === 1) return 'hier';
  if (diffDays < 7) return `il y a ${diffDays} jours`;

  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export default function DealSidebarImportant({
  dealId,
  currentUserId,
  onCountChange,
}: DealSidebarImportantProps) {
  const [comments, setComments] = useState<ImportantComment[]>([]);
  const [newContent, setNewContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Charger les commentaires
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await fetch(`/api/deals/${dealId}/important-comments`);
        if (response.ok) {
          const data = await response.json();
          setComments(data.comments || []);
          onCountChange?.(data.comments?.length || 0);
        }
      } catch (error) {
        console.error('Erreur chargement commentaires importants:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComments();
  }, [dealId, onCountChange]);

  // Ajouter un commentaire
  const handleAdd = async () => {
    if (!newContent.trim()) return;

    setIsAdding(true);
    try {
      const response = await fetch(`/api/deals/${dealId}/important-comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments((prev) => [data.comment, ...prev]);
        setNewContent('');
        onCountChange?.(comments.length + 1);
      } else {
        const error = await response.json();
        alert(error.error || 'Erreur lors de l\'ajout');
      }
    } catch (error) {
      console.error('Erreur ajout commentaire:', error);
      alert('Erreur lors de l\'ajout du commentaire');
    } finally {
      setIsAdding(false);
    }
  };

  // Supprimer un commentaire
  const handleDelete = async (commentId: string) => {
    setDeletingId(commentId);
    try {
      const response = await fetch(
        `/api/deals/${dealId}/important-comments?commentId=${commentId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        onCountChange?.(comments.length - 1);
      } else {
        const error = await response.json();
        alert(error.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur suppression commentaire:', error);
      alert('Erreur lors de la suppression');
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Clock className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle className="h-5 w-5 text-orange-500" />
        <h3 className="text-lg font-semibold text-gray-900">
          Commentaires importants
        </h3>
        {comments.length > 0 && (
          <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full">
            {comments.length}
          </span>
        )}
      </div>

      {/* Liste des commentaires */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 max-h-[400px]">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Aucun commentaire important</p>
            <p className="text-xs text-gray-400 mt-1">
              Ajoutez des notes importantes concernant ce deal
            </p>
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-orange-50 border border-orange-100 rounded-lg p-3 relative group"
            >
              {/* Header du commentaire */}
              <div className="flex items-center gap-2 mb-2">
                {comment.user.avatar ? (
                  <img
                    src={comment.user.avatar}
                    alt=""
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <div className="w-6 h-6 bg-orange-200 text-orange-700 rounded-full flex items-center justify-center text-xs font-medium">
                    {comment.user.firstName?.[0]}
                    {comment.user.lastName?.[0]}
                  </div>
                )}
                <span className="text-sm font-medium text-gray-900">
                  {comment.user.firstName} {comment.user.lastName}
                </span>
                <span className="text-xs text-gray-500">
                  - {formatRelativeTime(comment.createdAt)}
                </span>
              </div>

              {/* Contenu */}
              <p className="text-sm text-gray-700 whitespace-pre-wrap pr-8">
                {comment.content}
              </p>

              {/* Bouton supprimer (seulement pour l'auteur) */}
              {comment.userId === currentUserId && (
                <button
                  onClick={() => handleDelete(comment.id)}
                  disabled={deletingId === comment.id}
                  className="absolute top-3 right-3 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                  title="Supprimer"
                >
                  {deletingId === comment.id ? (
                    <Clock className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Formulaire d'ajout */}
      <div className="border-t border-gray-200 pt-4">
        <textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="Ajouter un commentaire important..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm resize-none"
          rows={3}
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={handleAdd}
            disabled={isAdding || !newContent.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            {isAdding ? (
              <Clock className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Ajouter
          </button>
        </div>
      </div>
    </div>
  );
}
