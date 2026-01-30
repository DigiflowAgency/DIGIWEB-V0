'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useImprovementMutations } from '@/hooks/projects';
import type { ImprovementComment } from '@/types/projects';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Send, Lock, Loader2 } from 'lucide-react';
import { getInitials, getAvatarColor } from '@/lib/projects/utils';

interface ProposalCommentsProps {
  proposalId: string;
  comments: ImprovementComment[];
  canPostInternal: boolean;
  onUpdate: () => void;
}

export default function ProposalComments({
  proposalId,
  comments,
  canPostInternal,
  onUpdate,
}: ProposalCommentsProps) {
  const { data: session } = useSession();
  const { addComment, loading, error } = useImprovementMutations();

  const [content, setContent] = useState('');
  const [isInternal, setIsInternal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      await addComment(proposalId, content, isInternal);
      setContent('');
      setIsInternal(false);
      onUpdate();
    } catch (err) {
      console.error('Add comment error:', err);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Commentaires ({comments.length})
      </h3>

      {/* Comment form */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-3">
          {session?.user && (
            <div className="w-8 h-8 rounded-full flex-shrink-0 bg-violet-100 flex items-center justify-center text-violet-600 text-xs font-medium">
              {session.user.name?.charAt(0) || 'U'}
            </div>
          )}
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              placeholder="Ajouter un commentaire..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-violet-500 focus:border-violet-500"
            />
            <div className="flex items-center justify-between mt-2">
              {canPostInternal && (
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                    className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                  />
                  <Lock className="w-4 h-4" />
                  Commentaire interne (équipe uniquement)
                </label>
              )}
              <button
                type="submit"
                disabled={loading || !content.trim()}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 ml-auto"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Envoyer
              </button>
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>
        </div>
      </form>

      {/* Comments list */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className={`flex gap-3 p-3 rounded-lg ${
              comment.isInternal ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'
            }`}
          >
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
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(comment.createdAt), {
                    addSuffix: true,
                    locale: fr,
                  })}
                </span>
                {comment.isInternal && (
                  <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
                    <Lock className="w-3 h-3" />
                    Interne
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
            </div>
          </div>
        ))}

        {comments.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            Aucun commentaire pour le moment
          </p>
        )}
      </div>
    </div>
  );
}
