import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT /api/sequences/[id] - Mettre à jour une séquence
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const { id } = params;

    const sequence = await prisma.sequences.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.emailsCount !== undefined && { emailsCount: data.emailsCount }),
        ...(data.config && { config: JSON.stringify(data.config) }),
        ...(data.status && { status: data.status }),
        ...(data.enrolled !== undefined && { enrolled: data.enrolled }),
        ...(data.completed !== undefined && { completed: data.completed }),
        ...(data.openRate !== undefined && { openRate: data.openRate }),
        ...(data.replyRate !== undefined && { replyRate: data.replyRate }),
        ...(data.lastRunAt && { lastRunAt: new Date(data.lastRunAt) }),
      },
    });

    return NextResponse.json(sequence);
  } catch (error) {
    console.error('Error updating sequence:', error);
    return NextResponse.json(
      { error: 'Failed to update sequence' },
      { status: 500 }
    );
  }
}

// DELETE /api/sequences/[id] - Supprimer une séquence
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    await prisma.sequences.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Sequence deleted successfully' });
  } catch (error) {
    console.error('Error deleting sequence:', error);
    return NextResponse.json(
      { error: 'Failed to delete sequence' },
      { status: 500 }
    );
  }
}
