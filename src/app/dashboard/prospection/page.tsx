'use client';

import { useState } from 'react';
import { Search, Download, Phone, Mail, MapPin, Building2, Globe, Star, Loader2 } from 'lucide-react';
import { useProspects } from '@/hooks/useProspects';

export default function ProspectionPage() {
  const [activity, setActivity] = useState('');
  const [city, setCity] = useState('');
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [selectedProspects, setSelectedProspects] = useState<string[]>([]);

  // Utiliser le hook useProspects
  const { prospects, isLoading, isError, mutate } = useProspects(
    searchTriggered ? { activity: activity || undefined, city: city || undefined } : {}
  );

  const handleSearch = () => {
    setSearchTriggered(true);
    mutate();
  };

  const toggleSelectProspect = (id: string) => {
    if (selectedProspects.includes(id)) {
      setSelectedProspects(selectedProspects.filter((p) => p !== id));
    } else {
      setSelectedProspects([...selectedProspects, id]);
    }
  };

  const handleImport = async () => {
    // Marquer les prospects comme importés
    for (const prospectId of selectedProspects) {
      await fetch(`/api/prospects/${prospectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imported: true }),
      });
    }

    alert(`${selectedProspects.length} prospects importés dans le CRM !`);
    setSelectedProspects([]);
    mutate();
  };

  return (
    <div className="min-h-screen gradient-mesh py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-700 to-orange-500 bg-clip-text text-transparent">
            Prospection
          </h1>
          <p className="mt-2 text-gray-600">
            Recherchez de nouveaux prospects dans votre secteur
          </p>
        </div>

        {/* Search Form */}
        <div className="card-premium p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Activity Input */}
            <div>
              <label htmlFor="activity" className="block text-sm font-medium text-gray-700 mb-2">
                Type d&apos;activité
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building2 className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="activity"
                  type="text"
                  value={activity}
                  onChange={(e) => setActivity(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-600 focus:border-transparent outline-none"
                  placeholder="Restaurant, Boulangerie..."
                />
              </div>
            </div>

            {/* City Input */}
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                Ville
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-600 focus:border-transparent outline-none"
                  placeholder="Paris, Lyon, Marseille..."
                />
              </div>
            </div>

            {/* Search Button */}
            <div className="flex items-end">
              <button
                onClick={handleSearch}
                disabled={isLoading}
                className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-violet-700 to-orange-500 text-white py-3 px-4 rounded-lg font-semibold hover:from-violet-800 hover:to-orange-600 transition shadow-sm disabled:opacity-50"
              >
                <Search className="h-5 w-5" />
                <span>{isLoading ? 'Recherche...' : 'Rechercher'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-violet-600 mx-auto mb-4" />
            <p className="text-gray-600">Recherche en cours...</p>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <p className="text-red-600 mb-4">Erreur lors de la recherche</p>
            <button
              onClick={() => mutate()}
              className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Results */}
        {!isLoading && !isError && searchTriggered && prospects.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Results Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Résultats de recherche</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {prospects.length} prospects trouvés
                </p>
              </div>
              {selectedProspects.length > 0 && (
                <button
                  onClick={handleImport}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-violet-700 to-orange-500 text-white rounded-lg hover:from-violet-800 hover:to-orange-600 transition shadow-sm"
                >
                  <Download className="h-5 w-5" />
                  <span>Importer ({selectedProspects.length})</span>
                </button>
              )}
            </div>

            {/* Results Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedProspects.length === prospects.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProspects(prospects.map((p) => p.id));
                          } else {
                            setSelectedProspects([]);
                          }
                        }}
                        className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300 rounded"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entreprise
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Localisation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Infos
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {prospects.map((prospect) => (
                    <tr key={prospect.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedProspects.includes(prospect.id)}
                          onChange={() => toggleSelectProspect(prospect.id)}
                          className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-100 to-orange-100 flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-violet-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900">{prospect.name}</div>
                            <div className="text-sm text-gray-500">{prospect.activity}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-gray-900">
                            <Phone className="h-4 w-4 mr-2 text-gray-400" />
                            {prospect.phone}
                          </div>
                          <div className="flex items-center text-sm text-gray-900">
                            <Mail className="h-4 w-4 mr-2 text-gray-400" />
                            {prospect.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="text-sm text-gray-900">{prospect.address}</div>
                          <div className="flex items-center text-sm text-gray-500">
                            <MapPin className="h-4 w-4 mr-1" />
                            {prospect.city}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-gray-900">
                            <Globe className="h-4 w-4 mr-2 text-gray-400" />
                            <span className={!prospect.website || prospect.website === 'Non renseigné' ? 'text-red-600 font-semibold' : ''}>
                              {prospect.website || 'Non renseigné'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {prospect.rating && (
                              <div className="flex items-center">
                                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                <span className="text-sm font-semibold text-gray-900 ml-1">{prospect.rating}</span>
                              </div>
                            )}
                            {prospect.employees && (
                              <span className="text-xs text-gray-500">• {prospect.employees} employés</span>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && (!searchTriggered || prospects.length === 0) && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-violet-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-violet-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTriggered ? 'Aucun prospect trouvé' : 'Aucune recherche effectuée'}
            </h3>
            <p className="text-gray-600">
              {searchTriggered
                ? 'Essayez avec d\'autres critères de recherche'
                : 'Utilisez le formulaire ci-dessus pour rechercher des prospects'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
