// Types partagés pour le DealSidebar

export interface Deal {
  id: string;
  title: string;
  description?: string | null;
  value: number;
  currency: string;
  stage: string;
  productionStage?: string | null;
  probability: number;
  expectedCloseDate?: string | null;
  closedAt?: string | null;
  contactId?: string | null;
  companyId?: string | null;
  ownerId: string;
  product?: string | null;
  origin?: string | null;
  emailReminderSent?: string | null;
  smsReminderSent?: string | null;
  comments?: string | null;
  createdAt: string;
  updatedAt: string;
  contacts?: Contact | null;
  companies?: Company | null;
  users?: User | null;
  deal_assignees?: DealAssignee[];
  notes?: Note[];
  metaLead?: MetaLead | null;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  position?: string | null;
  city?: string | null;
}

export interface Company {
  id: string;
  name: string;
  city?: string | null;
  siret?: string | null;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string | null;
}

export interface DealAssignee {
  id: string;
  role?: string | null;
  createdAt: string;
  user: User;
}

export interface Note {
  id: string;
  content: string;
  createdAt: string;
  users?: User | null;
}

export interface MetaLead {
  id: string;
  customFields?: Record<string, any> | null;
  pageName?: string | null;
  campaignName?: string | null;
  adName?: string | null;
}

export interface DealDocument {
  id: string;
  dealId: string;
  name: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  user?: User | null;
}

export interface Reminder {
  id: string;
  title: string;
  description?: string | null;
  remindAt: string;
  isRead: boolean;
}

export interface Stage {
  code: string;
  label: string;
  color: string;
}

// Props partagés
export interface DealSidebarProps {
  deal: Deal;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (dealId: string) => Promise<void>;
  onUpdate: () => void;
}

export interface SectionProps {
  deal: Deal;
  isEditing: boolean;
  editedDeal: Deal;
  setEditedDeal: (deal: Deal) => void;
  editedContact: Contact | null;
  setEditedContact: (contact: Contact | null) => void;
  editedCompany: Company | null;
  setEditedCompany: (company: Company | null) => void;
  onUpdate: () => void;
  users: User[];
}

// Configuration des origines avec icônes
export const originOptions = [
  { value: 'SITE_WEB', label: 'Site Web' },
  { value: 'ADS', label: 'Publicité Meta (ADS)' },
  { value: 'DM_INSTA', label: 'DM Instagram' },
  { value: 'LINKEDIN', label: 'LinkedIn' },
  { value: 'RECOMMANDATION', label: 'Recommandation' },
  { value: 'CLIENT_BEHYPE', label: 'Client Behype' },
  { value: 'CONNAISSANCE', label: 'Connaissance' },
  { value: 'TELEPROS_CAM', label: 'Télépros CAM' },
  { value: 'COLD_CALL', label: 'Cold Call' },
  { value: 'COLD_MAIL', label: 'Cold Mail' },
  { value: 'COLD_SMS', label: 'Cold SMS' },
];

export const productOptions = [
  { value: 'DIGIFLOW', label: 'DIGIFLOW' },
  { value: 'BEHYPE', label: 'BEHYPE' },
  { value: 'PISTACHE', label: 'PISTACHE' },
  { value: 'COMPTES_FOOD', label: 'COMPTES FOOD' },
];

export const reminderStatusOptions = [
  { value: '', label: 'Sélectionner...' },
  { value: 'A_ENVOYER', label: 'À envoyer' },
  { value: 'OUI', label: 'Oui' },
  { value: 'NON', label: 'Non' },
];
