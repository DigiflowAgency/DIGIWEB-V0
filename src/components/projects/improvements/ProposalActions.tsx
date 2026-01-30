'use client';

import { useState } from 'react';
import type { ImprovementProposal } from '@/types/projects';
import { useImprovementMutations } from '@/hooks/projects';
import { useSession } from 'next-auth/react';
import {
  Send,
  Search,
  CheckCircle,
  XCircle,
  HelpCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface ProposalActionsProps {
  proposal: ImprovementProposal;
  canReview: boolean;
  onUpdate: () => void;
}

export default function ProposalActions({
  proposal,
  canReview,
  onUpdate,
}: ProposalActionsProps) {
  const { data: session } = useSession();
  const { submitImprovement, reviewImprovement, loading, error } =
    useImprovementMutations();

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'request_info' | null>(
    null
  );
  const [reviewNote, setReviewNote] = useState('');

  const isAuthor = proposal.authorId === session?.user?.id;

  const handleSubmit = async () => {
    try {
      await submitImprovement(proposal.id);
      onUpdate();
    } catch (err) {
      console.error('Submit error:', err);
    }
  };

  const handleStartReview = async () => {
    try {
      await reviewImprovement(proposal.id, 'start_review');
      onUpdate();
    } catch (err) {
      console.error('Start review error:', err);
    }
  };

  const handleReviewAction = async () => {
    if (!reviewAction) return;

    try {
      await reviewImprovement(proposal.id, reviewAction, reviewNote);
      setShowReviewModal(false);
      setReviewAction(null);
      setReviewNote('');
      onUpdate();
    } catch (err) {
      console.error('Review action error:', err);
    }
  };

  // Author actions
  if (isAuthor && ['DRAFT', 'INFO_REQUESTED'].includes(proposal.status)) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Send className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-blue-700 mb-3">
              {proposal.status === 'DRAFT'
                ? 'Votre proposition est en brouillon. Soumettez-la pour qu\'elle soit examinée par l\'équipe.'
                : 'Des informations supplémentaires ont été demandées. Modifiez votre proposition puis resoumettez-la.'}
            </p>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Soumettre la proposition
            </button>
          </div>
        </div>
        {error && (
          <div className="mt-3 flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
      </div>
    );
  }

  // Reviewer actions - Start review
  if (canReview && proposal.status === 'SUBMITTED') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Search className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-yellow-700 mb-3">
              Cette proposition attend d&apos;être examinée. Prenez-la en charge pour la
              valider ou la refuser.
            </p>
            <button
              onClick={handleStartReview}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Examiner cette proposition
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Reviewer actions - Review decision
  if (canReview && proposal.status === 'UNDER_REVIEW') {
    return (
      <>
        <div className="bg-violet-50 border border-violet-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Search className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-violet-700 mb-3">
                Vous examinez cette proposition. Choisissez une action :
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setReviewAction('approve');
                    setShowReviewModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approuver
                </button>
                <button
                  onClick={() => {
                    setReviewAction('reject');
                    setShowReviewModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <XCircle className="w-4 h-4" />
                  Refuser
                </button>
                <button
                  onClick={() => {
                    setReviewAction('request_info');
                    setShowReviewModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  <HelpCircle className="w-4 h-4" />
                  Demander plus d&apos;info
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Review Modal */}
        {showReviewModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {reviewAction === 'approve' && 'Approuver la proposition'}
                {reviewAction === 'reject' && 'Refuser la proposition'}
                {reviewAction === 'request_info' && 'Demander des informations'}
              </h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note / Commentaire {reviewAction !== 'approve' && '*'}
                </label>
                <textarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  rows={4}
                  placeholder={
                    reviewAction === 'approve'
                      ? 'Ajoutez un commentaire optionnel...'
                      : reviewAction === 'reject'
                      ? 'Expliquez pourquoi cette proposition est refusée...'
                      : 'Précisez les informations manquantes...'
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-violet-500 focus:border-violet-500"
                />
              </div>

              {reviewAction === 'approve' && (
                <div className="mb-4 p-3 bg-green-50 rounded-lg text-sm text-green-700">
                  En approuvant cette proposition, un Epic sera automatiquement créé avec
                  les informations de la proposition.
                </div>
              )}

              {error && (
                <div className="mb-4 flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowReviewModal(false);
                    setReviewAction(null);
                    setReviewNote('');
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  onClick={handleReviewAction}
                  disabled={
                    loading ||
                    (reviewAction !== 'approve' && !reviewNote.trim())
                  }
                  className={`flex items-center gap-2 px-4 py-2 text-sm text-white rounded-lg disabled:opacity-50 ${
                    reviewAction === 'approve'
                      ? 'bg-green-600 hover:bg-green-700'
                      : reviewAction === 'reject'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-orange-600 hover:bg-orange-700'
                  }`}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      {reviewAction === 'approve' && <CheckCircle className="w-4 h-4" />}
                      {reviewAction === 'reject' && <XCircle className="w-4 h-4" />}
                      {reviewAction === 'request_info' && (
                        <HelpCircle className="w-4 h-4" />
                      )}
                    </>
                  )}
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
}
