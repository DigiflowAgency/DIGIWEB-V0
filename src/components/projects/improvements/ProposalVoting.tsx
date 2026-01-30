'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useImprovementMutations } from '@/hooks/projects';
import type { ImprovementVote } from '@/types/projects';
import { ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';

interface ProposalVotingProps {
  proposalId: string;
  votes: ImprovementVote[];
  voteScore: number;
  onUpdate: () => void;
}

export default function ProposalVoting({
  proposalId,
  votes,
  voteScore,
  onUpdate,
}: ProposalVotingProps) {
  const { data: session } = useSession();
  const { vote, removeVote, loading } = useImprovementMutations();
  const [localScore, setLocalScore] = useState(voteScore);

  const userVote = votes.find((v) => v.userId === session?.user?.id);
  const userVoteValue = userVote?.value || 0;

  const handleVote = async (value: 1 | -1) => {
    try {
      if (userVoteValue === value) {
        // Remove vote if clicking same button
        const result = await removeVote(proposalId);
        setLocalScore(result.voteScore);
      } else {
        // Add or change vote
        const result = await vote(proposalId, value);
        setLocalScore(result.voteScore);
      }
      onUpdate();
    } catch (err) {
      console.error('Vote error:', err);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-medium text-gray-700 mb-3">
        Votes de la communauté
      </h3>

      <div className="flex items-center justify-center gap-6">
        <button
          onClick={() => handleVote(1)}
          disabled={loading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            userVoteValue === 1
              ? 'bg-green-100 text-green-700 border-2 border-green-500'
              : 'bg-gray-50 text-gray-600 hover:bg-green-50 hover:text-green-600 border border-gray-200'
          }`}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <ThumbsUp className="w-5 h-5" />
          )}
          <span className="font-medium">Pour</span>
        </button>

        <div className="text-center">
          <div
            className={`text-3xl font-bold ${
              localScore > 0
                ? 'text-green-600'
                : localScore < 0
                ? 'text-red-600'
                : 'text-gray-400'
            }`}
          >
            {localScore > 0 ? '+' : ''}
            {localScore}
          </div>
          <div className="text-xs text-gray-500">{votes.length} vote(s)</div>
        </div>

        <button
          onClick={() => handleVote(-1)}
          disabled={loading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            userVoteValue === -1
              ? 'bg-red-100 text-red-700 border-2 border-red-500'
              : 'bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-600 border border-gray-200'
          }`}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <ThumbsDown className="w-5 h-5" />
          )}
          <span className="font-medium">Contre</span>
        </button>
      </div>

      {votes.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <ThumbsUp className="w-4 h-4 text-green-500" />
              {votes.filter((v) => v.value === 1).length} pour
            </span>
            <span className="flex items-center gap-1">
              <ThumbsDown className="w-4 h-4 text-red-500" />
              {votes.filter((v) => v.value === -1).length} contre
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
