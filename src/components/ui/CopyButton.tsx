import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Copy, Check } from 'lucide-react';
import { useClipboard } from '../../hooks/useClipboard';

interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
}

export function CopyButton({ text, label = 'Copy', className = '' }: CopyButtonProps) {
  const { copied, copy } = useClipboard();

  return React.createElement(
    'button',
    {
      onClick: (e: React.MouseEvent) => { e.stopPropagation(); copy(text); },
      className: `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${copied ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'} cursor-pointer ${className}`,
    },
    React.createElement(AnimatePresence, { mode: 'wait', initial: false },
      copied
        ? React.createElement(motion.span, {
            key: 'copied',
            initial: { scale: 0.5, opacity: 0 },
            animate: { scale: 1, opacity: 1 },
            exit: { scale: 0.5, opacity: 0 },
            transition: { type: 'spring', stiffness: 500, damping: 30 },
            className: 'flex items-center gap-1',
          },
            React.createElement(Check, { className: 'w-3.5 h-3.5' }),
            'Copied!'
          )
        : React.createElement(motion.span, {
            key: 'copy',
            initial: { scale: 0.5, opacity: 0 },
            animate: { scale: 1, opacity: 1 },
            exit: { scale: 0.5, opacity: 0 },
            className: 'flex items-center gap-1',
          },
            React.createElement(Copy, { className: 'w-3.5 h-3.5' }),
            label
          )
    )
  );
}
