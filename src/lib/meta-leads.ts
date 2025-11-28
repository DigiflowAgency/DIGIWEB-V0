/**
 * Service pour interagir avec l'API Meta Graph - Leads Retrieval
 * Documentation: https://developers.facebook.com/docs/marketing-api/guides/lead-ads/
 */

const META_GRAPH_URL = 'https://graph.facebook.com/v18.0';

interface MetaLeadField {
  name: string;
  values: string[];
}

interface MetaLead {
  id: string;
  created_time: string;
  field_data: MetaLeadField[];
  ad_id?: string;
  ad_name?: string;
  campaign_id?: string;
  campaign_name?: string;
  form_id?: string;
}

interface MetaLeadsResponse {
  data: MetaLead[];
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
    next?: string;
  };
}

interface MetaLeadgenForm {
  id: string;
  name: string;
  status: string;
  leads_count?: number;
}

interface MetaLeadgenFormsResponse {
  data: MetaLeadgenForm[];
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
    next?: string;
  };
}

/**
 * Récupère tous les formulaires de génération de leads d'une page
 */
export async function getLeadgenForms(): Promise<MetaLeadgenForm[]> {
  const pageId = process.env.META_PAGE_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!pageId || !accessToken) {
    throw new Error('META_PAGE_ID ou META_ACCESS_TOKEN non configuré');
  }

  const url = `${META_GRAPH_URL}/${pageId}/leadgen_forms?access_token=${accessToken}`;

  const response = await fetch(url);
  const data: MetaLeadgenFormsResponse = await response.json();

  if (!response.ok) {
    console.error('Erreur Meta API:', data);
    throw new Error(`Erreur Meta API: ${JSON.stringify(data)}`);
  }

  return data.data || [];
}

/**
 * Récupère les leads d'un formulaire spécifique
 */
export async function getLeadsByForm(formId: string): Promise<MetaLead[]> {
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error('META_ACCESS_TOKEN non configuré');
  }

  const url = `${META_GRAPH_URL}/${formId}/leads?fields=id,created_time,field_data,ad_id,ad_name,campaign_id,campaign_name,form_id&access_token=${accessToken}`;

  const response = await fetch(url);
  const data: MetaLeadsResponse = await response.json();

  if (!response.ok) {
    console.error('Erreur Meta API:', data);
    throw new Error(`Erreur Meta API: ${JSON.stringify(data)}`);
  }

  return data.data || [];
}

/**
 * Récupère les détails d'un lead spécifique
 */
export async function getLeadDetails(leadId: string): Promise<MetaLead | null> {
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error('META_ACCESS_TOKEN non configuré');
  }

  const url = `${META_GRAPH_URL}/${leadId}?fields=id,created_time,field_data,ad_id,ad_name,campaign_id,campaign_name,form_id&access_token=${accessToken}`;

  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    console.error('Erreur Meta API:', data);
    return null;
  }

  return data;
}

/**
 * Parse les données d'un lead Meta en format exploitable
 */
export function parseLeadData(lead: MetaLead): {
  fullName: string | null;
  email: string | null;
  phone: string | null;
  customFields: Record<string, string>;
} {
  const result = {
    fullName: null as string | null,
    email: null as string | null,
    phone: null as string | null,
    customFields: {} as Record<string, string>,
  };

  for (const field of lead.field_data) {
    const value = field.values[0] || '';
    const name = field.name.toLowerCase();

    // Mapping des champs standards
    if (name.includes('full_name') || name.includes('nom_complet') || name === 'full name') {
      result.fullName = value;
    } else if (name.includes('email') || name === 'e-mail') {
      result.email = value;
    } else if (name.includes('phone') || name.includes('telephone') || name.includes('téléphone') || name === 'tel') {
      result.phone = value;
    } else if (name.includes('first_name') || name.includes('prénom') || name === 'prenom') {
      result.fullName = result.fullName ? `${value} ${result.fullName}` : value;
    } else if (name.includes('last_name') || name === 'nom') {
      result.fullName = result.fullName ? `${result.fullName} ${value}` : value;
    } else {
      // Champ personnalisé
      result.customFields[field.name] = value;
    }
  }

  return result;
}

/**
 * Récupère tous les leads de tous les formulaires de la page
 */
export async function getAllLeads(): Promise<{
  leads: MetaLead[];
  forms: MetaLeadgenForm[];
}> {
  const forms = await getLeadgenForms();
  const allLeads: MetaLead[] = [];

  for (const form of forms) {
    try {
      const leads = await getLeadsByForm(form.id);
      // Ajouter le nom du formulaire à chaque lead
      const leadsWithFormName = leads.map(lead => ({
        ...lead,
        form_name: form.name,
      }));
      allLeads.push(...leadsWithFormName);
    } catch (error) {
      console.error(`Erreur récupération leads du formulaire ${form.id}:`, error);
    }
  }

  return { leads: allLeads, forms };
}

/**
 * Vérifie la validité du token d'accès
 */
export async function verifyAccessToken(): Promise<boolean> {
  const accessToken = process.env.META_ACCESS_TOKEN;
  const appId = process.env.META_APP_ID;

  if (!accessToken || !appId) {
    return false;
  }

  try {
    const url = `${META_GRAPH_URL}/debug_token?input_token=${accessToken}&access_token=${accessToken}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.data && data.data.is_valid) {
      console.log('Token Meta valide, expire le:', new Date(data.data.expires_at * 1000));
      return true;
    }

    console.error('Token Meta invalide:', data);
    return false;
  } catch (error) {
    console.error('Erreur vérification token:', error);
    return false;
  }
}
