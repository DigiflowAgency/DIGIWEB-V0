'use client';

import type { TaskPriority } from '@/types/projects';
import { getTaskPriorityColor, getTaskPriorityLabel } from '@/lib/projects/utils';

interface TaskPriorityBadgeProps {
  priority: TaskPriority;
  size?: 'sm' | 'md';
}

export default function TaskPriorityBadge({ priority, size = 'sm' }: TaskPriorityBadgeProps) {
  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-sm';

  return (
    <span className={`rounded-full font-medium ${sizeClasses} ${getTaskPriorityColor(priority)}`}>
      {getTaskPriorityLabel(priority)}
    </span>
  );
}
