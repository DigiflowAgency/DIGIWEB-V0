'use client';

import { useParams } from 'next/navigation';
import KanbanBoard from '@/components/projects/kanban/KanbanBoard';

export default function BoardPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  return (
    <div className="h-[calc(100vh-180px)]">
      <KanbanBoard projectId={projectId} />
    </div>
  );
}
