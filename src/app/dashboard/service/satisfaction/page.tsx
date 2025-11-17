'use client';

import { Smile, Star, TrendingUp, Users, ThumbsUp } from 'lucide-react';

const mockReviews = [
  { id: 1, client: 'Restaurant Le Gourmet', rating: 5, comment: 'Excellent service, très réactif!', date: '2024-11-17', agent: 'Sophie M.' },
  { id: 2, client: 'Boutique Mode', rating: 4, comment: 'Bon support, quelques délais', date: '2024-11-16', agent: 'Pierre D.' },
  { id: 3, client: 'Cabinet Avocat', rating: 5, comment: 'Parfait, rien à redire', date: '2024-11-15', agent: 'Marie L.' },
  { id: 4, client: 'Salon Tendance', rating: 5, comment: 'Très satisfait du service', date: '2024-11-14', agent: 'Jean D.' },
  { id: 5, client: 'Garage Auto Pro', rating: 4, comment: 'Bien dans l\'ensemble', date: '2024-11-13', agent: 'Sophie M.' },
  { id: 6, client: 'Boulangerie Tradition', rating: 5, comment: 'Service impeccable!', date: '2024-11-12', agent: 'Pierre D.' },
  { id: 7, client: 'Pharmacie Santé', rating: 3, comment: 'Correct mais peut mieux faire', date: '2024-11-11', agent: 'Marie L.' },
  { id: 8, client: 'Bistrot Gourmand', rating: 5, comment: 'Équipe au top!', date: '2024-11-10', agent: 'Jean D.' },
];

const stats = [
  { label: 'Score Moyen', value: '4.6/5', color: 'text-orange-600', icon: Star },
  { label: 'Total Avis', value: mockReviews.length, color: 'text-blue-600', icon: Users },
  { label: 'Taux Satisfaction', value: '92%', color: 'text-green-600', icon: ThumbsUp },
  { label: 'Recommandation', value: '94%', color: 'text-purple-600', icon: TrendingUp },
];

const ratingDistribution = [
  { stars: 5, count: 5, percentage: 62 },
  { stars: 4, count: 2, percentage: 25 },
  { stars: 3, count: 1, percentage: 13 },
  { stars: 2, count: 0, percentage: 0 },
  { stars: 1, count: 0, percentage: 0 },
];

export default function SatisfactionPage() {
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
          {stats.map((stat, index) => {
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
            <h2 className="text-lg font-bold text-gray-900 mb-4">Performance par Agent</h2>
            <div className="space-y-3">
              {['Sophie M.', 'Pierre D.', 'Marie L.', 'Jean D.'].map((agent, index) => (
                <div key={agent} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-semibold text-gray-900">{agent}</span>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      ))}
                    </div>
                    <span className="text-sm font-bold text-orange-600">4.{8 - index}/5</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Avis Récents</h2>
          <div className="space-y-4">
            {mockReviews.map((review) => (
              <div key={review.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-900">{review.client}</p>
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
                  <span className="text-sm text-gray-500">{new Date(review.date).toLocaleDateString('fr-FR')}</span>
                </div>
                <p className="text-gray-700 mb-2">{review.comment}</p>
                <p className="text-sm text-gray-500">Agent: {review.agent}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
