import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getAllLeads, parseLeadData, getPagesInfo } from '@/lib/meta-leads';

// GET /api/meta-leads - Récupérer tous les leads Meta
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const assignedToId = searchParams.get('assignedToId');
    const pageId = searchParams.get('pageId'); // Filtre par entreprise/page

    // Construire le filtre
    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (assignedToId) {
      where.assignedToId = assignedToId;
    }
    if (pageId) {
      where.pageId = pageId;
    }

    const leads = await prisma.meta_leads.findMany({
      where,
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { metaCreatedAt: 'desc' },
    });

    // Stats globales
    const stats = {
      total: await prisma.meta_leads.count(),
      libre: await prisma.meta_leads.count({ where: { status: 'LIBRE' } }),
      assigne: await prisma.meta_leads.count({ where: { status: 'ASSIGNE' } }),
      converti: await prisma.meta_leads.count({ where: { status: 'CONVERTI' } }),
    };

    // Stats par page/entreprise
    const pageStats = await prisma.meta_leads.groupBy({
      by: ['pageId', 'pageName'],
      _count: { id: true },
    });

    // Récupérer les pages disponibles
    let pages: { id: string; name: string; category?: string }[] = [];
    try {
      pages = await getPagesInfo();
    } catch (error) {
      console.error('Erreur récupération pages:', error);
    }

    return NextResponse.json({ leads, stats, pageStats, pages });
  } catch (error) {
    console.error('Erreur GET /api/meta-leads:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des leads' },
      { status: 500 }
    );
  }
}

// POST /api/meta-leads - Synchroniser les leads depuis Meta
export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    console.log('Début synchronisation leads Meta (multi-pages)...');

    // Récupérer le dernier lead synchronisé pour optimiser la requête
    const lastLead = await prisma.meta_leads.findFirst({
      orderBy: { metaCreatedAt: 'desc' },
      select: { metaCreatedAt: true }
    });

    // Convertir en timestamp Unix (secondes) si on a un lead
    const sinceTimestamp = lastLead?.metaCreatedAt
      ? Math.floor(lastLead.metaCreatedAt.getTime() / 1000)
      : undefined;

    if (sinceTimestamp) {
      console.log(`Récupération des leads créés après le ${new Date(sinceTimestamp * 1000).toLocaleString('fr-FR')}`);
    } else {
      console.log('Première synchronisation - récupération de tous les leads');
    }

    // Récupérer les leads depuis Meta (filtrés par date si possible)
    const { leads: metaLeads, forms } = await getAllLeads(sinceTimestamp);
    console.log(`${metaLeads.length} leads trouvés dans ${forms.length} formulaires`);

    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const metaLead of metaLeads) {
      try {
        // Vérifier si le lead existe déjà
        const existing = await prisma.meta_leads.findUnique({
          where: { metaLeadId: metaLead.id },
        });

        if (existing) {
          skipped++;
          continue;
        }

        // Parser les données du lead
        const parsedData = parseLeadData(metaLead);

        // Créer le lead dans la base
        await prisma.meta_leads.create({
          data: {
            metaLeadId: metaLead.id,
            formId: metaLead.form_id || null,
            formName: metaLead.form_name || null,
            pageId: metaLead.page_id || null,
            pageName: metaLead.page_name || null,
            adId: metaLead.ad_id || null,
            adName: metaLead.ad_name || null,
            adsetId: metaLead.adset_id || null,
            adsetName: metaLead.adset_name || null,
            campaignId: metaLead.campaign_id || null,
            campaignName: metaLead.campaign_name || null,
            platform: metaLead.platform || null,
            isOrganic: metaLead.is_organic ?? null,
            fullName: parsedData.fullName,
            email: parsedData.email,
            phone: parsedData.phone,
            customFields: Object.keys(parsedData.customFields).length > 0
              ? parsedData.customFields
              : undefined,
            status: 'LIBRE',
            metaCreatedAt: new Date(metaLead.created_time),
          },
        });

        created++;
      } catch (error: any) {
        console.error(`Erreur import lead ${metaLead.id}:`, error);
        errors.push(`Lead ${metaLead.id}: ${error.message}`);
      }
    }

    console.log(`Synchronisation terminée: ${created} créés, ${skipped} ignorés`);

    // Récupérer les stats par page pour le retour
    const pageStats = await prisma.meta_leads.groupBy({
      by: ['pageId', 'pageName'],
      _count: { id: true },
    });

    return NextResponse.json({
      success: true,
      created,
      skipped,
      total: metaLeads.length,
      forms: forms.length,
      pageStats,
      errors: errors.length > 0 ? errors : null,
    });
  } catch (error: any) {
    console.error('Erreur POST /api/meta-leads (sync):', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la synchronisation' },
      { status: 500 }
    );
  }
}
