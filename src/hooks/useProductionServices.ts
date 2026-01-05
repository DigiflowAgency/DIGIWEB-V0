'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export interface ProductionServiceStage {
  id: string;
  serviceId: string;
  name: string;
  description?: string | null;
  color: string;
  position: number;
  createdAt: string;
}

export interface ProductionService {
  id: string;
  name: string;
  description?: string | null;
  color: string;
  position: number;
  createdAt: string;
  updatedAt: string;
  stages: ProductionServiceStage[];
  _count?: {
    deals: number;
  };
}

interface CreateServiceData {
  name: string;
  description?: string;
  color?: string;
  stages?: { name: string; color?: string }[];
}

interface CreateStageData {
  name: string;
  description?: string;
  color?: string;
}

export function useProductionServices() {
  const { data, error, isLoading, mutate } = useSWR<{ services: ProductionService[] }>(
    '/api/production-services',
    fetcher
  );

  // Créer un service
  const createService = async (serviceData: CreateServiceData): Promise<ProductionService> => {
    const response = await fetch('/api/production-services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(serviceData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erreur lors de la création');
    }

    const newService = await response.json();
    mutate();
    return newService;
  };

  // Modifier un service
  const updateService = async (
    id: string,
    updates: Partial<Pick<ProductionService, 'name' | 'description' | 'color' | 'position'>>
  ): Promise<ProductionService> => {
    const response = await fetch(`/api/production-services/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erreur lors de la mise à jour');
    }

    const updatedService = await response.json();
    mutate();
    return updatedService;
  };

  // Supprimer un service
  const deleteService = async (id: string): Promise<void> => {
    const response = await fetch(`/api/production-services/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erreur lors de la suppression');
    }

    mutate();
  };

  // Ajouter un stage à un service
  const createStage = async (serviceId: string, stageData: CreateStageData): Promise<ProductionServiceStage> => {
    const response = await fetch(`/api/production-services/${serviceId}/stages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stageData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erreur lors de la création');
    }

    const newStage = await response.json();
    mutate();
    return newStage;
  };

  // Modifier un stage
  const updateStage = async (
    serviceId: string,
    stageId: string,
    updates: Partial<Pick<ProductionServiceStage, 'name' | 'description' | 'color' | 'position'>>
  ): Promise<ProductionServiceStage> => {
    const response = await fetch(`/api/production-services/${serviceId}/stages/${stageId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erreur lors de la mise à jour');
    }

    const updatedStage = await response.json();
    mutate();
    return updatedStage;
  };

  // Supprimer un stage
  const deleteStage = async (serviceId: string, stageId: string): Promise<void> => {
    const response = await fetch(`/api/production-services/${serviceId}/stages/${stageId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erreur lors de la suppression');
    }

    mutate();
  };

  // Réordonner les stages
  const reorderStages = async (serviceId: string, stageIds: string[]): Promise<void> => {
    const response = await fetch(`/api/production-services/${serviceId}/stages`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stageIds }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erreur lors du réordonnement');
    }

    mutate();
  };

  return {
    services: data?.services || [],
    isLoading,
    isError: error,
    mutate,
    createService,
    updateService,
    deleteService,
    createStage,
    updateStage,
    deleteStage,
    reorderStages,
  };
}
