'use client';

import dynamic from 'next/dynamic';
import { X, Calculator } from 'lucide-react';

// Importer le calculateur de manière dynamique pour éviter les problèmes SSR
const LandingPage = dynamic(() => import('@/components/calculateur'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <Calculator className="h-12 w-12 animate-spin text-orange-600 mx-auto mb-4" />
        <p className="text-gray-600">Chargement du calculateur...</p>
      </div>
    </div>
  ),
});

interface QuoteCalculatorData {
  selectedServices: Set<string>;
  commitment: 'comptant' | 24 | 36 | 48;
  isPartner: boolean;
  totals: {
    oneTimeTotal: number;
    monthlyTotal: number;
    engagementDiscount: number;
    partnerDiscount: number;
    grandTotal: number;
  };
  services: Array<{
    id: string;
    name: string;
    price: number;
    period: string;
    channel: string;
    discount: number;
  }>;
}

interface QuoteCalculatorWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: QuoteCalculatorData) => void;
  initialData?: Partial<QuoteCalculatorData>;
}

export default function QuoteCalculatorWrapper({
  isOpen,
  onClose,
  onConfirm: _onConfirm,
  initialData: _initialData,
}: QuoteCalculatorWrapperProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative min-h-screen flex items-start justify-center p-4">
        <div className="relative w-full max-w-7xl bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl my-8">
          {/* Header avec bouton fermer */}
          <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <Calculator className="h-6 w-6 text-orange-500" />
              <h2 className="text-xl font-bold text-white">
                Calculateur d'offre
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="h-6 w-6 text-gray-400" />
            </button>
          </div>

          {/* Contenu du calculateur */}
          <div className="p-6">
            <LandingPage />
          </div>

          {/* Footer avec boutons d'action */}
          <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 p-4 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700 rounded-b-2xl">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              Annuler
            </button>
            <button
              onClick={() => {
                // TODO: Extraire les données du calculateur et les passer à onConfirm
                // Pour l'instant, on ferme juste
                onClose();
              }}
              className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold"
            >
              Valider et utiliser ce devis
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
