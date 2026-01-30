'use client';

import type { ProjectUser } from '@/types/projects';
import { getInitials, getAvatarColor } from '@/lib/projects/utils';

interface MemberAvatarProps {
  user: ProjectUser;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}

export default function MemberAvatar({ user, size = 'md', showName = false }: MemberAvatarProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center text-white font-medium ${getAvatarColor(user.id)}`}
        title={`${user.firstName} ${user.lastName}`}
      >
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={`${user.firstName} ${user.lastName}`}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          getInitials(user.firstName, user.lastName)
        )}
      </div>
      {showName && (
        <span className="text-sm text-gray-700">
          {user.firstName} {user.lastName}
        </span>
      )}
    </div>
  );
}
