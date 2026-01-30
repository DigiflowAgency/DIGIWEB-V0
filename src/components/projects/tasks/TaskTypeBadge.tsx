'use client';

import type { TaskType } from '@/types/projects';
import { getTaskTypeColor, getTaskTypeLabel, getTaskTypeIcon } from '@/lib/projects/utils';

interface TaskTypeBadgeProps {
  type: TaskType;
  showIcon?: boolean;
  size?: 'sm' | 'md';
}

export default function TaskTypeBadge({ type, showIcon = true, size = 'sm' }: TaskTypeBadgeProps) {
  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-sm';

  return (
    <span className={`rounded-full font-medium inline-flex items-center gap-1 ${sizeClasses} ${getTaskTypeColor(type)}`}>
      {showIcon && <span>{getTaskTypeIcon(type)}</span>}
      {getTaskTypeLabel(type)}
    </span>
  );
}
