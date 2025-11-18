'use client';

import { useState } from 'react';
import {
  Share2,
  Plus,
  Search,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Calendar,
  TrendingUp,
  Heart,
  MessageCircle,
  Loader2
} from 'lucide-react';
import { useSocialPosts, useSocialPostMutations } from '@/hooks/useSocialPosts';
import Modal from '@/components/Modal';

const getPlatformLabel = (platform: string) => {
  switch (platform) {
    case 'FACEBOOK': return 'Facebook';
    case 'TWITTER': return 'Twitter';
    case 'INSTAGRAM': return 'Instagram';
    case 'LINKEDIN': return 'LinkedIn';
    default: return platform;
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'PUBLIE': return 'Publié';
    case 'PLANIFIE': return 'Planifié';
    case 'BROUILLON': return 'Brouillon';
    default: return status;
  }
};

const getPlatformIcon = (platform: string) => {
  switch (platform) {
    case 'FACEBOOK': return Facebook;
    case 'TWITTER': return Twitter;
    case 'INSTAGRAM': return Instagram;
    case 'LINKEDIN': return Linkedin;
    default: return Share2;
  }
};

const getPlatformColor = (platform: string) => {
  switch (platform) {
    case 'FACEBOOK': return 'bg-blue-100 text-blue-600';
    case 'TWITTER': return 'bg-sky-100 text-sky-600';
    case 'INSTAGRAM': return 'bg-pink-100 text-pink-600';
    case 'LINKEDIN': return 'bg-indigo-100 text-indigo-600';
    default: return 'bg-gray-100 text-gray-600';
  }
};

export default function SocialPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    content: '',
    platform: 'FACEBOOK' as 'FACEBOOK' | 'TWITTER' | 'INSTAGRAM' | 'LINKEDIN',
    scheduledAt: '',
  });

  // Utiliser le hook useSocialPosts pour récupérer les données depuis l'API
  const { posts, stats, isLoading, isError, mutate } = useSocialPosts({
    search: searchQuery || undefined,
  });

  const { createPost, loading: submitting, error: submitError } = useSocialPostMutations();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPost({
        content: formData.content,
        platform: formData.platform,
        scheduledAt: formData.scheduledAt || null,
        status: formData.scheduledAt ? 'PLANIFIE' : 'BROUILLON',
      });
      setIsModalOpen(false);
      setFormData({ content: '', platform: 'FACEBOOK', scheduledAt: '' });
      mutate();
    } catch (err) {
      console.error('Erreur création post:', err);
    }
  };

  // État de chargement
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange-600 mx-auto" />
          <p className="mt-4 text-gray-600">Chargement des posts...</p>
        </div>
      </div>
    );
  }

  // État d'erreur
  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Erreur lors du chargement des posts</p>
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
    { label: 'Posts Publiés', value: stats.publie, color: 'text-orange-600', icon: Share2 },
    { label: 'Total Likes', value: stats.totalLikes.toLocaleString(), color: 'text-pink-600', icon: Heart },
    { label: 'Commentaires', value: stats.totalComments, color: 'text-blue-600', icon: MessageCircle },
    { label: 'Partages', value: stats.totalShares, color: 'text-green-600', icon: TrendingUp },
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
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-semibold shadow-sm"
            >
              <Plus className="h-5 w-5" />
              Nouveau Post
            </button>
          </div>
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

        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => {
            const PlatformIcon = getPlatformIcon(post.platform);
            const platformColor = getPlatformColor(post.platform);
            const displayDate = post.status === 'PUBLIE' && post.publishedAt
              ? new Date(post.publishedAt)
              : post.scheduledAt
                ? new Date(post.scheduledAt)
                : new Date(post.createdAt);

            return (
              <div key={post.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${platformColor}`}>
                    <PlatformIcon className="h-4 w-4" />
                    <span className="text-sm font-semibold">{getPlatformLabel(post.platform)}</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    post.status === 'PUBLIE' ? 'bg-green-100 text-green-700' :
                    post.status === 'PLANIFIE' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>{getStatusLabel(post.status)}</span>
                </div>

                <p className="text-gray-900 mb-4 line-clamp-3">{post.content}</p>

                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                  <Calendar className="h-4 w-4" />
                  {displayDate.toLocaleDateString('fr-FR')}
                </div>

                {post.status === 'PUBLIE' && (
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

        {/* Modal Nouveau Post */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nouveau Post" size="lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            {submitError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{submitError}</div>}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Plateforme <span className="text-red-500">*</span></label>
              <select
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value as 'FACEBOOK' | 'TWITTER' | 'INSTAGRAM' | 'LINKEDIN' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="FACEBOOK">Facebook</option>
                <option value="TWITTER">Twitter</option>
                <option value="INSTAGRAM">Instagram</option>
                <option value="LINKEDIN">LinkedIn</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Contenu <span className="text-red-500">*</span></label>
              <textarea
                required
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                rows={6}
                placeholder="Rédigez votre post..."
              />
              <p className="text-sm text-gray-500 mt-1">{formData.content.length} caractères</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Programmer la publication (optionnel)</label>
              <input
                type="datetime-local"
                value={formData.scheduledAt}
                onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <p className="text-sm text-gray-500 mt-1">Si vide, sera sauvegardé en brouillon</p>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={submitting}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Créer le post
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}
