'use client';

import { useState } from 'react';
import { MessageSquare, Plus, Clock } from 'lucide-react';
import { Note } from './types';

interface DealSidebarNotesProps {
  dealId: string;
  initialNotes: Note[];
  legacyComments?: string | null;
  onUpdate: () => void;
}

export default function DealSidebarNotes({
  dealId,
  initialNotes,
  legacyComments,
  onUpdate,
}: DealSidebarNotesProps) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) return;

    setIsAddingNote(true);
    try {
      const response = await fetch(`/api/deals/${dealId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNoteContent }),
      });

      if (response.ok) {
        const data = await response.json();
        setNotes((prev) => [data.note, ...prev]);
        setNewNoteContent('');
        onUpdate();
      } else {
        const error = await response.json();
        alert(error.error || 'Erreur lors de l\'ajout de la note');
      }
    } catch (error) {
      console.error('Erreur ajout note:', error);
      alert('Erreur lors de l\'ajout de la note');
    } finally {
      setIsAddingNote(false);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-violet-600" />
          Commentaires
          {notes.length > 0 && (
            <span className="bg-violet-100 text-violet-700 text-xs px-2 py-0.5 rounded-full">
              {notes.length}
            </span>
          )}
        </span>
      </h3>

      {/* Formulaire d'ajout de note */}
      <div className="mb-4">
        <div className="flex gap-2">
          <textarea
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm resize-none"
            rows={2}
            placeholder="Ajouter un commentaire..."
          />
          <button
            onClick={handleAddNote}
            disabled={isAddingNote || !newNoteContent.trim()}
            className="px-3 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors self-end"
          >
            {isAddingNote ? (
              <Clock className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Liste des notes */}
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {notes.length === 0 ? (
          <p className="text-gray-500 text-sm italic">Aucun commentaire</p>
        ) : (
          notes.map((note: Note) => (
            <div
              key={note.id}
              className="bg-gray-50 rounded-lg p-3 border border-gray-100"
            >
              <p className="text-gray-700 text-sm whitespace-pre-wrap mb-2">
                {note.content}
              </p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="font-medium">
                  {note.users?.firstName} {note.users?.lastName}
                </span>
                <span>
                  {new Date(note.createdAt).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Ancien champ comments (rétro-compatibilité) */}
      {legacyComments && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Notes anciennes :</p>
          <p className="text-gray-600 text-sm whitespace-pre-wrap bg-gray-50 p-2 rounded">
            {legacyComments}
          </p>
        </div>
      )}
    </div>
  );
}
