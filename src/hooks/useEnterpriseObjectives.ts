import useSWR from 'swr';
import { useState } from 'react';

// Types
export interface EnterpriseObjective {
  id: string;
  metricType: 'CA_MENSUEL' | 'CA_GENERE' | 'NOUVEAUX_DEALS' | 'RDV_REALISES' | 'APPELS_EFFECTUES' | 'DEVIS_ENVOYES' | 'TAUX_CONVERSION' | 'CUSTOM';
  period: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  year: number;
  month: number | null;
  quarter: number | null;
  targetValue: number;
  currentValue: number;
  percentage: number;
  remaining: number;
  projection: number | null;
  title: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  calculatedAt: string | null;
}

export interface ObjectivesSummary {
  totalObjectives: number;
  completedObjectives: number;
  averageCompletion: number;
}

export interface ObjectivesResponse {
  objectives: EnterpriseObjective[];
  summary: ObjectivesSummary;
}

export interface CreateObjectiveData {
  metricType: EnterpriseObjective['metricType'];
  period?: EnterpriseObjective['period'];
  year: number;
  month?: number | null;
  quarter?: number | null;
  targetValue: number;
  title: string;
  description?: string | null;
}

export interface InitObjectivesData {
  year: number;
  month: number;
  copyFromPrevious?: boolean;
  defaults?: {
    CA_MENSUEL?: number;
    NOUVEAUX_DEALS?: number;
    RDV_REALISES?: number;
    APPELS_EFFECTUES?: number;
    DEVIS_ENVOYES?: number;
  };
}

// Fetcher function
const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Labels pour les types de metriques
export const METRIC_TYPE_LABELS: Record<EnterpriseObjective['metricType'], string> = {
  CA_MENSUEL: 'CA Mensuel',
  CA_GENERE: 'CA Genere',
  NOUVEAUX_DEALS: 'Nouveaux Deals',
  RDV_REALISES: 'RDV Realises',
  APPELS_EFFECTUES: 'Appels Effectues',
  DEVIS_ENVOYES: 'Devis Envoyes',
  TAUX_CONVERSION: 'Taux de Conversion',
  CUSTOM: 'Personnalise',
};

// Icones pour les types de metriques (noms Lucide)
export const METRIC_TYPE_ICONS: Record<EnterpriseObjective['metricType'], string> = {
  CA_MENSUEL: 'Euro',
  CA_GENERE: 'TrendingUp',
  NOUVEAUX_DEALS: 'Users',
  RDV_REALISES: 'Calendar',
  APPELS_EFFECTUES: 'Phone',
  DEVIS_ENVOYES: 'FileText',
  TAUX_CONVERSION: 'Target',
  CUSTOM: 'Settings',
};

// Couleurs pour les types de metriques
export const METRIC_TYPE_COLORS: Record<EnterpriseObjective['metricType'], string> = {
  CA_MENSUEL: 'green',
  CA_GENERE: 'emerald',
  NOUVEAUX_DEALS: 'violet',
  RDV_REALISES: 'orange',
  APPELS_EFFECTUES: 'blue',
  DEVIS_ENVOYES: 'pink',
  TAUX_CONVERSION: 'cyan',
  CUSTOM: 'gray',
};

// Noms des mois
export const MONTH_NAMES = [
  'Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'
];

// Hook principal
export function useEnterpriseObjectives(params?: {
  year?: number;
  month?: number;
  period?: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
}) {
  // Construire l'URL avec les parametres
  const queryParams = new URLSearchParams();
  if (params?.year) queryParams.append('year', params.year.toString());
  if (params?.month) queryParams.append('month', params.month.toString());
  if (params?.period) queryParams.append('period', params.period);

  const url = `/api/enterprise-objectives${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR<ObjectivesResponse>(url, fetcher, {
    refreshInterval: 60000, // Refresh toutes les minutes
  });

  return {
    objectives: data?.objectives || [],
    summary: data?.summary || { totalObjectives: 0, completedObjectives: 0, averageCompletion: 0 },
    isLoading,
    isError: error,
    mutate,
  };
}

// Hook pour un objectif specifique
export function useEnterpriseObjective(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<EnterpriseObjective>(
    id ? `/api/enterprise-objectives/${id}` : null,
    fetcher
  );

  return {
    objective: data,
    isLoading,
    isError: error,
    mutate,
  };
}

// Hook pour les mutations
export function useEnterpriseObjectiveMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createObjective = async (data: CreateObjectiveData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/enterprise-objectives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la creation');
      }

      const objective = await response.json();
      return objective;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateObjective = async (id: string, data: Partial<CreateObjectiveData>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/enterprise-objectives/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la mise a jour');
      }

      const objective = await response.json();
      return objective;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteObjective = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/enterprise-objectives/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la suppression');
      }

      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const initializeMonth = async (data: InitObjectivesData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/enterprise-objectives/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'initialisation');
      }

      const result = await response.json();
      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createObjective,
    updateObjective,
    deleteObjective,
    initializeMonth,
    loading,
    error,
  };
}
