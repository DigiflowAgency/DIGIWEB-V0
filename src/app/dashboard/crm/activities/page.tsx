'use client';

import { Calendar } from 'lucide-react';

export default function ActivitiesPage() {
  return (
    <div className="min-h-screen gradient-mesh flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8">
          <Calendar className="h-24 w-24 mx-auto text-gray-300 mb-4" />
          <h1 className="text-4xl font-bold text-gray-400 mb-2">Activités</h1>
          <p className="text-gray-500 text-lg">Cette fonctionnalité sera disponible prochainement</p>
        </div>
        <div className="bg-white/50 backdrop-blur-sm rounded-lg p-6 max-w-md mx-auto border border-gray-200">
          <p className="text-gray-600 text-sm">
            L'onglet Activités permettra de gérer vos appels, réunions, emails et visios avec vos contacts.
          </p>
        </div>
      </div>
    </div>
  );
}
