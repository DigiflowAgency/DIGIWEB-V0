'use client';

import { useState } from 'react';
import type {
  AIGenerationResponse,
  AIEstimateRequest,
  AIEstimateResponse,
  AIImportResponse,
  AIGenerationMode,
  ProjectType,
} from '@/types/projects';

interface GenerateOptions {
  description: string;
  projectType?: ProjectType;
  estimatePoints?: boolean;
  mode?: AIGenerationMode;
}

type GenerateResult = (AIGenerationResponse & { mode: 'new' }) | (AIImportResponse & { mode: 'import' });

export function useAIGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async (options: GenerateOptions): Promise<GenerateResult> => {
    setIsGenerating(true);
    setError(null);
    try {
      // Use a placeholder project ID for new project generation
      const res = await fetch(`/api/projects/new/ai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: options.description,
          projectType: options.projectType,
          includeEstimates: options.estimatePoints ?? true,
          mode: options.mode ?? 'new',
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Erreur lors de la génération');
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(message);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  const generateProjectStructure = async (
    projectId: string,
    data: { prompt: string; projectType?: ProjectType; includeEstimates?: boolean; mode?: AIGenerationMode }
  ): Promise<GenerateResult> => {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/ai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Erreur lors de la génération');
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(message);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  const estimateTask = async (
    projectId: string,
    data: AIEstimateRequest
  ): Promise<AIEstimateResponse> => {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/ai/estimate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Erreur lors de l\'estimation');
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(message);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generate,
    generateProjectStructure,
    estimateTask,
    isGenerating,
    loading: isGenerating, // Backward compatibility
    error,
  };
}
