'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import type { TaskComment, ProjectMember } from '@/types/projects';
import { getInitials, getAvatarColor, extractMentions } from '@/lib/projects/utils';
import { Send, CornerDownRight, Edit2, Trash2 } from 'lucide-react';
import useSWR from 'swr';

interface TaskCommentsProps {
  taskId: string;
  comments: TaskComment[];
  onUpdate: () => void;
  projectId?: string;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erreur');
  return data;
};

const formatRelativeTime = (date: string): string => {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return then.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
};

// Parse and render content with @mentions styled
const renderContentWithMentions = (content: string) => {
  // Pattern: @[Name](userId)
  const parts = content.split(/(@\[[^\]]+\]\([^)]+\))/g);

  return parts.map((part, index) => {
    const match = part.match(/@\[([^\]]+)\]\(([^)]+)\)/);
    if (match) {
      const [, name] = match;
      return (
        <span
          key={index}
          className="bg-violet-100 text-violet-700 px-1 rounded font-medium"
        >
          @{name}
        </span>
      );
    }
    return part;
  });
};

export default function TaskComments({ taskId, comments, onUpdate, projectId }: TaskCommentsProps) {
  const { data: session } = useSession();
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(false);

  // Mention state
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Fetch project members for mentions
  const { data: membersData } = useSWR(
    projectId ? `/api/projects/${projectId}/members` : null,
    fetcher
  );
  const members: ProjectMember[] = membersData || [];

  // Filter members based on search
  const filteredMembers = members.filter(m => {
    if (!mentionSearch) return true;
    const fullName = `${m.user?.firstName} ${m.user?.lastName}`.toLowerCase();
    return fullName.includes(mentionSearch.toLowerCase());
  }).slice(0, 5);

  // Handle input change with mention detection
  const handleInputChange = (value: string, isReply = false) => {
    if (isReply) {
      setNewComment(value);
    } else {
      setNewComment(value);
    }

    // Check for @ trigger
    const cursorPos = inputRef.current?.selectionStart || value.length;
    setCursorPosition(cursorPos);

    // Find if we're in a mention context
    const textBeforeCursor = value.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      // Check if there's no space after @
      if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        setMentionSearch(textAfterAt);
        setShowMentions(true);
        setMentionIndex(0);
        return;
      }
    }

    setShowMentions(false);
    setMentionSearch('');
  };

  // Insert mention into text
  const insertMention = useCallback((member: ProjectMember) => {
    if (!member.user) return;

    const fullName = `${member.user.firstName} ${member.user.lastName}`;
    const mentionText = `@[${fullName}](${member.userId})`;

    const textBeforeCursor = newComment.slice(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    const textAfterCursor = newComment.slice(cursorPosition);

    const newText = textBeforeCursor.slice(0, lastAtIndex) + mentionText + ' ' + textAfterCursor;
    setNewComment(newText);
    setShowMentions(false);
    setMentionSearch('');

    // Focus back on input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }, [newComment, cursorPosition]);

  // Handle keyboard navigation in mentions
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showMentions && filteredMembers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex(prev => (prev + 1) % filteredMembers.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex(prev => (prev - 1 + filteredMembers.length) % filteredMembers.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(filteredMembers[mentionIndex]);
      } else if (e.key === 'Escape') {
        setShowMentions(false);
      }
    } else if (e.key === 'Enter' && !e.shiftKey && !replyTo) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async (parentId?: string) => {
    const content = newComment;
    if (!content.trim()) return;

    // Extract mentions from content
    const mentions = extractMentions(content);

    setLoading(true);
    try {
      const res = await fetch(`/api/projects/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, parentId, mentions }),
      });

      if (!res.ok) throw new Error('Failed to add comment');

      setNewComment('');
      setReplyTo(null);
      onUpdate();
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (commentId: string) => {
    if (!editContent.trim()) return;

    const mentions = extractMentions(editContent);

    setLoading(true);
    try {
      const res = await fetch(`/api/projects/tasks/${taskId}/comments`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, content: editContent, mentions }),
      });

      if (!res.ok) throw new Error('Failed to update comment');

      setEditingId(null);
      setEditContent('');
      onUpdate();
    } catch (error) {
      console.error('Failed to update comment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Supprimer ce commentaire ?')) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/projects/tasks/${taskId}/comments?commentId=${commentId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete comment');

      onUpdate();
    } catch (error) {
      console.error('Failed to delete comment:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderComment = (comment: TaskComment, isReply = false) => {
    const isOwner = session?.user?.id === comment.authorId;
    const isEditing = editingId === comment.id;

    return (
      <div key={comment.id} className={`${isReply ? 'ml-8' : ''}`}>
        <div className="flex gap-3">
          {comment.author && (
            <div
              className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-medium ${getAvatarColor(comment.author.id)}`}
            >
              {getInitials(comment.author.firstName, comment.author.lastName)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm text-gray-900">
                {comment.author?.firstName} {comment.author?.lastName}
              </span>
              <span className="text-xs text-gray-500">{formatRelativeTime(comment.createdAt)}</span>
              {comment.editedAt && (
                <span className="text-xs text-gray-400">(modifié)</span>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={2}
                  className="w-full text-sm border border-gray-300 rounded-lg p-2 focus:ring-violet-500 focus:border-violet-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdate(comment.id)}
                    disabled={loading}
                    className="text-xs bg-violet-600 text-white px-3 py-1 rounded hover:bg-violet-700 disabled:opacity-50"
                  >
                    Enregistrer
                  </button>
                  <button
                    onClick={() => { setEditingId(null); setEditContent(''); }}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {renderContentWithMentions(comment.content)}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  {!isReply && (
                    <button
                      onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                      className="text-xs text-gray-500 hover:text-violet-600 flex items-center gap-1"
                    >
                      <CornerDownRight className="w-3 h-3" />
                      Répondre
                    </button>
                  )}
                  {isOwner && (
                    <>
                      <button
                        onClick={() => { setEditingId(comment.id); setEditContent(comment.content); }}
                        className="text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
              </>
            )}

            {/* Reply input */}
            {replyTo === comment.id && (
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Écrire une réponse... (utilisez @ pour mentionner)"
                  className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-violet-500 focus:border-violet-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit(comment.id)}
                />
                <button
                  onClick={() => handleSubmit(comment.id)}
                  disabled={loading || !newComment.trim()}
                  className="p-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 space-y-3">
            {comment.replies.map(reply => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <h3 className="text-sm font-medium text-gray-700 mb-4">
        Commentaires ({comments.length})
      </h3>

      {/* Comment input with mention support */}
      <div className="flex gap-3 mb-6">
        {session?.user && (
          <div className="w-8 h-8 rounded-full flex-shrink-0 bg-violet-100 flex items-center justify-center text-violet-600 text-xs font-medium">
            {session.user.name?.charAt(0) || 'U'}
          </div>
        )}
        <div className="flex-1 relative">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={replyTo ? '' : newComment}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ajouter un commentaire... (utilisez @ pour mentionner)"
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-violet-500 focus:border-violet-500 resize-none"
                rows={2}
                disabled={!!replyTo}
              />

              {/* Mentions dropdown */}
              {showMentions && filteredMembers.length > 0 && (
                <div className="absolute z-20 bottom-full left-0 mb-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1 max-h-48 overflow-y-auto">
                  {filteredMembers.map((member, index) => (
                    <button
                      key={member.userId}
                      onClick={() => insertMention(member)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left ${
                        index === mentionIndex ? 'bg-violet-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      {member.user && (
                        <>
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium ${getAvatarColor(member.user.id)}`}
                          >
                            {getInitials(member.user.firstName, member.user.lastName)}
                          </div>
                          <div>
                            <p className="font-medium">{member.user.firstName} {member.user.lastName}</p>
                            <p className="text-xs text-gray-500">{member.user.email}</p>
                          </div>
                        </>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => handleSubmit()}
              disabled={loading || !newComment.trim() || !!replyTo}
              className="p-2 h-fit bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 self-end"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Tapez @ pour mentionner un membre
          </p>
        </div>
      </div>

      {/* Comments list */}
      <div className="space-y-6">
        {comments.map(comment => renderComment(comment))}
      </div>

      {comments.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">
          Aucun commentaire pour le moment
        </p>
      )}
    </div>
  );
}
