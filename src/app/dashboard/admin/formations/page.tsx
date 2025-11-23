'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import RichTextEditor from '@/components/RichTextEditor';
import {
  GraduationCap,
  Plus,
  X,
  Edit2,
  Trash2,
  Video,
  FileText,
  Clock,
  Award,
  Loader2,
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
  createdAt: string;
  updatedAt: string;
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  ONBOARDING: { label: 'Onboarding', color: 'bg-blue-100 text-blue-700' },
  TECHNIQUES_VENTE: { label: 'Techniques de vente', color: 'bg-green-100 text-green-700' },
  PRODUITS: { label: 'Produits', color: 'bg-purple-100 text-purple-700' },
  OUTILS: { label: 'Outils', color: 'bg-orange-100 text-orange-700' },
  SOFT_SKILLS: { label: 'Soft Skills', color: 'bg-pink-100 text-pink-700' },
  TECHNICAL: { label: 'Technique', color: 'bg-gray-100 text-gray-700' },
};

const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'VENTE', label: 'Commercial' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'ACCOUNT_MANAGEMENT', label: 'Account Manager' },
];

export default function AdminFormationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedFormation, setSelectedFormation] = useState<Formation | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      fetchFormations();
    }
  }, [status, session]);

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

  const deleteFormation = async (formationId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette formation ?')) return;

    try {
      const res = await fetch(`/api/formations/${formationId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await fetchFormations();
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-violet-600" />
      </div>
    );
  }

  const filteredFormations = formations.filter((formation) => {
    if (filterCategory !== 'all' && formation.category !== filterCategory) return false;
    return true;
  });

  return (
    <div className="min-h-screen gradient-mesh py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-700 to-orange-500 bg-clip-text text-transparent flex items-center gap-3">
                <GraduationCap className="h-10 w-10 text-violet-600" />
                Gestion des formations
              </h1>
              <p className="mt-2 text-gray-600">
                Créez et gérez les formations pour votre équipe
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Nouvelle formation
            </motion.button>
          </div>
        </motion.div>

        {/* Filtre */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-premium p-4 mb-6"
        >
          <label className="block text-sm font-semibold text-gray-700 mb-2">Catégorie</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="input-field"
          >
            <option value="all">Toutes les catégories</option>
            {Object.entries(CATEGORY_LABELS).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </motion.div>

        {/* Liste des formations */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFormations.map((formation, index) => {
            const categoryInfo = CATEGORY_LABELS[formation.category];
            const allowedRoles = JSON.parse(formation.allowedRoles);
            const isVideo = !!formation.videoUrl;

            return (
              <motion.div
                key={formation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="card-premium overflow-hidden group hover:shadow-xl transition-shadow"
              >
                <div className={`h-2 bg-gradient-to-r ${isVideo ? 'from-violet-600 to-purple-600' : 'from-orange-500 to-orange-600'}`} />
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{formation.title}</h3>
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

                  {allowedRoles.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-1">Rôles autorisés :</p>
                      <div className="flex flex-wrap gap-1">
                        {allowedRoles.map((role: string) => (
                          <span key={role} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                            {ROLE_OPTIONS.find(r => r.value === role)?.label || role}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedFormation(formation);
                        setShowEditModal(true);
                      }}
                      className="flex-1 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-semibold flex items-center justify-center gap-2"
                    >
                      <Edit2 className="h-4 w-4" />
                      Modifier
                    </button>
                    <button
                      onClick={() => deleteFormation(formation.id)}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {filteredFormations.length === 0 && (
          <div className="card-premium p-12 text-center">
            <GraduationCap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune formation</h3>
            <p className="text-gray-500">Créez votre première formation pour commencer</p>
          </div>
        )}

        {/* Modals */}
        <FormationModal
          show={showCreateModal}
          formation={null}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchFormations();
          }}
        />

        <FormationModal
          show={showEditModal}
          formation={selectedFormation}
          onClose={() => {
            setShowEditModal(false);
            setSelectedFormation(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedFormation(null);
            fetchFormations();
          }}
        />
      </div>
    </div>
  );
}

// Modal de création/édition de formation
interface FormationModalProps {
  show: boolean;
  formation: Formation | null;
  onClose: () => void;
  onSuccess: () => void;
}

function FormationModal({ show, formation, onClose, onSuccess }: FormationModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'ONBOARDING',
    type: 'video' as 'video' | 'article',
    videoUrl: '',
    articleContent: '',
    duration: '',
    hasCertificate: false,
    allowedRoles: [] as string[],
    order: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (formation) {
      setFormData({
        title: formation.title,
        description: formation.description || '',
        category: formation.category,
        type: formation.videoUrl ? 'video' : 'article',
        videoUrl: formation.videoUrl || '',
        articleContent: formation.articleContent || '',
        duration: formation.duration.toString(),
        hasCertificate: formation.hasCertificate,
        allowedRoles: JSON.parse(formation.allowedRoles),
        order: formation.order.toString(),
      });
    } else {
      setFormData({
        title: '',
        description: '',
        category: 'ONBOARDING',
        type: 'video',
        videoUrl: '',
        articleContent: '',
        duration: '',
        hasCertificate: false,
        allowedRoles: [],
        order: '',
      });
    }
  }, [formation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: any = {
        title: formData.title,
        description: formData.description || undefined,
        category: formData.category,
        duration: parseInt(formData.duration),
        hasCertificate: formData.hasCertificate,
        allowedRoles: formData.allowedRoles,
        order: formData.order ? parseInt(formData.order) : 0,
      };

      if (formData.type === 'video') {
        payload.videoUrl = formData.videoUrl;
      } else {
        payload.articleContent = formData.articleContent;
      }

      const url = formation ? `/api/formations/${formation.id}` : '/api/formations';
      const method = formation ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json();
        alert(data.error || 'Erreur lors de l\'enregistrement');
      }
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      alert('Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = (role: string) => {
    setFormData(prev => ({
      ...prev,
      allowedRoles: prev.allowedRoles.includes(role)
        ? prev.allowedRoles.filter(r => r !== role)
        : [...prev.allowedRoles, role],
    }));
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-gray-900">
            {formation ? 'Modifier la formation' : 'Nouvelle formation'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Titre *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
            <RichTextEditor
              value={formData.description}
              onChange={(value) => setFormData({ ...formData, description: value })}
              placeholder="Décrivez brièvement cette formation..."
              minHeight="150px"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Catégorie *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="input-field"
              >
                {Object.entries(CATEGORY_LABELS).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Durée (minutes) *</label>
              <input
                type="number"
                required
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          {/* Type de contenu */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Type de contenu *</label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'video' })}
                className={`flex-1 px-4 py-3 rounded-xl border-2 flex items-center justify-center gap-2 font-semibold ${
                  formData.type === 'video'
                    ? 'border-violet-600 bg-violet-50 text-violet-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Video className="h-5 w-5" />
                Vidéo
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'article' })}
                className={`flex-1 px-4 py-3 rounded-xl border-2 flex items-center justify-center gap-2 font-semibold ${
                  formData.type === 'article'
                    ? 'border-orange-600 bg-orange-50 text-orange-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <FileText className="h-5 w-5" />
                Article
              </button>
            </div>
          </div>

          {formData.type === 'video' ? (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">URL de la vidéo *</label>
              <input
                type="url"
                required={formData.type === 'video'}
                value={formData.videoUrl}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                className="input-field"
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Contenu de l'article *</label>
              <RichTextEditor
                value={formData.articleContent}
                onChange={(value) => setFormData({ ...formData, articleContent: value })}
                placeholder="Rédigez le contenu complet de votre formation..."
                minHeight="400px"
              />
            </div>
          )}

          {/* Rôles autorisés */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Rôles autorisés (laisser vide pour tous)
            </label>
            <div className="grid grid-cols-2 gap-3">
              {ROLE_OPTIONS.map((role) => (
                <label
                  key={role.value}
                  className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={formData.allowedRoles.includes(role.value)}
                    onChange={() => toggleRole(role.value)}
                    className="rounded text-violet-600"
                  />
                  <span className="text-sm font-medium">{role.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Ordre d'affichage</label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                className="input-field"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 w-full">
                <input
                  type="checkbox"
                  checked={formData.hasCertificate}
                  onChange={(e) => setFormData({ ...formData, hasCertificate: e.target.checked })}
                  className="rounded text-violet-600"
                />
                <Award className="h-5 w-5 text-violet-600" />
                <span className="text-sm font-medium">Délivre un certificat</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-300 hover:bg-gray-50 font-semibold"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary"
            >
              {loading ? 'Enregistrement...' : formation ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
