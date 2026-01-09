import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export interface DealServiceAssignment {
  id: string;
  dealId?: string;
  serviceId: string;
  stageId: string | null;
  createdAt: string;
  service: {
    id: string;
    name: string;
    color: string;
    stages: Array<{
      id: string;
      name: string;
      color: string;
      position: number;
    }>;
  };
  stage: {
    id: string;
    name: string;
    color: string;
    position: number;
  } | null;
}

interface UseDealServicesResponse {
  assignments: DealServiceAssignment[];
}

export function useDealServices(dealId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<UseDealServicesResponse>(
    dealId ? `/api/deals/${dealId}/services` : null,
    fetcher
  );

  // Ajouter un service au deal
  const addService = async (serviceId: string, stageId?: string | null) => {
    if (!dealId) return;

    const response = await fetch(`/api/deals/${dealId}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serviceId, stageId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de l\'ajout du service');
    }

    mutate();
    return response.json();
  };

  // Mettre à jour le stage d'un service
  const updateServiceStage = async (serviceId: string, stageId: string | null) => {
    if (!dealId) return;

    const response = await fetch(`/api/deals/${dealId}/services`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serviceId, stageId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la mise à jour du stage');
    }

    mutate();
    return response.json();
  };

  // Retirer un service du deal
  const removeService = async (serviceId: string) => {
    if (!dealId) return;

    const response = await fetch(
      `/api/deals/${dealId}/services?serviceId=${serviceId}`,
      { method: 'DELETE' }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la suppression du service');
    }

    mutate();
  };

  return {
    assignments: data?.assignments || [],
    isLoading,
    isError: error,
    mutate,
    addService,
    updateServiceStage,
    removeService,
  };
}
