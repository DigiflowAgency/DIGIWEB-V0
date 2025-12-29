'use client';

import { User, Mail, Phone, MapPin, Briefcase } from 'lucide-react';
import { Contact } from './types';
import EditableField from './EditableField';

interface DealSidebarContactProps {
  contact: Contact | null;
  isEditing: boolean;
  editedContact: Contact | null;
  setEditedContact: (contact: Contact | null) => void;
}

export default function DealSidebarContact({
  contact,
  isEditing,
  editedContact,
  setEditedContact,
}: DealSidebarContactProps) {
  const contactName = contact ? `${contact.firstName} ${contact.lastName}` : 'N/A';

  const updateField = (field: keyof Contact, value: string) => {
    if (editedContact) {
      setEditedContact({ ...editedContact, [field]: value });
    }
  };

  return (
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
                <EditableField
                  isEditing={true}
                  value={editedContact.firstName}
                  onChange={(v) => updateField('firstName', v)}
                  label="Prénom"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Nom</label>
                <EditableField
                  isEditing={true}
                  value={editedContact.lastName}
                  onChange={(v) => updateField('lastName', v)}
                  label="Nom"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Email</label>
              <EditableField
                isEditing={true}
                value={editedContact.email}
                onChange={(v) => updateField('email', v)}
                label="Email"
                type="email"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Téléphone</label>
              <EditableField
                isEditing={true}
                value={editedContact.phone}
                onChange={(v) => updateField('phone', v)}
                label="Téléphone"
                type="tel"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Poste / Fonction</label>
              <EditableField
                isEditing={true}
                value={editedContact.position}
                onChange={(v) => updateField('position', v)}
                label="Poste"
                placeholder="Ex: Directeur Marketing"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Ville</label>
              <EditableField
                isEditing={true}
                value={editedContact.city}
                onChange={(v) => updateField('city', v)}
                label="Ville"
              />
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-gray-700">{contactName}</span>
            </div>
            {contact?.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-400" />
                <a href={`mailto:${contact.email}`} className="text-violet-600 hover:underline">
                  {contact.email}
                </a>
              </div>
            )}
            {contact?.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gray-400" />
                <a href={`tel:${contact.phone}`} className="text-violet-600 hover:underline">
                  {contact.phone}
                </a>
              </div>
            )}
            {contact?.position && (
              <div className="flex items-center gap-3">
                <Briefcase className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700">{contact.position}</span>
              </div>
            )}
            {contact?.city && (
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700">{contact.city}</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
