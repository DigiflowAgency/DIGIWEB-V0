import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT /api/prospects/[id] - Mettre à jour un prospect (ex: marquer comme importé)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const { id } = params;

    const prospect = await prisma.prospect.update({
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
        ...(data.imported !== undefined && {
          imported: data.imported,
          importedAt: data.imported ? new Date() : null,
        }),
        ...(data.contactId && { contactId: data.contactId }),
        ...(data.companyId && { companyId: data.companyId }),
      },
    });

    return NextResponse.json(prospect);
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

    await prisma.prospect.delete({
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
