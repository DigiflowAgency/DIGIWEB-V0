'use client';

import { Building2, MapPin, Globe, Phone, Mail } from 'lucide-react';
import { Company } from './types';
import EditableField from './EditableField';

interface DealSidebarCompanyProps {
  company: Company | null;
  isEditing: boolean;
  editedCompany: Company | null;
  setEditedCompany: (company: Company | null) => void;
}

export default function DealSidebarCompany({
  company,
  isEditing,
  editedCompany,
  setEditedCompany,
}: DealSidebarCompanyProps) {
  if (!company) return null;

  const updateField = (field: keyof Company, value: string) => {
    if (editedCompany) {
      setEditedCompany({ ...editedCompany, [field]: value });
    }
  };

  return (
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
              <EditableField
                isEditing={true}
                value={editedCompany.name}
                onChange={(v) => updateField('name', v)}
                label="Nom"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Ville</label>
              <EditableField
                isEditing={true}
                value={editedCompany.city}
                onChange={(v) => updateField('city', v)}
                label="Ville"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">SIRET</label>
              <EditableField
                isEditing={true}
                value={editedCompany.siret}
                onChange={(v) => updateField('siret', v)}
                label="SIRET"
                placeholder="Ex: 123 456 789 00012"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Site web</label>
              <EditableField
                isEditing={true}
                value={editedCompany.website}
                onChange={(v) => updateField('website', v)}
                label="Site web"
                type="url"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Téléphone</label>
              <EditableField
                isEditing={true}
                value={editedCompany.phone}
                onChange={(v) => updateField('phone', v)}
                label="Téléphone"
                type="tel"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Email</label>
              <EditableField
                isEditing={true}
                value={editedCompany.email}
                onChange={(v) => updateField('email', v)}
                label="Email"
                type="email"
              />
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-gray-400" />
              <span className="text-gray-700">{company.name}</span>
            </div>
            {company.city && (
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700">{company.city}</span>
              </div>
            )}
            {company.siret && (
              <div className="flex items-center gap-3">
                <span className="text-gray-400 text-sm">SIRET:</span>
                <span className="text-gray-700">{company.siret}</span>
              </div>
            )}
            {company.website && (
              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 text-gray-400" />
                <a
                  href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-600 hover:underline"
                >
                  {company.website}
                </a>
              </div>
            )}
            {company.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gray-400" />
                <a href={`tel:${company.phone}`} className="text-violet-600 hover:underline">
                  {company.phone}
                </a>
              </div>
            )}
            {company.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-400" />
                <a href={`mailto:${company.email}`} className="text-violet-600 hover:underline">
                  {company.email}
                </a>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
