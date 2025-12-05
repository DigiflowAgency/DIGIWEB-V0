'use client';

import { useState, useEffect, useRef } from 'react';
import { GripVertical, X, Edit2, Save, User, Mail, Phone, Building2, MapPin, Euro, MessageSquare, Calendar, Trash2, AlertTriangle, Globe, Megaphone, Instagram, Linkedin, Users, PhoneCall, MailIcon, MessageCircle, UserPlus, UserMinus, Bell, Clock, Plus } from 'lucide-react';
import { useReminders } from '@/hooks/useReminders';


interface DealSidebarProps {
  deal: any;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (dealId: string) => Promise<void>;
  onUpdate: () => void;
}

// Configuration des origines avec icônes et couleurs
const originConfig: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  'SITE_WEB': { label: 'Site Web', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: Globe },
  'ADS': { label: 'Publicité Meta', color: 'text-purple-700', bgColor: 'bg-purple-100', icon: Megaphone },
  'DM_INSTA': { label: 'DM Instagram', color: 'text-pink-700', bgColor: 'bg-pink-100', icon: Instagram },
  'LINKEDIN': { label: 'LinkedIn', color: 'text-sky-700', bgColor: 'bg-sky-100', icon: Linkedin },
  'RECOMMANDATION': { label: 'Recommandation', color: 'text-green-700', bgColor: 'bg-green-100', icon: Users },
  'CLIENT_BEHYPE': { label: 'Client Behype', color: 'text-orange-700', bgColor: 'bg-orange-100', icon: Users },
  'CONNAISSANCE': { label: 'Connaissance', color: 'text-teal-700', bgColor: 'bg-teal-100', icon: Users },
  'TELEPROS_CAM': { label: 'Télépros CAM', color: 'text-violet-700', bgColor: 'bg-violet-100', icon: PhoneCall },
  'COLD_CALL': { label: 'Cold Call', color: 'text-amber-700', bgColor: 'bg-amber-100', icon: PhoneCall },
  'COLD_MAIL': { label: 'Cold Mail', color: 'text-indigo-700', bgColor: 'bg-indigo-100', icon: MailIcon },
  'COLD_SMS': { label: 'Cold SMS', color: 'text-cyan-700', bgColor: 'bg-cyan-100', icon: MessageCircle },
};

// Helper pour extraire les infos de localisation des customFields
const extractLocationFromCustomFields = (customFields: any): { city?: string; address?: string; postalCode?: string } | null => {
  if (!customFields || typeof customFields !== 'object') return null;

  const result: { city?: string; address?: string; postalCode?: string } = {};

  // Chercher les champs de ville avec différents noms possibles
  const cityKeys = ['city', 'ville', 'Ville', 'City', 'CITY', 'localite', 'Localité', 'localité', 'commune'];
  for (const key of cityKeys) {
    if (customFields[key]) {
      result.city = String(customFields[key]);
      break;
    }
  }

  // Chercher les champs d'adresse
  const addressKeys = ['address', 'adresse', 'Adresse', 'Address', 'ADDRESS', 'street', 'rue', 'Rue'];
  for (const key of addressKeys) {
    if (customFields[key]) {
      result.address = String(customFields[key]);
      break;
    }
  }

  // Chercher le code postal
  const postalKeys = ['postal_code', 'postalCode', 'zip', 'zipcode', 'code_postal', 'codePostal', 'cp', 'CP'];
  for (const key of postalKeys) {
    if (customFields[key]) {
      result.postalCode = String(customFields[key]);
      break;
    }
  }

  return Object.keys(result).length > 0 ? result : null;
};

// Helper pour obtenir les champs personnalisés sans les champs de localisation
const getOtherCustomFields = (customFields: any): Record<string, any> => {
  if (!customFields || typeof customFields !== 'object') return {};

  const locationKeys = [
    'city', 'ville', 'Ville', 'City', 'CITY', 'localite', 'Localité', 'localité', 'commune',
    'address', 'adresse', 'Adresse', 'Address', 'ADDRESS', 'street', 'rue', 'Rue',
    'postal_code', 'postalCode', 'zip', 'zipcode', 'code_postal', 'codePostal', 'cp', 'CP'
  ];

  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(customFields)) {
    if (!locationKeys.includes(key) && value) {
      result[key] = value;
    }
  }
  return result;
};

