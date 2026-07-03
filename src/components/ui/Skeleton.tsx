import React from 'react';

interface SkeletonProps {
  variant?: 'text' | 'card' | 'avatar' | 'button' | 'envelope';
  className?: string;
}

const baseClasses = 'bg-neutral-200 dark:bg-neutral-700 animate-shimmer rounded-lg';

const variantClasses: Record<string, string> = {
  text: 'h-4 w-full',
  card: 'h-48 w-full rounded-2xl',
  avatar: 'h-10 w-10 rounded-full',
  button: 'h-10 w-32 rounded-full',
  envelope: 'h-56 w-80 rounded-2xl',
};

export function Skeleton({ variant = 'text', className = '' }: SkeletonProps) {
  return React.createElement('div', {
    className: `${baseClasses} ${variantClasses[variant] || variantClasses.text} ${className}`,
  });
}

export function SkeletonGroup({ count = 3, variant = 'card' }: { count?: number; variant?: SkeletonProps['variant'] }) {
  return React.createElement('div', { className: 'flex flex-col gap-4' },
    ...Array.from({ length: count }, (_, i) =>
      React.createElement(Skeleton, { key: i, variant })
    )
  );
}
