import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Check, Copy, Plus, ExternalLink } from 'lucide-react';
import { useClipboard } from '../hooks/useClipboard';

export function SuccessPage() {
  const { id } = useParams<{ id: string }>();
  const { copied, copy } = useClipboard();

  // Debug log to trace the id value
  useEffect(() => {
    console.log('[SuccessPage] id from route params:', id);
  }, [id]);

  // Build share URL using the hash fragment (correct for hash routing)
  // window.location.hash contains the current route like #/success/v2_...
  // We construct: origin + pathname + #/letter/<id>
  const shareUrl = id
    ? `${window.location.origin}${window.location.pathname}#/letter/${id}`
    : '';

  if (!id) {
    return React.createElement('div', {
      className: 'max-w-xl mx-auto px-6 py-16 flex flex-col items-center text-center gap-8 w-full',
    },
      React.createElement('h1', { className: 'font-serif text-2xl font-medium text-neutral-800 dark:text-neutral-200' },
        'Something went wrong'
      ),
      React.createElement('p', { className: 'text-neutral-500 dark:text-neutral-400 text-sm' },
        'Could not generate the share link. Please try creating your letter again.'
      ),
      React.createElement(Link, {
        to: '/compose',
        className: 'px-6 py-3 rounded-full bg-gradient-to-r from-rose-400 to-pink-500 text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all hover:scale-105',
      }, 'Write a Letter')
    );
  }

  return React.createElement(motion.div, {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    className: 'max-w-xl mx-auto px-6 py-16 flex flex-col items-center text-center gap-8 w-full',
  },
    // Success icon
    React.createElement('div', {
      className: 'w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center border border-emerald-100 dark:border-emerald-800/30 text-emerald-500 animate-bounce',
    },
      React.createElement(Check, { className: 'w-8 h-8 text-emerald-600 dark:text-emerald-400' })
    ),

    // Heading
    React.createElement('div', { className: 'flex flex-col gap-3' },
      React.createElement('h1', { className: 'font-serif text-3xl font-medium text-neutral-800 dark:text-neutral-200' },
        'Your letter is posted!'
      ),
      React.createElement('p', { className: 'text-neutral-500 dark:text-neutral-400 text-sm max-w-sm' },
        'It is beautifully sealed in a digital envelope. Send the shareable link below to your beloved.'
      )
    ),

    // Share URL box
    React.createElement('div', {
      className: 'w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 flex flex-col gap-3',
    },
      React.createElement('span', {
        className: 'text-[10px] font-mono text-neutral-400 dark:text-neutral-500 uppercase tracking-widest self-start',
      }, 'Shareable URL'),
      React.createElement('div', {
        className: 'flex items-center gap-2 bg-white dark:bg-neutral-800 border border-neutral-150 dark:border-neutral-700 rounded-xl p-2.5 shadow-inner',
      },
        React.createElement('input', {
          type: 'text',
          readOnly: true,
          value: shareUrl,
          onClick: (e: React.MouseEvent<HTMLInputElement>) => (e.target as HTMLInputElement).select(),
          onFocus: (e: React.FocusEvent<HTMLInputElement>) => e.target.select(),
          className: 'flex-1 text-xs text-neutral-600 dark:text-neutral-300 bg-transparent focus:outline-none font-mono truncate',
        }),
        React.createElement('button', {
          onClick: () => copy(shareUrl),
          className: `inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 shrink-0 cursor-pointer ${
            copied
              ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100'
          }`,
        },
          copied
            ? React.createElement(React.Fragment, null,
                React.createElement(Check, { className: 'w-3.5 h-3.5' }),
                'Copied!'
              )
            : React.createElement(React.Fragment, null,
                React.createElement(Copy, { className: 'w-3.5 h-3.5' }),
                'Copy'
              )
        )
      )
    ),

    // Action buttons
    React.createElement('div', { className: 'flex flex-col sm:flex-row items-center gap-3 w-full' },
      React.createElement(Link, {
        to: `/letter/${id}`,
        className: 'w-full sm:flex-1 py-3 px-6 rounded-full text-sm font-semibold bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 transition shadow-sm hover:shadow flex items-center justify-center gap-1.5',
      },
        'View Public Page',
        React.createElement(ExternalLink, { className: 'w-4 h-4' })
      ),
      React.createElement(Link, {
        to: '/compose',
        className: 'w-full sm:flex-1 py-3 px-6 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600 transition shadow-md hover:shadow-lg flex items-center justify-center gap-1.5',
      },
        React.createElement(Plus, { className: 'w-4 h-4' }),
        'Write Another'
      )
    )
  );
}
