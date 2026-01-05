'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageSquare, Plus, Clock } from 'lucide-react';
import { Note, User } from './types';

interface DealSidebarNotesProps {
  dealId: string;
  initialNotes: Note[];
  legacyComments?: string | null;
  onUpdate: () => void;
  users: User[];
}

// Fonction pour rendre le contenu avec les mentions stylisées
function renderNoteContent(content: string): React.ReactNode {
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    // Texte avant la mention
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }
    // La mention stylisée
    parts.push(
      <span
        key={match.index}
        className="bg-violet-100 text-violet-700 px-1 rounded font-medium"
      >
        @{match[1]}
      </span>
    );
    lastIndex = match.index + match[0].length;
  }

  // Texte après la dernière mention
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts.length > 0 ? parts : content;
}

export default function DealSidebarNotes({
  dealId,
  initialNotes,
  legacyComments,
  onUpdate,
  users,
}: DealSidebarNotesProps) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  // États pour le système @mention
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filtrer les utilisateurs selon la query
  const filteredUsers = users.filter((user) => {
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    const query = mentionQuery.toLowerCase();
    return fullName.includes(query) || user.email.toLowerCase().includes(query);
  });

  // Détecter le @ pour afficher le dropdown
  const handleInput = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = newNoteContent.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex === -1) {
      setShowMentionDropdown(false);
      return;
    }

    const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);

    // Vérifier qu'il n'y a pas d'espace avant le @ (sauf si c'est le début)
    const charBeforeAt = lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : ' ';
    if (charBeforeAt !== ' ' && charBeforeAt !== '\n' && lastAtIndex !== 0) {
      setShowMentionDropdown(false);
      return;
    }

    // Vérifier si c'est une mention en cours (pas encore fermée)
    if (textAfterAt.includes(']') || textAfterAt.includes(' ')) {
      setShowMentionDropdown(false);
      return;
    }

    setMentionQuery(textAfterAt);
    setMentionStartIndex(lastAtIndex);
    setShowMentionDropdown(true);
    setSelectedIndex(0);
  }, [newNoteContent]);

  // Gérer le changement de texte
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewNoteContent(e.target.value);
  };

  // Déclencher la détection après chaque changement
  useEffect(() => {
    handleInput();
  }, [newNoteContent, handleInput]);

  // Insérer une mention
  const insertMention = (user: User) => {
    const fullName = `${user.firstName} ${user.lastName}`;
    const mention = `@[${fullName}](${user.id})`;

    const before = newNoteContent.slice(0, mentionStartIndex);
    const after = newNoteContent.slice(textareaRef.current?.selectionStart || mentionStartIndex);

    setNewNoteContent(before + mention + ' ' + after);
    setShowMentionDropdown(false);
    setMentionQuery('');
    setMentionStartIndex(-1);

    // Focus et positionner le curseur après la mention
    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = before.length + mention.length + 1;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  // Gérer la navigation clavier dans le dropdown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showMentionDropdown || filteredUsers.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredUsers.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredUsers.length) % filteredUsers.length);
        break;
      case 'Enter':
        if (showMentionDropdown && filteredUsers[selectedIndex]) {
          e.preventDefault();
          insertMention(filteredUsers[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowMentionDropdown(false);
        break;
      case 'Tab':
        if (showMentionDropdown && filteredUsers[selectedIndex]) {
          e.preventDefault();
          insertMention(filteredUsers[selectedIndex]);
        }
        break;
    }
  };

  // Fermer le dropdown si on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setShowMentionDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={newNoteContent}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm resize-y min-h-[80px]"
              rows={3}
              placeholder="Ajouter un commentaire... Tapez @ pour mentionner quelqu'un"
            />

            {/* Dropdown des mentions */}
            {showMentionDropdown && filteredUsers.length > 0 && (
              <div
                ref={dropdownRef}
                className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-50"
              >
                {filteredUsers.map((user, idx) => (
                  <button
                    key={user.id}
                    type="button"
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-violet-50 flex items-center gap-2 ${
                      idx === selectedIndex ? 'bg-violet-100' : ''
                    }`}
                    onClick={() => insertMention(user)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <div className="w-6 h-6 bg-violet-200 text-violet-700 rounded-full flex items-center justify-center text-xs font-medium">
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Message si aucun utilisateur trouvé */}
            {showMentionDropdown && filteredUsers.length === 0 && mentionQuery && (
              <div
                ref={dropdownRef}
                className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50"
              >
                <p className="text-sm text-gray-500">Aucun utilisateur trouvé pour &quot;{mentionQuery}&quot;</p>
              </div>
            )}
          </div>

          <button
            onClick={handleAddNote}
            disabled={isAddingNote || !newNoteContent.trim()}
            className="px-3 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors self-start"
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
                {renderNoteContent(note.content)}
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
