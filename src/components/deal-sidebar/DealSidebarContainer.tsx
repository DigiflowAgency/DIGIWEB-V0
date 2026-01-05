'use client';

import { useState, useEffect, useRef } from 'react';
import { GripVertical, Calendar, AlertTriangle, Trash2, Megaphone, StickyNote, LayoutList, Save, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useReminders } from '@/hooks/useReminders';
import { useStages } from '@/hooks/useStages';

import { Deal, Contact, Company, User } from './types';
import DealSidebarHeader from './DealSidebarHeader';
import DealSidebarContact from './DealSidebarContact';
import DealSidebarCompany from './DealSidebarCompany';
import DealSidebarOpportunity from './DealSidebarOpportunity';
import DealSidebarAssignees from './DealSidebarAssignees';
import DealSidebarNotes from './DealSidebarNotes';
import DealSidebarReminders from './DealSidebarReminders';
import DealSidebarDocuments from './DealSidebarDocuments';
import DealSidebarActivities from './DealSidebarActivities';

interface DealSidebarContainerProps {
  deal: Deal;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (dealId: string) => Promise<void>;
  onUpdate: () => void;
  showNotesTab?: boolean;
}

// Helper pour extraire les infos de localisation des customFields
const extractLocationFromCustomFields = (customFields: any): { city?: string; address?: string; postalCode?: string } | null => {
  if (!customFields || typeof customFields !== 'object') return null;

  const result: { city?: string; address?: string; postalCode?: string } = {};
  const cityKeys = ['city', 'ville', 'Ville', 'City', 'CITY', 'localite', 'Localité', 'localité', 'commune'];
  const addressKeys = ['address', 'adresse', 'Adresse', 'Address', 'ADDRESS', 'street', 'rue', 'Rue'];
  const postalKeys = ['postal_code', 'postalCode', 'zip', 'zipcode', 'code_postal', 'codePostal', 'cp', 'CP'];

  for (const key of cityKeys) {
    if (customFields[key]) { result.city = String(customFields[key]); break; }
  }
  for (const key of addressKeys) {
    if (customFields[key]) { result.address = String(customFields[key]); break; }
  }
  for (const key of postalKeys) {
    if (customFields[key]) { result.postalCode = String(customFields[key]); break; }
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

export default function DealSidebarContainer({
  deal,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  showNotesTab = false,
}: DealSidebarContainerProps) {
  const [width, setWidth] = useState(500);
  const [isResizing, setIsResizing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedDeal, setEditedDeal] = useState<Deal>(deal);
  const [editedContact, setEditedContact] = useState<Contact | null>(
    deal?.contacts ? { ...deal.contacts } : null
  );
  const [editedCompany, setEditedCompany] = useState<Company | null>(
    deal?.companies ? { ...deal.companies } : null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // États pour le bloc-notes (onglet Production)
  const [activeTab, setActiveTab] = useState<'details' | 'notes'>('details');
  const [blocNotes, setBlocNotes] = useState(deal.blocNotes || '');
  const [isSavingBlocNotes, setIsSavingBlocNotes] = useState(false);

  // Hooks
  const { data: session } = useSession();
  const { reminders, createReminder, deleteReminder, markAsRead } = useReminders({ dealId: deal?.id });
  const { stages, getStageLabel, getStageColor } = useStages();

  // Reset state when deal changes
  useEffect(() => {
    setEditedDeal(deal);
    setEditedContact(deal?.contacts ? { ...deal.contacts } : null);
    setEditedCompany(deal?.companies ? { ...deal.companies } : null);
    setBlocNotes(deal.blocNotes || '');
  }, [deal]);

  // Load users
  useEffect(() => {
    fetch('/api/users')
      .then((res) => res.json())
      .then((data) => {
        if (data.users && Array.isArray(data.users)) {
          setUsers(data.users);
        }
      })
      .catch((err) => console.error('Erreur chargement users:', err));
  }, []);

  // Resize handling
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
      // Save deal
      const dealResponse = await fetch(`/api/deals/${deal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedDeal),
      });

      if (!dealResponse.ok) throw new Error('Erreur sauvegarde deal');

      // Save contact if modified
      if (editedContact && deal.contacts?.id) {
        await fetch(`/api/contacts/${deal.contacts.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: editedContact.firstName,
            lastName: editedContact.lastName,
            email: editedContact.email,
            phone: editedContact.phone,
            position: editedContact.position,
            city: editedContact.city,
          }),
        });
      }

      // Save company if modified
      if (editedCompany && deal.companies?.id) {
        await fetch(`/api/companies/${deal.companies.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: editedCompany.name,
            city: editedCompany.city,
            siret: editedCompany.siret,
            website: editedCompany.website,
            phone: editedCompany.phone,
            email: editedCompany.email,
          }),
        });
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

  const handleCancel = () => {
    setIsEditing(false);
    setEditedDeal(deal);
    setEditedContact(deal?.contacts ? { ...deal.contacts } : null);
    setEditedCompany(deal?.companies ? { ...deal.companies } : null);
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

  // Sauvegarde du bloc-notes
  const handleSaveBlocNotes = async () => {
    setIsSavingBlocNotes(true);
    try {
      const response = await fetch(`/api/deals/${deal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocNotes }),
      });
      if (!response.ok) throw new Error('Erreur sauvegarde');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la sauvegarde du bloc-notes');
    } finally {
      setIsSavingBlocNotes(false);
    }
  };

  if (!isOpen) return null;

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
        className="fixed top-0 right-0 h-full bg-white shadow-2xl z-50 overflow-hidden flex flex-col"
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
        <DealSidebarHeader
          title={companyName}
          isEditing={isEditing}
          isSaving={isSaving}
          onClose={onClose}
          onEdit={() => setIsEditing(true)}
          onSave={handleSave}
          onCancel={handleCancel}
          onDelete={onDelete ? () => setShowDeleteConfirm(true) : undefined}
        />

        {/* Tabs (seulement si showNotesTab est activé) */}
        {showNotesTab && (
          <div className="flex border-b border-gray-200 px-4">
            <button
              onClick={() => setActiveTab('details')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'details'
                  ? 'border-violet-600 text-violet-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <LayoutList className="h-4 w-4" />
              Détails
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'notes'
                  ? 'border-violet-600 text-violet-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <StickyNote className="h-4 w-4" />
              Bloc-notes
            </button>
          </div>
        )}

        {/* Vue Bloc-notes (plein écran) */}
        {showNotesTab && activeTab === 'notes' ? (
          <div className="flex-1 flex flex-col p-4 overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <StickyNote className="h-5 w-5 text-violet-600" />
                Bloc-notes
              </h3>
              <button
                onClick={handleSaveBlocNotes}
                disabled={isSavingBlocNotes}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
              >
                {isSavingBlocNotes ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Sauvegarder
              </button>
            </div>
            <textarea
              value={blocNotes}
              onChange={(e) => setBlocNotes(e.target.value)}
              placeholder="Écrivez vos notes ici... (Suivi de production, remarques, to-do list, etc.)"
              className="flex-1 w-full p-4 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
              style={{ minHeight: '300px' }}
            />
            <p className="text-xs text-gray-400 mt-2">
              Dernière modification : {deal.updatedAt ? new Date(deal.updatedAt).toLocaleString('fr-FR') : '-'}
            </p>
          </div>
        ) : (
          /* Content normal */
          <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {/* Contact */}
          <DealSidebarContact
            contact={deal.contacts || null}
            isEditing={isEditing}
            editedContact={editedContact}
            setEditedContact={setEditedContact}
          />

          {/* Company */}
          <DealSidebarCompany
            company={deal.companies || null}
            isEditing={isEditing}
            editedCompany={editedCompany}
            setEditedCompany={setEditedCompany}
          />

          {/* Meta Ads Info */}
          {deal.metaLead?.customFields && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-violet-600" />
                Infos Ads
              </h3>
              <div className="space-y-3">
                {(() => {
                  const location = extractLocationFromCustomFields(deal.metaLead.customFields);
                  if (!location) return null;
                  return (
                    <div className="bg-violet-50 rounded-lg p-3 border border-violet-100">
                      <p className="text-xs text-violet-600 font-medium mb-2">Localisation</p>
                      <div className="space-y-1 text-sm">
                        {location.address && <p className="text-gray-700">{location.address}</p>}
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

          {/* Opportunity */}
          <DealSidebarOpportunity
            deal={deal}
            isEditing={isEditing}
            editedDeal={editedDeal}
            setEditedDeal={setEditedDeal}
            users={users}
            stages={stages}
            getStageLabel={getStageLabel}
            getStageColor={getStageColor}
          />

          {/* Assignees */}
          <DealSidebarAssignees
            deal={deal}
            users={users}
            isEditing={isEditing}
            onUpdate={onUpdate}
          />

          {/* Activites */}
          <DealSidebarActivities
            dealId={deal.id}
            contactId={deal.contactId}
          />

          {/* Documents */}
          <DealSidebarDocuments dealId={deal.id} />

          {/* Notes */}
          <DealSidebarNotes
            dealId={deal.id}
            initialNotes={deal.notes || []}
            legacyComments={deal.comments}
            onUpdate={onUpdate}
            users={users}
          />

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

          {/* Reminders */}
          <DealSidebarReminders
            reminders={reminders}
            createReminder={createReminder}
            deleteReminder={deleteReminder}
            markAsRead={markAsRead}
            dealId={deal.id}
            users={users}
            currentUserId={session?.user?.id || ''}
          />
        </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
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
              Toutes les données associées (notes, activités, documents) seront également supprimées.
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
