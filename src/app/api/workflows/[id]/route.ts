import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT /api/workflows/[id] - Mettre à jour un workflow
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const { id } = params;

    const workflow = await prisma.workflows.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.trigger && { trigger: data.trigger }),
        ...(data.config && { config: JSON.stringify(data.config) }),
        ...(data.actionsCount !== undefined && { actionsCount: data.actionsCount }),
        ...(data.status && { status: data.status }),
        ...(data.executions !== undefined && { executions: data.executions }),
        ...(data.successRate !== undefined && { successRate: data.successRate }),
        ...(data.lastRunAt && { lastRunAt: new Date(data.lastRunAt) }),
      },
    });

    return NextResponse.json(workflow);
  } catch (error) {
    console.error('Error updating workflow:', error);
    return NextResponse.json(
      { error: 'Failed to update workflow' },
      { status: 500 }
    );
  }
}

// DELETE /api/workflows/[id] - Supprimer un workflow
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    await prisma.workflows.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Workflow deleted successfully' });
  } catch (error) {
    console.error('Error deleting workflow:', error);
    return NextResponse.json(
      { error: 'Failed to delete workflow' },
      { status: 500 }
    );
  }
}
