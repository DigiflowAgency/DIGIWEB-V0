'use client';

import type { ImprovementStatus } from '@/types/projects';
import {
  FileEdit,
  Send,
  Search,
  HelpCircle,
  CheckCircle,
  XCircle,
  Rocket,
} from 'lucide-react';

interface ProposalStatusBadgeProps {
  status: ImprovementStatus;
  size?: 'sm' | 'md';
}

const statusConfig: Record<
  ImprovementStatus,
  {
    label: string;
    bgColor: string;
    textColor: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  DRAFT: {
    label: 'Brouillon',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    icon: FileEdit,
  },
  SUBMITTED: {
    label: 'Soumise',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    icon: Send,
  },
  UNDER_REVIEW: {
    label: 'En examen',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-700',
    icon: Search,
  },
  INFO_REQUESTED: {
    label: 'Info demandée',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-700',
    icon: HelpCircle,
  },
  APPROVED: {
    label: 'Approuvée',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    icon: CheckCircle,
  },
  REJECTED: {
    label: 'Refusée',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    icon: XCircle,
  },
  IMPLEMENTED: {
    label: 'Implémentée',
    bgColor: 'bg-violet-100',
    textColor: 'text-violet-700',
    icon: Rocket,
  },
};

export default function ProposalStatusBadge({ status, size = 'md' }: ProposalStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${config.bgColor} ${config.textColor} ${sizeClasses}`}
    >
      <Icon className={iconSize} />
      {config.label}
    </span>
  );
}
