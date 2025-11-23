'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  Video,
  FileText,
  Clock,
  Award,
  CheckCircle,
  Play,
  X,
  BookOpen,
} from 'lucide-react';

interface Formation {
  id: string;
  title: string;
  description: string | null;
  category: string;
  videoUrl: string | null;
  articleContent: string | null;
  duration: number;
  hasCertificate: boolean;
  allowedRoles: string;
  order: number;
  userProgress: {
    progress: number;
    status: string;
    completedAt: string | null;
  } | null;
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  ONBOARDING: { label: 'Onboarding', color: 'bg-blue-100 text-blue-700' },
  TECHNIQUES_VENTE: { label: 'Techniques de vente', color: 'bg-green-100 text-green-700' },
  PRODUITS: { label: 'Produits', color: 'bg-purple-100 text-purple-700' },
  OUTILS: { label: 'Outils', color: 'bg-orange-100 text-orange-700' },
  SOFT_SKILLS: { label: 'Soft Skills', color: 'bg-pink-100 text-pink-700' },
  TECHNICAL: { label: 'Technique', color: 'bg-gray-100 text-gray-700' },
};

export default function FormationsPage() {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFormation, setSelectedFormation] = useState<Formation | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchFormations();
  }, []);

  const fetchFormations = async () => {
    try {
      const res = await fetch('/api/formations');
      const data = await res.json();
      setFormations(data.formations || []);
    } catch (error) {
      console.error('Erreur lors du chargement des formations:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (formationId: string, progress: number) => {
    try {
      await fetch(`/api/formations/${formationId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress }),
      });
      await fetchFormations();
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la progression:', error);
    }
  };

  const markAsCompleted = async (formationId: string) => {
    await updateProgress(formationId, 100);
    setSelectedFormation(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
      </div>
    );
  }

  const filteredFormations = formations.filter((formation) => {
    if (filterCategory !== 'all' && formation.category !== filterCategory) return false;
    if (filterStatus === 'completed' && formation.userProgress?.status !== 'COMPLETEE') return false;
    if (filterStatus === 'in_progress' && formation.userProgress?.status !== 'EN_COURS') return false;
    if (filterStatus === 'not_started' && formation.userProgress?.status && formation.userProgress.status !== 'NON_COMMENCEE') return false;
    return true;
  });

  // Stats
  const totalFormations = formations.length;
  const completedFormations = formations.filter(f => f.userProgress?.status === 'COMPLETEE').length;
  const inProgressFormations = formations.filter(f => f.userProgress?.status === 'EN_COURS').length;

  return (
    <div className="min-h-screen gradient-mesh py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-700 to-orange-500 bg-clip-text text-transparent flex items-center gap-3">
            <GraduationCap className="h-10 w-10 text-violet-600" />
            Formations
          </h1>
          <p className="mt-2 text-gray-600">
            Développez vos compétences avec nos formations
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-premium p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total</p>
                <p className="text-3xl font-bold text-gray-900">{totalFormations}</p>
              </div>
              <BookOpen className="h-12 w-12 text-violet-200" />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-premium p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">En cours</p>
                <p className="text-3xl font-bold text-orange-600">{inProgressFormations}</p>
              </div>
              <Play className="h-12 w-12 text-orange-200" />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card-premium p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Terminées</p>
                <p className="text-3xl font-bold text-green-600">{completedFormations}</p>
              </div>
              <CheckCircle className="h-12 w-12 text-green-200" />
            </div>
          </motion.div>
        </div>

        {/* Filtres */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-premium p-4 mb-6 flex items-center gap-4"
        >
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Catégorie</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="input-field"
            >
              <option value="all">Toutes</option>
              {Object.entries(CATEGORY_LABELS).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Statut</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field"
            >
              <option value="all">Tous</option>
              <option value="not_started">Non commencées</option>
              <option value="in_progress">En cours</option>
              <option value="completed">Terminées</option>
            </select>
          </div>
        </motion.div>

        {/* Liste des formations */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFormations.map((formation, index) => {
            const categoryInfo = CATEGORY_LABELS[formation.category];
            const isVideo = !!formation.videoUrl;
            const progress = formation.userProgress?.progress || 0;
            const isCompleted = formation.userProgress?.status === 'COMPLETEE';

            return (
              <motion.div
                key={formation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedFormation(formation)}
                className="card-premium overflow-hidden group hover:shadow-xl transition-all cursor-pointer"
              >
                {isCompleted && (
                  <div className="absolute top-4 right-4 z-10 bg-green-500 text-white rounded-full p-2">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                )}

                <div className={`h-2 bg-gradient-to-r ${isVideo ? 'from-violet-600 to-purple-600' : 'from-orange-500 to-orange-600'}`} />
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-violet-700 transition-colors">
                        {formation.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{formation.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${categoryInfo.color}`}>
                      {categoryInfo.label}
                    </span>
                    {isVideo ? (
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-violet-100 text-violet-700 flex items-center gap-1">
                        <Video className="h-3 w-3" />
                        Vidéo
                      </span>
                    ) : (
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-700 flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        Article
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formation.duration} min
                    </span>
                    {formation.hasCertificate && (
                      <span className="flex items-center gap-1 text-violet-600">
                        <Award className="h-4 w-4" />
                        Certificat
                      </span>
                    )}
                  </div>

                  {progress > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-600">Progression</span>
                        <span className="text-xs font-bold text-violet-700">{progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          className="h-full bg-gradient-to-r from-violet-600 to-orange-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {filteredFormations.length === 0 && (
          <div className="card-premium p-12 text-center">
            <GraduationCap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune formation</h3>
            <p className="text-gray-500">Aucune formation ne correspond à vos critères</p>
          </div>
        )}
      </div>

      {/* Modal de lecture */}
      <AnimatePresence>
        {selectedFormation && (
          <FormationViewModal
            formation={selectedFormation}
            onClose={() => setSelectedFormation(null)}
            onComplete={() => markAsCompleted(selectedFormation.id)}
            onUpdateProgress={(progress) => updateProgress(selectedFormation.id, progress)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Modal de lecture de formation
interface FormationViewModalProps {
  formation: Formation;
  onClose: () => void;
  onComplete: () => void;
  onUpdateProgress: (progress: number) => void;
}

function FormationViewModal({ formation, onClose, onComplete, onUpdateProgress }: FormationViewModalProps) {
  const isVideo = !!formation.videoUrl;
  const isCompleted = formation.userProgress?.status === 'COMPLETEE';

  useEffect(() => {
    // Marquer comme démarré (10% de progression)
    if (!formation.userProgress || formation.userProgress.progress === 0) {
      onUpdateProgress(10);
    }
  }, []);

  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  };

  const _renderMarkdown = (text: string) => {
    if (!text) return '';

    const html = text
      // Titres
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>')
      // Images
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded-lg my-4" />')
      // Gras et italique
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(/_(.*?)_/g, '<em class="italic">$1</em>')
      // Listes
      .replace(/^\- (.*$)/gim, '<li class="ml-4">• $1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 list-decimal">$1</li>')
      // Citations
      .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-violet-300 pl-4 italic text-gray-600 my-4">$1</blockquote>')
      // Code inline
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-violet-700">$1</code>')
      // Liens
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-violet-600 hover:underline font-medium" target="_blank">$1</a>')
      // Sauts de ligne
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/\n/g, '<br/>');

    return `<div class="prose prose-lg max-w-none"><p class="mb-4">${html}</p></div>`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{formation.title}</h2>
            <p className="text-sm text-gray-600 mt-1">{formation.description}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg ml-4">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {isVideo ? (
            <div className="aspect-video bg-black rounded-xl overflow-hidden mb-6">
              <iframe
                src={getYouTubeEmbedUrl(formation.videoUrl!)}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="prose prose-lg max-w-none mb-6">
              <div className="bg-gray-50 rounded-xl p-8">
                <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                  {formation.articleContent}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-2 text-gray-600">
                <Clock className="h-5 w-5" />
                {formation.duration} minutes
              </span>
              {formation.hasCertificate && (
                <span className="flex items-center gap-2 text-violet-600">
                  <Award className="h-5 w-5" />
                  Certificat disponible
                </span>
              )}
            </div>
            {!isCompleted && (
              <button
                onClick={onComplete}
                className="btn-primary flex items-center gap-2"
              >
                <CheckCircle className="h-5 w-5" />
                Marquer comme terminé
              </button>
            )}
            {isCompleted && (
              <span className="px-6 py-3 bg-green-100 text-green-700 rounded-xl font-semibold flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Formation terminée
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