export default function DealSidebar({ deal, isOpen, onClose, onUpdate, onDelete }: DealSidebarProps) {
  const [width, setWidth] = useState(500);
  const [isResizing, setIsResizing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedDeal, setEditedDeal] = useState<any>(deal);
  const [editedContact, setEditedContact] = useState<any>(null);
  const [editedCompany, setEditedCompany] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [showAddAssignee, setShowAddAssignee] = useState(false);
  const [newAssigneeId, setNewAssigneeId] = useState('');
  const [isAddingAssignee, setIsAddingAssignee] = useState(false);
  // Rappels
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('09:00');
  const [isAddingReminder, setIsAddingReminder] = useState(false);
  // Notes/Commentaires
  const [notes, setNotes] = useState<any[]>([]);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Hook pour les rappels
  const { reminders, createReminder, deleteReminder, markAsRead } = useReminders({ dealId: deal?.id });

  useEffect(() => {
    setEditedDeal(deal);
    setEditedContact(deal?.contacts ? { ...deal.contacts } : null);
    setEditedCompany(deal?.companies ? { ...deal.companies } : null);
    // Charger les notes depuis le deal
    if (deal?.notes) {
      setNotes(deal.notes);
    }
  }, [deal]);

  useEffect(() => {
    // Récupérer la liste des utilisateurs
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        // L'API retourne { users: [...] }
        if (data.users && Array.isArray(data.users)) {
          setUsers(data.users);
        } else {
          console.error('Format invalide pour users:', data);
          setUsers([]);
        }
      })
      .catch(err => {
        console.error('Erreur chargement users:', err);
        setUsers([]);
      });
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= 300 && newWidth <= 1200) {
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Sauvegarder le deal
      const dealResponse = await fetch(`/api/deals/${deal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedDeal),
      });

      if (!dealResponse.ok) {
        throw new Error('Erreur lors de la sauvegarde du deal');
      }

      // Sauvegarder le contact si modifié
      if (editedContact && deal.contacts?.id) {
        const contactResponse = await fetch(`/api/contacts/${deal.contacts.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: editedContact.firstName,
            lastName: editedContact.lastName,
            email: editedContact.email,
            phone: editedContact.phone,
          }),
        });

        if (!contactResponse.ok) {
          console.error('Erreur lors de la sauvegarde du contact');
        }
      }

      // Sauvegarder l'entreprise si modifiée
      if (editedCompany && deal.companies?.id) {
        const companyResponse = await fetch(`/api/companies/${deal.companies.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: editedCompany.name,
            city: editedCompany.city,
          }),
        });

        if (!companyResponse.ok) {
          console.error('Erreur lors de la sauvegarde de l\'entreprise');
        }
      }

      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;

    setIsDeleting(true);
    try {
      await onDelete(deal.id);
      setShowDeleteConfirm(false);
      onClose();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) return;

    setIsAddingNote(true);
    try {
      const response = await fetch(`/api/deals/${deal.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNoteContent }),
      });

      if (response.ok) {
        const data = await response.json();
        // Ajouter la nouvelle note en haut de la liste
        setNotes((prev) => [data.note, ...prev]);
        setNewNoteContent('');
        onUpdate(); // Rafraîchir les données du deal
      } else {
        const error = await response.json();
        alert(error.error || 'Erreur lors de l\'ajout de la note');
      }
    } catch (error) {
      console.error('Erreur ajout note:', error);
      alert('Erreur lors de l\'ajout de la note');
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleAddAssignee = async () => {
    if (!newAssigneeId) return;

    setIsAddingAssignee(true);
    try {
      const response = await fetch(`/api/deals/${deal.id}/assignees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: newAssigneeId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de l\'ajout');
      }

      setNewAssigneeId('');
      setShowAddAssignee(false);
      onUpdate();
    } catch (error) {
      console.error('Erreur:', error);
      alert(error instanceof Error ? error.message : 'Erreur lors de l\'ajout de l\'assigné');
    } finally {
      setIsAddingAssignee(false);
    }
  };

  const handleRemoveAssignee = async (userId: string) => {
    try {
      const response = await fetch(`/api/deals/${deal.id}/assignees?userId=${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la suppression');
      }

      onUpdate();
    } catch (error) {
      console.error('Erreur:', error);
      alert(error instanceof Error ? error.message : 'Erreur lors de la suppression de l\'assigné');
    }
  };

  const handleAddReminder = async () => {
    if (!reminderTitle || !reminderDate) return;

    setIsAddingReminder(true);
    try {
      const remindAt = `${reminderDate}T${reminderTime}:00`;
      await createReminder({
        dealId: deal.id,
        title: reminderTitle,
        remindAt,
      });

      setReminderTitle('');
      setReminderDate('');
      setReminderTime('09:00');
      setShowAddReminder(false);
    } catch (error) {
      console.error('Erreur:', error);
      alert(error instanceof Error ? error.message : 'Erreur lors de la création du rappel');
    } finally {
      setIsAddingReminder(false);
    }
  };

  const handleDeleteReminder = async (reminderId: string) => {
    try {
      await deleteReminder(reminderId);
    } catch (error) {
      console.error('Erreur:', error);
      alert(error instanceof Error ? error.message : 'Erreur lors de la suppression du rappel');
    }
  };

  if (!isOpen) return null;

  const contactName = deal.contacts ? `${deal.contacts.firstName} ${deal.contacts.lastName}` : 'N/A';
  const companyName = deal.companies?.name || deal.title;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-30 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className="fixed top-0 right-0 h-full bg-white shadow-2xl z-50 overflow-hidden"
        style={{ width: `${width}px` }}
      >
        {/* Resize Handle */}
        <div
          className="absolute left-0 top-0 h-full w-1 hover:w-2 bg-transparent hover:bg-violet-500 cursor-col-resize transition-all z-50 group"
          onMouseDown={() => setIsResizing(true)}
        >
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="h-6 w-6 text-violet-600" />
          </div>
        </div>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-violet-600 to-orange-500">
          <h2 className="text-xl font-bold text-white truncate flex-1">
            {companyName}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-[calc(100%-80px)]">
          <div className="p-6 space-y-6">
            {/* Actions */}
            <div className="flex items-center justify-between">
              {onDelete && !isEditing && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </button>
              )}
              <div className="flex items-center gap-2 ml-auto">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
                >
                  <Edit2 className="h-4 w-4" />
                  Modifier
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditedDeal(deal);
                      setEditedContact(deal?.contacts ? { ...deal.contacts } : null);
                      setEditedCompany(deal?.companies ? { ...deal.companies } : null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
                  </button>
                </div>
              )}
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-violet-600" />
                Contact
              </h3>
              <div className="space-y-3">
                {isEditing && editedContact ? (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Prénom</label>
                        <input
                          type="text"
                          value={editedContact.firstName || ''}
                          onChange={(e) => setEditedContact({ ...editedContact, firstName: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Nom</label>
                        <input
                          type="text"
                          value={editedContact.lastName || ''}
                          onChange={(e) => setEditedContact({ ...editedContact, lastName: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Email</label>
                      <input
                        type="email"
                        value={editedContact.email || ''}
                        onChange={(e) => setEditedContact({ ...editedContact, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Téléphone</label>
                      <input
                        type="tel"
                        value={editedContact.phone || ''}
                        onChange={(e) => setEditedContact({ ...editedContact, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-700">{contactName}</span>
                    </div>
                    {deal.contacts?.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <a href={`mailto:${deal.contacts.email}`} className="text-violet-600 hover:underline">
                          {deal.contacts.email}
                        </a>
                      </div>
                    )}
                    {deal.contacts?.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <a href={`tel:${deal.contacts.phone}`} className="text-violet-600 hover:underline">
                          {deal.contacts.phone}
                        </a>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Company Information */}
            {deal.companies && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-violet-600" />
                  Entreprise
                </h3>
                <div className="space-y-3">
                  {isEditing && editedCompany ? (
                    <>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Nom de l&apos;entreprise</label>
                        <input
                          type="text"
                          value={editedCompany.name || ''}
                          onChange={(e) => setEditedCompany({ ...editedCompany, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Ville</label>
                        <input
                          type="text"
                          value={editedCompany.city || ''}
                          onChange={(e) => setEditedCompany({ ...editedCompany, city: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                        />
                      </div>
                      {deal.companies.siret && (
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400 text-sm">SIRET:</span>
                          <span className="text-gray-700">{deal.companies.siret}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-700">{deal.companies.name}</span>
                      </div>
                      {deal.companies.city && (
                        <div className="flex items-center gap-3">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-700">{deal.companies.city}</span>
                        </div>
                      )}
                      {deal.companies.siret && (
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400 text-sm">SIRET:</span>
                          <span className="text-gray-700">{deal.companies.siret}</span>
                        </div>
                      )}
                      {deal.companies.website && (
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400 text-sm">Site web:</span>
                          <a href={deal.companies.website} target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:underline">
                            {deal.companies.website}
                          </a>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Informations complémentaires (depuis Meta Ads) */}
            {deal.metaLead?.customFields && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-violet-600" />
                  Infos Ads
                </h3>
                <div className="space-y-3">
                  {/* Localisation */}
                  {(() => {
                    const location = extractLocationFromCustomFields(deal.metaLead.customFields);
                    if (!location) return null;
                    return (
                      <div className="bg-violet-50 rounded-lg p-3 border border-violet-100">
                        <p className="text-xs text-violet-600 font-medium mb-2">Localisation</p>
                        <div className="space-y-1 text-sm">
                          {location.address && (
                            <p className="text-gray-700">{location.address}</p>
                          )}
                          {(location.postalCode || location.city) && (
                            <p className="text-gray-700">
                              {location.postalCode && <span>{location.postalCode} </span>}
                              {location.city}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Autres champs personnalisés */}
                  {(() => {
                    const otherFields = getOtherCustomFields(deal.metaLead.customFields);
                    const entries = Object.entries(otherFields);
                    if (entries.length === 0) return null;
                    return (
                      <div className="space-y-2">
                        <p className="text-xs text-gray-500 font-medium">Champs personnalisés</p>
                        <div className="flex flex-wrap gap-2">
                          {entries.map(([key, value]) => (
                            <span
                              key={key}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                            >
                              <span className="font-medium">{key}:</span>
                              <span>{String(value)}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Source Ads */}
                  {(deal.metaLead.campaignName || deal.metaLead.pageName) && (
                    <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                      {deal.metaLead.pageName && <p>Page: {deal.metaLead.pageName}</p>}
                      {deal.metaLead.campaignName && <p>Campagne: {deal.metaLead.campaignName}</p>}
                      {deal.metaLead.adName && <p>Pub: {deal.metaLead.adName}</p>}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Deal Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Euro className="h-5 w-5 text-violet-600" />
                Opportunité
              </h3>
              <div className="space-y-4">
                {/* Assignation principale */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Responsable principal
                  </label>
                  {isEditing ? (
                    <select
                      value={editedDeal.ownerId}
                      onChange={(e) => setEditedDeal({ ...editedDeal, ownerId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                      {users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.firstName} {user.lastName}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
                        <User className="h-4 w-4 text-violet-600" />
                      </div>
                      <span className="text-gray-700 font-medium">
                        {deal.users ? `${deal.users.firstName} ${deal.users.lastName}` : 'Non assigné'}
                      </span>
                      <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">Principal</span>
                    </div>
                  )}
                </div>

                {/* Assignés supplémentaires */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center justify-between">
                    <span>Équipe assignée</span>
                    {!isEditing && (
                      <button
                        onClick={() => setShowAddAssignee(!showAddAssignee)}
                        className="text-violet-600 hover:text-violet-700 flex items-center gap-1 text-xs"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        Ajouter
                      </button>
                    )}
                  </label>

                  {/* Formulaire d'ajout d'assigné */}
                  {showAddAssignee && !isEditing && (
                    <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex gap-2">
                        <select
                          value={newAssigneeId}
                          onChange={(e) => setNewAssigneeId(e.target.value)}
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                        >
                          <option value="">Sélectionner...</option>
                          {users
                            .filter(u => u.id !== deal.ownerId && !deal.deal_assignees?.some((a: any) => a.user.id === u.id))
                            .map(user => (
                              <option key={user.id} value={user.id}>
                                {user.firstName} {user.lastName}
                              </option>
                            ))}
                        </select>
                        <button
                          onClick={handleAddAssignee}
                          disabled={!newAssigneeId || isAddingAssignee}
                          className="px-3 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 text-sm"
                        >
                          {isAddingAssignee ? '...' : 'OK'}
                        </button>
                        <button
                          onClick={() => { setShowAddAssignee(false); setNewAssigneeId(''); }}
                          className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-sm"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Liste des assignés */}
                  <div className="space-y-2">
                    {deal.deal_assignees && deal.deal_assignees.length > 0 ? (
                      deal.deal_assignees.map((assignee: any) => (
                        <div key={assignee.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center">
                              <User className="h-3.5 w-3.5 text-orange-600" />
                            </div>
                            <span className="text-sm text-gray-700">
                              {assignee.user.firstName} {assignee.user.lastName}
                            </span>
                            {assignee.role && (
                              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                                {assignee.role}
                              </span>
                            )}
                          </div>
                          {!isEditing && (
                            <button
                              onClick={() => handleRemoveAssignee(assignee.user.id)}
                              className="text-red-400 hover:text-red-600 p-1"
                              title="Retirer"
                            >
                              <UserMinus className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-400 italic">Aucun membre supplémentaire</p>
                    )}
                  </div>
                </div>

                {/* État */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    État
                  </label>
                  {isEditing ? (
                    <select
                      value={editedDeal.stage}
                      onChange={(e) => setEditedDeal({ ...editedDeal, stage: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                      <option value="A_CONTACTER">À Contacter</option>
                      <option value="EN_DISCUSSION">En Discussion</option>
                      <option value="A_RELANCER">À Relancer</option>
                      <option value="RDV_PRIS">RDV Pris</option>
                      <option value="NEGO_HOT">Négo Hot 🔥</option>
                      <option value="CLOSING">Closing</option>
                      <option value="REFUSE">Refusé</option>
                    </select>
                  ) : (
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                      deal.stage === 'A_CONTACTER'
                        ? 'bg-gray-100 text-gray-700'
                        : deal.stage === 'EN_DISCUSSION'
                        ? 'bg-blue-100 text-blue-700'
                        : deal.stage === 'A_RELANCER'
                        ? 'bg-yellow-100 text-yellow-700'
                        : deal.stage === 'RDV_PRIS'
                        ? 'bg-violet-100 text-violet-700'
                        : deal.stage === 'NEGO_HOT'
                        ? 'bg-orange-100 text-orange-700'
                        : deal.stage === 'CLOSING'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {deal.stage}
                    </span>
                  )}
                </div>

                {/* Produit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Produit
                  </label>
                  {isEditing ? (
                    <select
                      value={editedDeal.product || ''}
                      onChange={(e) => setEditedDeal({ ...editedDeal, product: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                      <option value="">Sélectionner...</option>
                      <option value="DIGIFLOW">DIGIFLOW</option>
                      <option value="BEHYPE">BEHYPE</option>
                      <option value="PISTACHE">PISTACHE</option>
                      <option value="COMPTES_FOOD">COMPTES FOOD</option>
                    </select>
                  ) : (
                    <p className="text-gray-700">{deal.product || 'Non défini'}</p>
                  )}
                </div>

                {/* Origine / Source */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Origine
                  </label>
                  {isEditing ? (
                    <select
                      value={editedDeal.origin || ''}
                      onChange={(e) => setEditedDeal({ ...editedDeal, origin: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                      <option value="">Sélectionner...</option>
                      <option value="SITE_WEB">Site Web</option>
                      <option value="ADS">Publicité Meta (ADS)</option>
                      <option value="DM_INSTA">DM Instagram</option>
                      <option value="LINKEDIN">LinkedIn</option>
                      <option value="RECOMMANDATION">Recommandation</option>
                      <option value="CLIENT_BEHYPE">Client Behype</option>
                      <option value="CONNAISSANCE">Connaissance</option>
                      <option value="TELEPROS_CAM">Télépros CAM</option>
                      <option value="COLD_CALL">Cold Call</option>
                      <option value="COLD_MAIL">Cold Mail</option>
                      <option value="COLD_SMS">Cold SMS</option>
                    </select>
                  ) : (
                    <>
                      {deal.origin ? (
                        <div className="flex items-center gap-2">
                          {(() => {
                            const config = originConfig[deal.origin];
                            if (config) {
                              const IconComponent = config.icon;
                              return (
                                <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${config.bgColor} ${config.color}`}>
                                  <IconComponent className="h-4 w-4" />
                                  {config.label}
                                </span>
                              );
                            }
                            return <span className="text-gray-700">{deal.origin}</span>;
                          })()}
                        </div>
                      ) : (
                        <p className="text-gray-400 italic">Non définie</p>
                      )}
                    </>
                  )}
                </div>

                {/* Valeur */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valeur
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editedDeal.value}
                      onChange={(e) => setEditedDeal({ ...editedDeal, value: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  ) : (
                    <p className="text-gray-700 font-semibold">{deal.value.toLocaleString()} {deal.currency}</p>
                  )}
                </div>

                {/* Probabilité */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Probabilité
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editedDeal.probability}
                      onChange={(e) => setEditedDeal({ ...editedDeal, probability: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  ) : (
                    <p className="text-gray-700">{deal.probability}%</p>
                  )}
                </div>

                {/* Date de RDV */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de RDV
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={editedDeal.expectedCloseDate ? new Date(editedDeal.expectedCloseDate).toISOString().split('T')[0] : ''}
                      onChange={(e) => setEditedDeal({ ...editedDeal, expectedCloseDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  ) : (
                    <p className="text-gray-700">
                      {deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString('fr-FR') : 'Non défini'}
                    </p>
                  )}
                </div>

                {/* Origine */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Origine
                  </label>
                  {isEditing ? (
                    <select
                      value={editedDeal.origin || ''}
                      onChange={(e) => setEditedDeal({ ...editedDeal, origin: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                      <option value="">Sélectionner...</option>
                      <option value="SITE_WEB">Site web</option>
                      <option value="TELEPROS_CAM">TÉLÉPROS CAM</option>
                      <option value="DM_INSTA">DM INSTA</option>
                      <option value="LINKEDIN">LINKEDIN</option>
                      <option value="RECOMMANDATION">RECOMMANDATION</option>
                      <option value="CLIENT_BEHYPE">CLIENT BEHYPE</option>
                      <option value="CONNAISSANCE">CONNAISSANCE</option>
                      <option value="ADS">ADS</option>
                      <option value="COLD_CALL">COLD CALL</option>
                      <option value="COLD_MAIL">COLD MAIL</option>
                      <option value="COLD_SMS">COLD SMS</option>
                    </select>
                  ) : (
                    <p className="text-gray-700">{deal.origin || 'Non défini'}</p>
                  )}
                </div>

                {/* Mail de relance */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mail de relance envoyé
                  </label>
                  {isEditing ? (
                    <select
                      value={editedDeal.emailReminderSent || ''}
                      onChange={(e) => setEditedDeal({ ...editedDeal, emailReminderSent: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                      <option value="">Sélectionner...</option>
                      <option value="A_ENVOYER">À envoyer</option>
                      <option value="OUI">Oui</option>
                    </select>
                  ) : (
                    <p className="text-gray-700">{deal.emailReminderSent || 'Non défini'}</p>
                  )}
                </div>

                {/* SMS de relance */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SMS de relance envoyé
                  </label>
                  {isEditing ? (
                    <select
                      value={editedDeal.smsReminderSent || ''}
                      onChange={(e) => setEditedDeal({ ...editedDeal, smsReminderSent: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                      <option value="">Sélectionner...</option>
                      <option value="NON">Non</option>
                      <option value="OUI">Oui</option>
                    </select>
                  ) : (
                    <p className="text-gray-700">{deal.smsReminderSent || 'Non défini'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Commentaires / Notes */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-violet-600" />
                  Commentaires
                  {notes.length > 0 && (
                    <span className="bg-violet-100 text-violet-700 text-xs px-2 py-0.5 rounded-full">
                      {notes.length}
                    </span>
                  )}
                </span>
              </h3>

              {/* Formulaire d'ajout de note */}
              <div className="mb-4">
                <div className="flex gap-2">
                  <textarea
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm resize-none"
                    rows={2}
                    placeholder="Ajouter un commentaire..."
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={isAddingNote || !newNoteContent.trim()}
                    className="px-3 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors self-end"
                  >
                    {isAddingNote ? (
                      <Clock className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Liste des notes */}
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {notes.length === 0 ? (
                  <p className="text-gray-500 text-sm italic">Aucun commentaire</p>
                ) : (
                  notes.map((note: any) => (
                    <div
                      key={note.id}
                      className="bg-gray-50 rounded-lg p-3 border border-gray-100"
                    >
                      <p className="text-gray-700 text-sm whitespace-pre-wrap mb-2">
                        {note.content}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="font-medium">
                          {note.users?.firstName} {note.users?.lastName}
                        </span>
                        <span>
                          {new Date(note.createdAt).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Ancien champ comments (rétro-compatibilité) */}
              {deal.comments && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">Notes anciennes :</p>
                  <p className="text-gray-600 text-sm whitespace-pre-wrap bg-gray-50 p-2 rounded">
                    {deal.comments}
                  </p>
                </div>
              )}
            </div>

            {/* Dates */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-violet-600" />
                Dates
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>Créé le: {new Date(deal.createdAt).toLocaleString('fr-FR')}</p>
                <p>Mis à jour le: {new Date(deal.updatedAt).toLocaleString('fr-FR')}</p>
              </div>
            </div>

            {/* Rappels */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-violet-600" />
                  Rappels
                  {reminders.length > 0 && (
                    <span className="bg-violet-100 text-violet-700 text-xs px-2 py-0.5 rounded-full">
                      {reminders.length}
                    </span>
                  )}
                </span>
                {!showAddReminder && (
                  <button
                    onClick={() => setShowAddReminder(true)}
                    className="text-violet-600 hover:text-violet-700 flex items-center gap-1 text-sm font-normal"
                  >
                    <Plus className="h-4 w-4" />
                    Ajouter
                  </button>
                )}
              </h3>

              {/* Formulaire d'ajout de rappel */}
              {showAddReminder && (
                <div className="mb-4 p-4 bg-violet-50 rounded-lg border border-violet-200">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Titre du rappel</label>
                      <input
                        type="text"
                        value={reminderTitle}
                        onChange={(e) => setReminderTitle(e.target.value)}
                        placeholder="Ex: Rappeler pour confirmation RDV"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Date</label>
                        <input
                          type="date"
                          value={reminderDate}
                          onChange={(e) => setReminderDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Heure</label>
                        <input
                          type="time"
                          value={reminderTime}
                          onChange={(e) => setReminderTime(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setShowAddReminder(false);
                          setReminderTitle('');
                          setReminderDate('');
                          setReminderTime('09:00');
                        }}
                        className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleAddReminder}
                        disabled={!reminderTitle || !reminderDate || isAddingReminder}
                        className="px-3 py-1.5 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
                      >
                        {isAddingReminder ? 'Ajout...' : 'Ajouter'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Liste des rappels */}
              <div className="space-y-2">
                {reminders.length > 0 ? (
                  reminders.map((reminder: any) => {
                    const remindAt = new Date(reminder.remindAt);
                    const now = new Date();
                    const isPast = remindAt < now;
                    const isToday = remindAt.toDateString() === now.toDateString();

                    return (
                      <div
                        key={reminder.id}
                        className={`flex items-start justify-between p-3 rounded-lg border ${
                          isPast && !reminder.isRead
                            ? 'bg-red-50 border-red-200'
                            : isToday
                            ? 'bg-orange-50 border-orange-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Clock className={`h-4 w-4 ${isPast && !reminder.isRead ? 'text-red-500' : 'text-gray-400'}`} />
                            <span className={`text-sm font-medium ${isPast && !reminder.isRead ? 'text-red-700' : 'text-gray-700'}`}>
                              {reminder.title}
                            </span>
                          </div>
                          <p className={`text-xs mt-1 ${isPast && !reminder.isRead ? 'text-red-600' : 'text-gray-500'}`}>
                            {isToday
                              ? `Aujourd'hui à ${remindAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
                              : remindAt.toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                            {isPast && !reminder.isRead && ' (en retard)'}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {!reminder.isRead && (
                            <button
                              onClick={() => markAsRead(reminder.id)}
                              className="p-1 text-green-600 hover:bg-green-100 rounded"
                              title="Marquer comme lu"
                            >
                              ✓
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteReminder(reminder.id)}
                            className="p-1 text-red-400 hover:text-red-600 hover:bg-red-100 rounded"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-400 italic text-center py-4">
                    Aucun rappel programmé
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmation de suppression */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl p-6 max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Supprimer ce prospect ?</h3>
                <p className="text-sm text-gray-500">Cette action est irréversible</p>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir supprimer <strong>{companyName}</strong> ?
              Toutes les données associées (notes, activités) seront également supprimées.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Supprimer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
