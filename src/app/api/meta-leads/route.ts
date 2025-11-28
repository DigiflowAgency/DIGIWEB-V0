import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getAllLeads, parseLeadData } from '@/lib/meta-leads';

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

    // Construire le filtre
    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (assignedToId) {
      where.assignedToId = assignedToId;
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

    // Stats
    const stats = {
      total: await prisma.meta_leads.count(),
      libre: await prisma.meta_leads.count({ where: { status: 'LIBRE' } }),
      assigne: await prisma.meta_leads.count({ where: { status: 'ASSIGNE' } }),
      converti: await prisma.meta_leads.count({ where: { status: 'CONVERTI' } }),
    };

    return NextResponse.json({ leads, stats });
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

    console.log('Début synchronisation leads Meta...');

    // Récupérer tous les leads depuis Meta
    const { leads: metaLeads, forms } = await getAllLeads();
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
            formName: (metaLead as any).form_name || null,
            adId: metaLead.ad_id || null,
            adName: metaLead.ad_name || null,
            campaignId: metaLead.campaign_id || null,
            campaignName: metaLead.campaign_name || null,
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

    return NextResponse.json({
      success: true,
      created,
      skipped,
      total: metaLeads.length,
      forms: forms.length,
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
