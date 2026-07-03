import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, PenTool } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    to?: string;
    onClick?: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return React.createElement('div', {
    className: 'text-center py-16 border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-3xl flex flex-col items-center gap-4 bg-neutral-50/50 dark:bg-neutral-900/50',
  },
    icon || React.createElement(BookOpen, { className: 'w-10 h-10 text-neutral-300 dark:text-neutral-600' }),
    React.createElement('h3', { className: 'font-serif text-xl font-medium text-neutral-700 dark:text-neutral-300' }, title),
    description && React.createElement('p', { className: 'text-neutral-500 dark:text-neutral-400 text-sm max-w-sm leading-relaxed' }, description),
    action && (action.to
      ? React.createElement(Link, {
          to: action.to,
          className: 'inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-rose-400 to-pink-500 text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all hover:scale-105',
        },
          React.createElement(PenTool, { className: 'w-4 h-4' }),
          action.label
        )
      : React.createElement('button', {
          onClick: action.onClick,
          className: 'px-5 py-2.5 rounded-full bg-gradient-to-r from-rose-400 to-pink-500 text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all hover:scale-105 cursor-pointer',
        }, action.label)
    )
  );
}
