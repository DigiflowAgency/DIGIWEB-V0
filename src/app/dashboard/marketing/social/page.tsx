'use client';

import { useState } from 'react';
import { Share2, Plus, Search, Facebook, Twitter, Instagram, Linkedin, Calendar, TrendingUp, Heart, MessageCircle } from 'lucide-react';

const mockPosts = [
  { id: 1, platform: 'Facebook', content: 'Découvrez nos nouvelles solutions SEO...', date: '2024-11-18', likes: 145, comments: 23, shares: 12, status: 'Publié' },
  { id: 2, platform: 'LinkedIn', content: 'Guide complet du marketing digital...', date: '2024-11-17', likes: 89, comments: 15, shares: 8, status: 'Publié' },
  { id: 3, platform: 'Instagram', content: 'Transformation digitale réussie 🚀', date: '2024-11-16', likes: 234, comments: 31, shares: 0, status: 'Publié' },
  { id: 4, platform: 'Twitter', content: 'Tendances marketing 2024 #marketing', date: '2024-11-15', likes: 67, comments: 12, shares: 28, status: 'Publié' },
  { id: 5, platform: 'Facebook', content: 'Webinaire gratuit la semaine prochaine', date: '2024-11-20', likes: 0, comments: 0, shares: 0, status: 'Planifié' },
  { id: 6, platform: 'LinkedIn', content: 'Étude de cas client - Restaurant...', date: '2024-11-14', likes: 112, comments: 19, shares: 15, status: 'Publié' },
  { id: 7, platform: 'Instagram', content: 'Behind the scenes de notre agence', date: '2024-11-13', likes: 187, comments: 28, shares: 0, status: 'Publié' },
  { id: 8, platform: 'Twitter', content: 'Tips SEO du jour 💡', date: '2024-11-12', likes: 54, comments: 8, shares: 22, status: 'Publié' },
  { id: 9, platform: 'Facebook', content: 'Témoignage client satisfait ⭐', date: '2024-11-11', likes: 98, comments: 14, shares: 6, status: 'Publié' },
  { id: 10, platform: 'LinkedIn', content: 'Offre d\'emploi: Marketing Manager', date: '2024-11-19', likes: 0, comments: 0, shares: 0, status: 'Brouillon' },
];

const getPlatformIcon = (platform: string) => {
  switch (platform) {
    case 'Facebook': return Facebook;
    case 'Twitter': return Twitter;
    case 'Instagram': return Instagram;
    case 'LinkedIn': return Linkedin;
    default: return Share2;
  }
};

const getPlatformColor = (platform: string) => {
  switch (platform) {
    case 'Facebook': return 'bg-blue-100 text-blue-600';
    case 'Twitter': return 'bg-sky-100 text-sky-600';
    case 'Instagram': return 'bg-pink-100 text-pink-600';
    case 'LinkedIn': return 'bg-indigo-100 text-indigo-600';
    default: return 'bg-gray-100 text-gray-600';
  }
};

export default function SocialPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const totalLikes = mockPosts.reduce((sum, p) => sum + p.likes, 0);
  const totalComments = mockPosts.reduce((sum, p) => sum + p.comments, 0);
  const totalShares = mockPosts.reduce((sum, p) => sum + p.shares, 0);

  const stats = [
    { label: 'Total Posts', value: mockPosts.filter(p => p.status === 'Publié').length, color: 'text-orange-600', icon: Share2 },
    { label: 'Total Likes', value: totalLikes.toLocaleString(), color: 'text-pink-600', icon: Heart },
    { label: 'Commentaires', value: totalComments, color: 'text-blue-600', icon: MessageCircle },
    { label: 'Engagement', value: `${((totalLikes + totalComments + totalShares) / mockPosts.filter(p => p.status === 'Publié').length).toFixed(0)}`, color: 'text-green-600', icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Share2 className="h-8 w-8 text-orange-600" />
                Réseaux Sociaux
              </h1>
              <p className="text-gray-600 mt-1">Gérez votre présence sur les réseaux sociaux</p>
            </div>
            <button className="flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-semibold shadow-sm">
              <Plus className="h-5 w-5" />
              Nouveau Post
            </button>
          </div>
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

        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockPosts.filter(p => p.content.toLowerCase().includes(searchQuery.toLowerCase())).map((post) => {
            const PlatformIcon = getPlatformIcon(post.platform);
            const platformColor = getPlatformColor(post.platform);

            return (
              <div key={post.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${platformColor}`}>
                    <PlatformIcon className="h-4 w-4" />
                    <span className="text-sm font-semibold">{post.platform}</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    post.status === 'Publié' ? 'bg-green-100 text-green-700' :
                    post.status === 'Planifié' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>{post.status}</span>
                </div>

                <p className="text-gray-900 mb-4 line-clamp-3">{post.content}</p>

                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                  <Calendar className="h-4 w-4" />
                  {new Date(post.date).toLocaleDateString('fr-FR')}
                </div>

                {post.status === 'Publié' && (
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 text-sm">
                    <div className="flex items-center gap-1">
                      <Heart className="h-4 w-4 text-pink-600" />
                      <span className="font-semibold">{post.likes}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-4 w-4 text-blue-600" />
                      <span className="font-semibold">{post.comments}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Share2 className="h-4 w-4 text-green-600" />
                      <span className="font-semibold">{post.shares}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
