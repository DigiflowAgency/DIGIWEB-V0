import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT /api/dashboards/[id] - Mettre à jour un dashboard
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, description, favorite } = body;

    const dashboard = await prisma.custom_dashboards.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(favorite !== undefined && { favorite }),
      },
    });

    return NextResponse.json(dashboard);
  } catch (error) {
    console.error('Error updating dashboard:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du dashboard' },
      { status: 500 }
    );
  }
}

// DELETE /api/dashboards/[id] - Supprimer un dashboard
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    await prisma.custom_dashboards.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting dashboard:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du dashboard' },
      { status: 500 }
    );
  }
}
