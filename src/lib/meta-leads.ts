/**
 * Service pour interagir avec l'API Meta Graph - Leads Retrieval
 * Support multi-pages (plusieurs entreprises)
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
  form_name?: string;
  page_id?: string;
  page_name?: string;
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
  page_id?: string;
  page_name?: string;
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

interface MetaPage {
  id: string;
  name: string;
  access_token: string;
  category?: string;
}

interface MetaPagesResponse {
  data: MetaPage[];
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
    next?: string;
  };
}

/**
 * Récupère toutes les pages accessibles avec le token utilisateur
 */
export async function getAccessiblePages(): Promise<MetaPage[]> {
  const userAccessToken = process.env.META_ACCESS_TOKEN;

  if (!userAccessToken) {
    throw new Error('META_ACCESS_TOKEN non configuré');
  }

  const url = `${META_GRAPH_URL}/me/accounts?access_token=${userAccessToken}`;

  const response = await fetch(url);
  const data: MetaPagesResponse = await response.json();

  if (!response.ok) {
    console.error('Erreur Meta API (pages):', data);
    throw new Error(`Erreur Meta API: ${JSON.stringify(data)}`);
  }

  return data.data || [];
}

/**
 * Récupère tous les formulaires de génération de leads d'une page spécifique
 */
export async function getLeadgenFormsForPage(pageId: string, pageAccessToken: string): Promise<MetaLeadgenForm[]> {
  const url = `${META_GRAPH_URL}/${pageId}/leadgen_forms?access_token=${pageAccessToken}`;

  const response = await fetch(url);
  const data: MetaLeadgenFormsResponse = await response.json();

  if (!response.ok) {
    console.error('Erreur Meta API (forms):', data);
    throw new Error(`Erreur Meta API: ${JSON.stringify(data)}`);
  }

  return data.data || [];
}

/**
 * Récupère les leads d'un formulaire spécifique
 */
export async function getLeadsByForm(formId: string, pageAccessToken: string): Promise<MetaLead[]> {
  const url = `${META_GRAPH_URL}/${formId}/leads?fields=id,created_time,field_data,ad_id,ad_name,campaign_id,campaign_name,form_id&access_token=${pageAccessToken}`;

  const response = await fetch(url);
  const data: MetaLeadsResponse = await response.json();

  if (!response.ok) {
    console.error('Erreur Meta API (leads):', data);
    throw new Error(`Erreur Meta API: ${JSON.stringify(data)}`);
  }

  return data.data || [];
}

/**
 * Récupère les détails d'un lead spécifique
 */
export async function getLeadDetails(leadId: string, pageAccessToken?: string): Promise<MetaLead | null> {
  const accessToken = pageAccessToken || process.env.META_ACCESS_TOKEN;

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
    } else if (name.includes('phone') || name.includes('telephone') || name.includes('téléphone') || name.includes('numéro_de_téléphone') || name === 'tel') {
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
 * Récupère tous les leads de toutes les pages accessibles
 * C'est la fonction principale à utiliser pour récupérer TOUS les leads
 */
export async function getAllLeadsFromAllPages(): Promise<{
  leads: MetaLead[];
  forms: MetaLeadgenForm[];
  pages: MetaPage[];
}> {
  const pages = await getAccessiblePages();
  const allLeads: MetaLead[] = [];
  const allForms: MetaLeadgenForm[] = [];

  console.log(`Récupération des leads de ${pages.length} page(s): ${pages.map(p => p.name).join(', ')}`);

  for (const page of pages) {
    try {
      const forms = await getLeadgenFormsForPage(page.id, page.access_token);

      // Ajouter les infos de la page aux formulaires
      const formsWithPage = forms.map(form => ({
        ...form,
        page_id: page.id,
        page_name: page.name,
      }));
      allForms.push(...formsWithPage);

      for (const form of forms) {
        try {
          const leads = await getLeadsByForm(form.id, page.access_token);

          // Ajouter les infos du formulaire et de la page à chaque lead
          const leadsWithInfo = leads.map(lead => ({
            ...lead,
            form_name: form.name,
            form_id: form.id,
            page_id: page.id,
            page_name: page.name,
          }));
          allLeads.push(...leadsWithInfo);

          console.log(`  - ${page.name} / ${form.name}: ${leads.length} lead(s)`);
        } catch (error) {
          console.error(`Erreur récupération leads du formulaire ${form.id} (${form.name}):`, error);
        }
      }
    } catch (error) {
      console.error(`Erreur récupération formulaires de la page ${page.id} (${page.name}):`, error);
    }
  }

  console.log(`Total: ${allLeads.length} lead(s) récupéré(s) de ${allForms.length} formulaire(s)`);

  return { leads: allLeads, forms: allForms, pages };
}

/**
 * Récupère tous les leads d'une page spécifique (ancien comportement)
 * @deprecated Utiliser getAllLeadsFromAllPages() pour récupérer les leads de toutes les pages
 */
export async function getAllLeads(): Promise<{
  leads: MetaLead[];
  forms: MetaLeadgenForm[];
}> {
  // Utilise maintenant la nouvelle fonction multi-pages
  const result = await getAllLeadsFromAllPages();
  return { leads: result.leads, forms: result.forms };
}

/**
 * Récupère tous les formulaires de génération de leads (ancien comportement)
 * @deprecated Utiliser getAccessiblePages() + getLeadgenFormsForPage() pour le support multi-pages
 */
export async function getLeadgenForms(): Promise<MetaLeadgenForm[]> {
  const pageId = process.env.META_PAGE_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!pageId || !accessToken) {
    // Si pas de PAGE_ID configuré, on récupère les formulaires de toutes les pages
    const pages = await getAccessiblePages();
    const allForms: MetaLeadgenForm[] = [];

    for (const page of pages) {
      const forms = await getLeadgenFormsForPage(page.id, page.access_token);
      allForms.push(...forms.map(f => ({ ...f, page_id: page.id, page_name: page.name })));
    }

    return allForms;
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
 * Vérifie la validité du token d'accès
 */
export async function verifyAccessToken(): Promise<boolean> {
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!accessToken) {
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

/**
 * Récupère les informations sur les pages accessibles (pour affichage)
 */
export async function getPagesInfo(): Promise<{ id: string; name: string; category?: string }[]> {
  const pages = await getAccessiblePages();
  return pages.map(p => ({ id: p.id, name: p.name, category: p.category }));
}
