import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

type StatusState = 'idle' | 'loading' | 'success' | 'error';

const statusConfig: Record<StatusState, { bg: string; text: string; label: string; dot: string }> = {
  idle: { bg: 'bg-neutral-100 dark:bg-neutral-800', text: 'text-neutral-600 dark:text-neutral-400', label: 'Draft', dot: 'bg-neutral-400' },
  loading: { bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', label: 'Saving...', dot: 'bg-amber-500 animate-pulse' },
  success: { bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', label: 'Saved!', dot: 'bg-emerald-500' },
  error: { bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: 'Error', dot: 'bg-red-500' },
};

interface StatusPillProps {
  status: StatusState;
  className?: string;
}

export function StatusPill({ status, className = '' }: StatusPillProps) {
  const config = statusConfig[status];

  return React.createElement(
    'div',
    {
      className: `inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text} transition-colors duration-300 ${className}`,
    },
    React.createElement('span', { className: `w-1.5 h-1.5 rounded-full ${config.dot}` }),
    React.createElement(AnimatePresence, { mode: 'wait', initial: false },
      React.createElement(motion.span, {
        key: status,
        initial: { opacity: 0, y: 4 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -4 },
        transition: { duration: 0.2 },
      }, config.label)
    )
  );
}
