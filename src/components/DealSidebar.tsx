'use client';

import { useState, useEffect, useRef } from 'react';
import { GripVertical, X, Edit2, Save, User, Mail, Phone, Building2, MapPin, Euro, MessageSquare, Calendar } from 'lucide-react';


interface DealSidebarProps {
  deal: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function DealSidebar({ deal, isOpen, onClose, onUpdate }: DealSidebarProps) {
  const [width, setWidth] = useState(500);
  const [isResizing, setIsResizing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedDeal, setEditedDeal] = useState<any>(deal);
  const [isSaving, setIsSaving] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEditedDeal(deal);
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
      const response = await fetch(`/api/deals/${deal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedDeal),
      });

      if (response.ok) {
        setIsEditing(false);
        onUpdate();
      } else {
        alert('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
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
            <div className="flex items-center justify-end gap-2">
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

            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-violet-600" />
                Contact
              </h3>
              <div className="space-y-3">
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
                {/* Assignation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assignation
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
                    <p className="text-gray-700">
                      {deal.users ? `${deal.users.firstName} ${deal.users.lastName}` : 'Non assigné'}
                    </p>
                  )}
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

            {/* Commentaires */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-violet-600" />
                Commentaires
              </h3>
              {isEditing ? (
                <textarea
                  value={editedDeal.comments || ''}
                  onChange={(e) => setEditedDeal({ ...editedDeal, comments: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  rows={4}
                  placeholder="Ajouter des notes..."
                />
              ) : (
                <p className="text-gray-700 whitespace-pre-wrap">{deal.comments || 'Aucun commentaire'}</p>
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
          </div>
        </div>
      </div>
    </>
  );
}
