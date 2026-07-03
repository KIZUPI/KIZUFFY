import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Eye, Send, Loader2 } from 'lucide-react';
import { useDraft } from '../context/DraftContext';
import { THEMES } from '../types';
import { LetterReaderPage } from './LetterReaderPage';

interface PreviewPageProps {
  onPublish?: () => void;
  isPublishing?: boolean;
}

export function PreviewPage({ onPublish, isPublishing = false }: PreviewPageProps) {
  const { draft } = useDraft();
  const navigate = useNavigate();

  const themeConfig = THEMES[draft.theme] || THEMES.romantic;

  return React.createElement(motion.div, {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.98 },
    className: 'max-w-4xl mx-auto px-4 sm:px-6 py-10 w-full flex flex-col gap-6',
  },
    React.createElement('div', { className: 'flex items-center justify-between' },
      React.createElement(Link, { to: '/compose', className: 'flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 text-sm font-medium transition' },
        React.createElement(ArrowLeft, { className: 'w-4 h-4' }),
        'Edit Draft'
      ),
      React.createElement('span', { className: 'text-xs bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/30 text-rose-600 dark:text-rose-400 px-3 py-1 rounded-full font-semibold' },
        'Preview Mode'
      )
    ),

    React.createElement('div', { className: 'bg-neutral-100/40 dark:bg-neutral-900/40 p-4 md:p-8 rounded-3xl border border-neutral-200/50 dark:border-neutral-700/50 flex flex-col gap-6' },
      React.createElement('p', { className: 'text-center text-xs text-neutral-400 dark:text-neutral-500 font-mono tracking-widest uppercase' },
        'How your letter will look to your reader:'
      ),
      React.createElement('div', { className: 'border border-neutral-200/60 dark:border-neutral-700/60 rounded-2xl bg-white dark:bg-neutral-900 shadow-inner p-6 flex items-center justify-center min-h-[500px] overflow-hidden' },
        React.createElement(LetterReaderPage, { isPreview: true, previewData: draft })
      )
    ),

    React.createElement('div', { className: 'flex justify-end gap-3' },
      React.createElement(Link, { to: '/compose', className: 'px-6 py-3 rounded-full border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-sm font-semibold transition flex items-center gap-2' },
        'Back to Editor'
      ),
      React.createElement('button', {
        onClick: onPublish || (() => navigate('/compose')),
        disabled: isPublishing,
        className: `px-8 py-3 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600 transition shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`,
      },
        isPublishing
          ? React.createElement(React.Fragment, null, React.createElement(Loader2, { className: 'w-4 h-4 animate-spin' }), 'Posting...')
          : React.createElement(React.Fragment, null, React.createElement(Send, { className: 'w-4 h-4' }), 'Publish & Get Share Link')
      )
    )
  );
}
