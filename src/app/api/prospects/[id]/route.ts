import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Statuts qui déclenchent la création d'un deal
const DEAL_STAGES = ['A_CONTACTER', 'EN_DISCUSSION', 'A_RELANCER', 'RDV_PRIS', 'NEGO_HOT'];

// Probabilités par stage
const STAGE_PROBABILITIES: Record<string, number> = {
  A_CONTACTER: 10,
  EN_DISCUSSION: 30,
  A_RELANCER: 20,
  RDV_PRIS: 50,
  NEGO_HOT: 70,
};

// PUT /api/prospects/[id] - Mettre à jour un prospect
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const data = await request.json();
    const { id } = params;

    // Récupérer le prospect actuel pour vérifier s'il est déjà converti
    const currentProspect = await prisma.prospects.findUnique({
      where: { id },
    });

    if (!currentProspect) {
      return NextResponse.json({ error: 'Prospect non trouvé' }, { status: 404 });
    }

    // Vérifier si on doit créer un deal (nouveau statut deal + pas encore converti)
    const newStatus = data.status;
    const shouldCreateDeal = newStatus &&
      DEAL_STAGES.includes(newStatus) &&
      !currentProspect.convertedToDeal;

    // Mettre à jour le prospect
    const prospect = await prisma.prospects.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.activity && { activity: data.activity }),
        ...(data.address && { address: data.address }),
        ...(data.city && { city: data.city }),
        ...(data.phone && { phone: data.phone }),
        ...(data.email && { email: data.email }),
        ...(data.website !== undefined && { website: data.website }),
        ...(data.employees !== undefined && { employees: data.employees }),
        ...(data.rating !== undefined && { rating: data.rating }),
        ...(data.status && { status: data.status }),
        ...(data.assignedToId !== undefined && { assignedToId: data.assignedToId }),
        ...(data.contactId && { contactId: data.contactId }),
        ...(data.companyId && { companyId: data.companyId }),
        ...(shouldCreateDeal && {
          convertedToDeal: true,
          convertedAt: new Date(),
        }),
        updatedAt: new Date(),
      },
    });

    // Créer le deal si nécessaire
    let createdDeal = null;
    if (shouldCreateDeal) {
      const dealOwnerId = data.assignedToId || currentProspect.assignedToId || session.user.id;
      createdDeal = await prisma.deals.create({
        data: {
          id: `DEAL-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          title: prospect.name,
          description: `Prospect converti: ${prospect.activity}`,
          value: 0,
          currency: 'EUR',
          stage: newStatus as any,
          probability: STAGE_PROBABILITIES[newStatus] || 10,
          ownerId: dealOwnerId,
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      prospect,
      deal: createdDeal,
      dealCreated: shouldCreateDeal
    });
  } catch (error) {
    console.error('Error updating prospect:', error);
    return NextResponse.json(
      { error: 'Failed to update prospect' },
      { status: 500 }
    );
  }
}

// DELETE /api/prospects/[id] - Supprimer un prospect
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    await prisma.prospects.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Prospect deleted successfully' });
  } catch (error) {
    console.error('Error deleting prospect:', error);
    return NextResponse.json(
      { error: 'Failed to delete prospect' },
      { status: 500 }
    );
  }
}
