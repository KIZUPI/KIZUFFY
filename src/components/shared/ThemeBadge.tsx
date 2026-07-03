import React from 'react';
import { THEMES, type ThemeKey } from '../../types';

interface ThemeBadgeProps {
  theme: ThemeKey;
  className?: string;
}

export function ThemeBadge({ theme, className = '' }: ThemeBadgeProps) {
  const config = THEMES[theme] || THEMES.romantic;
  return React.createElement('span', {
    className: `inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${config.badge} ${className}`,
  },
    React.createElement('span', {
      className: 'w-2 h-2 rounded-full',
      style: { backgroundColor: config.heartColor },
    }),
    config.name
  );
}
