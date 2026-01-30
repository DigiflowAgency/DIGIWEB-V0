'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useReleaseMutations, useRepositoryCommits } from '@/hooks/projects';
import type { ProjectRelease, CreateReleaseData } from '@/types/projects';
import { Save, Eye, Send, Loader2, GitCommit, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ReleaseFormProps {
  projectId: string;
  release?: ProjectRelease;
  onSave?: () => void;
}

const RELEASE_TEMPLATE = `## Nouveautés
-

## Corrections
-

## Améliorations
-

## Notes
`;

export default function ReleaseForm({ projectId, release, onSave }: ReleaseFormProps) {
  const router = useRouter();
  const { createRelease, updateRelease, publishRelease, loading, error } = useReleaseMutations();
  const { commits } = useRepositoryCommits(projectId, undefined, 10);

  const [version, setVersion] = useState(release?.version || '');
  const [title, setTitle] = useState(release?.title || '');
  const [content, setContent] = useState(release?.content || RELEASE_TEMPLATE);
  const [commitSha, setCommitSha] = useState(release?.commitSha || '');
  const [showPreview, setShowPreview] = useState(false);
  const [showCommitPicker, setShowCommitPicker] = useState(false);

  useEffect(() => {
    if (release) {
      setVersion(release.version);
      setTitle(release.title);
      setContent(release.content);
      setCommitSha(release.commitSha || '');
    }
  }, [release]);

  const handleSave = async (publish = false) => {
    const data: CreateReleaseData = { version, title, content, commitSha };

    try {
      if (release) {
        await updateRelease(release.id, data);
        if (publish && release.status === 'DRAFT') {
          await publishRelease(release.id);
        }
      } else {
        const newRelease = await createRelease(projectId, data);
        if (publish) {
          await publishRelease(newRelease.id);
        }
        router.push(`/dashboard/projects/${projectId}/releases/${newRelease.id}`);
        return;
      }
      onSave?.();
    } catch (err) {
      console.error('Save error:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Version and Title */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Version *
          </label>
          <input
            type="text"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            placeholder="v1.0.0"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-violet-500 focus:border-violet-500"
            required
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Titre *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nouvelle interface utilisateur"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-violet-500 focus:border-violet-500"
            required
          />
        </div>
      </div>

      {/* Commit selector */}
      {commits.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Commit associé (optionnel)
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowCommitPicker(!showCommitPicker)}
              className="w-full flex items-center justify-between border border-gray-300 rounded-lg px-3 py-2 text-left hover:border-gray-400"
            >
              {commitSha ? (
                <span className="flex items-center gap-2">
                  <GitCommit className="w-4 h-4 text-gray-500" />
                  <code className="text-sm">{commitSha.slice(0, 7)}</code>
                  <span className="text-sm text-gray-500 truncate">
                    {commits.find((c) => c.sha === commitSha)?.commit.message.split('\n')[0]}
                  </span>
                </span>
              ) : (
                <span className="text-gray-500">Sélectionner un commit</span>
              )}
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            {showCommitPicker && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => {
                    setCommitSha('');
                    setShowCommitPicker(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-50 border-b border-gray-100"
                >
                  Aucun commit
                </button>
                {commits.map((commit) => (
                  <button
                    key={commit.sha}
                    type="button"
                    onClick={() => {
                      setCommitSha(commit.sha);
                      setShowCommitPicker(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
                  >
                    <code className="text-xs text-violet-600 font-mono">
                      {commit.sha.slice(0, 7)}
                    </code>
                    <span className="truncate flex-1">
                      {commit.commit.message.split('\n')[0]}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content Editor / Preview */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700">
            Contenu (Markdown) *
          </label>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-1.5 text-sm text-violet-600 hover:text-violet-700"
          >
            <Eye className="w-4 h-4" />
            {showPreview ? 'Éditer' : 'Prévisualiser'}
          </button>
        </div>

        {showPreview ? (
          <div className="border border-gray-200 rounded-lg p-4 min-h-[300px] prose prose-sm max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={15}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm focus:ring-violet-500 focus:border-violet-500"
            placeholder={RELEASE_TEMPLATE}
            required
          />
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          Annuler
        </button>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={loading || !version || !title || !content}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Enregistrer brouillon
          </button>
          {(!release || release.status === 'DRAFT') && (
            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={loading || !version || !title || !content}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Publier
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
