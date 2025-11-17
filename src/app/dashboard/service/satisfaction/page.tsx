'use client';

import { Smile, Star, TrendingUp, Users, ThumbsUp, Loader2 } from 'lucide-react';
import { useReviews } from '@/hooks/useReviews';

export default function SatisfactionPage() {
  // Utiliser le hook useReviews pour récupérer les données depuis l'API
  const { reviews, stats, isLoading, isError } = useReviews();

  // État de chargement
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange-600 mx-auto" />
          <p className="mt-4 text-gray-600">Chargement des avis...</p>
        </div>
      </div>
    );
  }

  // État d'erreur
  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Erreur lors du chargement des avis</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 btn-primary"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const statsDisplay = [
    { label: 'Score Moyen', value: `${stats.avgRating}/5`, color: 'text-orange-600', icon: Star },
    { label: 'Total Avis', value: stats.total, color: 'text-blue-600', icon: Users },
    { label: 'Taux Satisfaction', value: `${stats.satisfactionRate}%`, color: 'text-green-600', icon: ThumbsUp },
    { label: 'Avec Réponse', value: stats.withResponse, color: 'text-purple-600', icon: TrendingUp },
  ];

  const ratingDistribution = [
    { stars: 5, count: stats.rating5, percentage: stats.total > 0 ? (stats.rating5 / stats.total) * 100 : 0 },
    { stars: 4, count: stats.rating4, percentage: stats.total > 0 ? (stats.rating4 / stats.total) * 100 : 0 },
    { stars: 3, count: stats.rating3, percentage: stats.total > 0 ? (stats.rating3 / stats.total) * 100 : 0 },
    { stars: 2, count: stats.rating2, percentage: stats.total > 0 ? (stats.rating2 / stats.total) * 100 : 0 },
    { stars: 1, count: stats.rating1, percentage: stats.total > 0 ? (stats.rating1 / stats.total) * 100 : 0 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Smile className="h-8 w-8 text-orange-600" />
            Satisfaction Client
          </h1>
          <p className="text-gray-600 mt-1">Suivez la satisfaction de vos clients</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {statsDisplay.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </div>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Distribution des Notes</h2>
            <div className="space-y-3">
              {ratingDistribution.map((rating) => (
                <div key={rating.stars} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-20">
                    {[...Array(rating.stars)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                  <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full"
                      style={{ width: `${rating.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-12 text-right">{rating.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Avis par Source</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-semibold text-gray-900">Google</span>
                <span className="text-sm font-bold text-orange-600">{stats.bySource.google} avis</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-semibold text-gray-900">Pages Jaunes</span>
                <span className="text-sm font-bold text-orange-600">{stats.bySource.pagesJaunes} avis</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-semibold text-gray-900">TripAdvisor</span>
                <span className="text-sm font-bold text-orange-600">{stats.bySource.tripadvisor} avis</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-semibold text-gray-900">Trustpilot</span>
                <span className="text-sm font-bold text-orange-600">{stats.bySource.trustpilot} avis</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Avis Récents</h2>
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-900">{review.author}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < review.rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">{new Date(review.reviewDate).toLocaleDateString('fr-FR')}</span>
                </div>
                {review.content && <p className="text-gray-700 mb-2">{review.content}</p>}
                <p className="text-sm text-gray-500">Source: {review.source}</p>
                {review.response && (
                  <div className="mt-3 pl-4 border-l-2 border-orange-500">
                    <p className="text-sm font-semibold text-gray-900 mb-1">Réponse:</p>
                    <p className="text-sm text-gray-700">{review.response}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
