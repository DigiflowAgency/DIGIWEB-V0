import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type RouteContext = {
  params: { id: string };
};

// GET /api/meta-leads/[id] - Récupérer un lead spécifique
export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const lead = await prisma.meta_leads.findUnique({
      where: { id: params.id },
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
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead non trouvé' }, { status: 404 });
    }

    return NextResponse.json(lead);
  } catch (error) {
    console.error('Erreur GET /api/meta-leads/[id]:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du lead' },
      { status: 500 }
    );
  }
}

// PATCH /api/meta-leads/[id] - Attribuer un lead à un commercial
export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { assignedToId, action } = body;

    // Récupérer le lead actuel
    const lead = await prisma.meta_leads.findUnique({
      where: { id: params.id },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead non trouvé' }, { status: 404 });
    }

    // Action: S'attribuer le lead
    if (action === 'assign' || assignedToId) {
      const userId = assignedToId || session.user.id;

      // Vérifier que le lead est libre
      if (lead.status !== 'LIBRE') {
        return NextResponse.json(
          { error: 'Ce lead est déjà attribué' },
          { status: 400 }
        );
      }

      // Parser le nom complet pour extraire prénom et nom
      const nameParts = (lead.fullName || 'Lead Meta').split(' ');
      const firstName = nameParts[0] || 'Lead';
      const lastName = nameParts.slice(1).join(' ') || 'Meta';

      // Créer une company (pour pouvoir renseigner le SIREN plus tard)
      const companyId = `COMPANY-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      await prisma.companies.create({
        data: {
          id: companyId,
          name: lead.fullName || 'Entreprise sans nom',
          phone: lead.phone,
          email: lead.email,
          // siret sera renseigné manuellement plus tard
          updatedAt: new Date(),
        },
      });

      // Créer un contact lié à la company
      const contactId = `CONTACT-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      await prisma.contacts.create({
        data: {
          id: contactId,
          firstName,
          lastName,
          email: lead.email,
          phone: lead.phone,
          status: 'LEAD',
          source: 'Meta Ads',
          assignedToId: userId,
          companyId: companyId,
          updatedAt: new Date(),
        },
      });

      // Créer automatiquement un deal lié à la company
      const dealId = `DEAL-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      await prisma.deals.create({
        data: {
          id: dealId,
          title: lead.fullName || 'Lead Meta',
          description: `Lead provenant de Meta Ads${lead.formName ? ` - Formulaire: ${lead.formName}` : ''}${lead.campaignName ? ` - Campagne: ${lead.campaignName}` : ''}`,
          value: 0,
          currency: 'EUR',
          stage: 'A_CONTACTER',
          probability: 10,
          ownerId: userId,
          origin: 'ADS',
          contactId: contactId,
          companyId: companyId,
          comments: lead.email ? `Email: ${lead.email}` : null,
          updatedAt: new Date(),
        },
      });

      // Mettre à jour le lead
      const updatedLead = await prisma.meta_leads.update({
        where: { id: params.id },
        data: {
          assignedToId: userId,
          status: 'CONVERTI',
          convertedToDeal: true,
          dealId: dealId,
        },
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
      });

      return NextResponse.json({
        success: true,
        lead: updatedLead,
        deal: { id: dealId },
        message: 'Lead attribué et deal créé avec succès',
      });
    }

    return NextResponse.json(
      { error: 'Action non reconnue' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Erreur PATCH /api/meta-leads/[id]:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du lead' },
      { status: 500 }
    );
  }
}

// DELETE /api/meta-leads/[id] - Supprimer un lead (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    await prisma.meta_leads.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Lead supprimé' });
  } catch (error) {
    console.error('Erreur DELETE /api/meta-leads/[id]:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du lead' },
      { status: 500 }
    );
  }
}
