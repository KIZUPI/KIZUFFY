import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Play, Pause, RotateCcw, Check, Mail, ShieldAlert, Loader2 } from 'lucide-react';
import { getLetterById } from '../lib/supabase';
import { decodeLetter } from '../lib/utils';
import { useAutoScroll } from '../hooks/useAutoScroll';
import { THEMES, type ThemeKey, type Letter } from '../types';

interface LetterReaderPageProps {
  isPreview?: boolean;
  previewData?: { title: string; recipient: string; sender: string; body: string; theme: ThemeKey };
}

export function LetterReaderPage({ isPreview = false, previewData }: LetterReaderPageProps) {
  const { id: urlId } = useParams<{ id: string }>();
  const base64 = urlId;

  const [isOpen, setIsOpen] = useState(false);
  const [sparks, setSparks] = useState<{ id: number; x: number; y: number; delay: number }[]>([]);
  const [dbLetter, setDbLetter] = useState<{ title: string; recipient: string; sender: string; body: string; theme: ThemeKey } | null>(null);
  const [loading, setLoading] = useState(!isPreview);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { containerRef, isScrolling, hasFinished, scrollSpeed, setScrollSpeed, setIsScrolling, resetScroll } = useAutoScroll();

  // ── Fetch / decode letter ────────────────────────────
  useEffect(() => {
    if (isPreview) { setLoading(false); return; }
    if (!base64) { setLoading(false); setErrorMsg('No letter ID was specified.'); return; }

    const legacyDecoded = decodeLetter(base64);
    if (legacyDecoded) { setDbLetter(legacyDecoded); setLoading(false); return; }

    setLoading(true);
    getLetterById(base64)
      .then(letter => {
        if (letter) {
          setDbLetter({ title: letter.title, recipient: letter.recipient, sender: letter.sender, body: letter.body, theme: letter.theme });
        } else {
          setErrorMsg('This letter was not found.');
        }
      })
      .catch(() => setErrorMsg('Unable to load this letter.'))
      .finally(() => setLoading(false));
  }, [base64, isPreview]);

  const letter = isPreview ? previewData || null : dbLetter;

  // ── Open envelope ────────────────────────────────────
  const openLetter = useCallback(() => {
    if (isOpen) return;
    setIsOpen(true);
    const newSparks = Array.from({ length: 15 }, (_, i) => ({
      id: Math.random() + i,
      x: (Math.random() - 0.5) * 200,
      y: (Math.random() - 0.5) * 200 - 50,
      delay: Math.random() * 0.2,
    }));
    setSparks(newSparks);
    setTimeout(() => setIsScrolling(true), 1800);
  }, [isOpen, setIsScrolling]);

  // ── Loading state ────────────────────────────────────
  if (loading) {
    return React.createElement('div', { className: 'flex-grow w-full flex flex-col items-center justify-center min-h-screen bg-rose-50/20 dark:bg-rose-950/10 gap-4' },
      React.createElement('div', { className: 'relative flex items-center justify-center' },
        React.createElement(Heart, { className: 'w-12 h-12 text-rose-500 fill-rose-500/10 animate-ping absolute' }),
        React.createElement(Heart, { className: 'w-12 h-12 text-rose-500 fill-rose-500/20' })
      ),
      React.createElement('span', { className: 'text-sm text-rose-500/80 dark:text-rose-400/80 font-serif font-medium tracking-wide' }, 'Retrieving letter...')
    );
  }

  // ── Error state ──────────────────────────────────────
  if (errorMsg) {
    return React.createElement('div', { className: 'flex-grow w-full flex flex-col items-center justify-center min-h-screen bg-neutral-50 dark:bg-neutral-950 gap-6 px-6 text-center' },
      React.createElement('div', { className: 'w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center border border-red-100 dark:border-red-800/30 text-red-500' },
        React.createElement(ShieldAlert, { className: 'w-8 h-8' })
      ),
      React.createElement('h2', { className: 'font-serif text-2xl font-semibold text-neutral-800 dark:text-neutral-200' }, 'Secure digital envelope'),
      React.createElement('p', { className: 'text-neutral-500 dark:text-neutral-400 text-sm max-w-md' }, errorMsg),
      React.createElement(Link, { to: '/', className: 'px-6 py-2.5 rounded-full bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-semibold transition shadow-sm' },
        'Go to Home'
      )
    );
  }

  // ── Not found ────────────────────────────────────────
  if (!letter) {
    return React.createElement('div', { className: 'flex-grow flex flex-col items-center justify-center p-8 text-center gap-4' },
      React.createElement(Mail, { className: 'w-12 h-12 text-neutral-300 dark:text-neutral-600 animate-pulse' }),
      React.createElement('h2', { className: 'font-serif text-2xl text-neutral-800 dark:text-neutral-200' }, 'Letter Not Found'),
      React.createElement('p', { className: 'text-sm text-neutral-500 dark:text-neutral-400 max-w-sm' }, 'The link might be broken or incomplete.'),
      React.createElement(Link, { to: '/', className: 'px-6 py-2.5 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold transition shadow-sm' },
        'Go to Letter Poster'
      )
    );
  }

  const themeConfig = THEMES[letter.theme as ThemeKey] || THEMES.romantic;

  // ── Render ────────────────────────────────────────────
  return React.createElement('div', {
    className: `flex-grow w-full flex flex-col items-center justify-center p-4 md:p-8 min-h-screen overflow-hidden transition-colors duration-1000 ${themeConfig.bg}`,
  },
    // Background sparkles
    !isPreview && React.createElement('div', { className: 'absolute inset-0 pointer-events-none opacity-20 overflow-hidden' },
      React.createElement('div', { className: 'absolute top-1/4 left-1/4 w-4 h-4 bg-rose-300 dark:bg-rose-700 rounded-full blur-xs animate-bounce', style: { animationDuration: '6s' } }),
      React.createElement('div', { className: 'absolute top-1/3 right-1/4 w-3 h-3 bg-amber-200 dark:bg-amber-700 rounded-full blur-xs animate-bounce', style: { animationDuration: '8s' } }),
      React.createElement('div', { className: 'absolute bottom-1/4 right-1/3 w-5 h-5 bg-violet-300 dark:bg-violet-700 rounded-full blur-xs animate-bounce', style: { animationDuration: '10s' } })
    ),

    React.createElement('div', { className: 'w-full max-w-xl relative flex flex-col items-center justify-center' },
      React.createElement(AnimatePresence, { mode: 'wait' },

        !isOpen
          // ═══ CLOSED ENVELOPE ═══════════════════════════════
          ? React.createElement(motion.div, {
              key: 'closed-envelope',
              initial: { scale: 0.9, opacity: 0 },
              animate: { scale: 1, opacity: 1 },
              exit: { scale: 0.8, opacity: 0 },
              transition: { type: 'spring', damping: 20 },
              className: 'flex flex-col items-center gap-8 cursor-pointer relative',
              onClick: openLetter,
            },
              React.createElement('div', { className: 'text-center flex flex-col gap-2' },
                React.createElement('span', { className: 'text-xs uppercase font-mono tracking-widest text-neutral-500 dark:text-neutral-400' }, 'You received a letter'),
                React.createElement('h2', { className: 'font-serif text-xl font-medium text-neutral-800 dark:text-neutral-200' },
                  'From: ', React.createElement('span', { className: 'text-rose-600 dark:text-rose-400 font-semibold' }, letter.sender)
                )
              ),

              // Envelope
              React.createElement('div', { className: 'relative w-72 sm:w-96 h-48 sm:h-56 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-xl flex items-center justify-center group overflow-hidden' },
                React.createElement('div', { className: 'absolute inset-0 bg-gradient-to-tr from-neutral-50 to-neutral-100/30 dark:from-neutral-800 dark:to-neutral-800/30' }),
                // Envelope folds
                React.createElement('div', { className: 'absolute top-0 left-0 w-0 h-0 border-t-[96px] sm:border-t-[110px] border-t-neutral-100 dark:border-t-neutral-700 border-r-[144px] sm:border-r-[192px] border-r-transparent pointer-events-none opacity-40' }),
                React.createElement('div', { className: 'absolute top-0 right-0 w-0 h-0 border-t-[96px] sm:border-t-[110px] border-t-neutral-100 dark:border-t-neutral-700 border-l-[144px] sm:border-l-[192px] border-l-transparent pointer-events-none opacity-40' }),
                React.createElement('div', { className: 'absolute bottom-0 inset-x-0 h-28 sm:h-32 bg-neutral-50 dark:bg-neutral-800 border-t border-neutral-200/80 dark:border-neutral-700/80 rounded-b-2xl flex items-end justify-center p-4' }),

                // Heart seal
                React.createElement(motion.div, {
                  className: 'absolute z-10 flex flex-col items-center gap-2',
                  whileHover: { scale: 1.15 },
                  whileTap: { scale: 0.9 },
                },
                  React.createElement('div', { className: 'w-16 h-16 rounded-full bg-white dark:bg-neutral-900 flex items-center justify-center shadow-lg border border-neutral-150 dark:border-neutral-700 relative' },
                    React.createElement('div', { className: 'absolute inset-0 rounded-full bg-rose-100 dark:bg-rose-900/30 animate-ping opacity-30' }),
                    React.createElement(Heart, { className: 'w-8 h-8 drop-shadow-sm', style: { color: themeConfig.heartColor, fill: themeConfig.heartColor } })
                  )
                )
              ),

              React.createElement('div', { className: 'text-center text-xs text-neutral-400 dark:text-neutral-500 font-medium animate-pulse' },
                'Click the heart to open & reveal'
              )
            )

          // ═══ OPENED LETTER ═════════════════════════════════
          : React.createElement(motion.div, {
              key: 'opened-letter',
              initial: { opacity: 0, y: 100 },
              animate: { opacity: 1, y: 0 },
              transition: { delay: 0.4, duration: 1, ease: 'easeOut' },
              className: 'w-full flex flex-col gap-6',
            },
              // Floating hearts
              ...sparks.map(spark =>
                React.createElement(motion.div, {
                  key: spark.id,
                  initial: { x: 0, y: 0, opacity: 1, scale: 1 },
                  animate: { x: spark.x, y: spark.y, opacity: 0, scale: 0.3 },
                  transition: { delay: spark.delay, duration: 1.2, ease: 'easeOut' },
                  className: 'absolute z-30 pointer-events-none',
                  style: { top: '35%', left: '50%' },
                },
                  React.createElement(Heart, { className: 'w-4 h-4', style: { color: themeConfig.heartColor, fill: themeConfig.heartColor } })
                )
              ),

              // Scrollable letter card
              React.createElement('div', { className: `w-full h-[480px] rounded-3xl ${themeConfig.paper} shadow-2xl flex flex-col overflow-hidden relative` },
                React.createElement('div', { className: 'absolute inset-0 bg-noise opacity-[0.03] pointer-events-none' }),
                React.createElement('div', { className: 'absolute top-0 inset-x-0 h-4 bg-gradient-to-b from-white/80 dark:from-neutral-900/80 to-transparent pointer-events-none z-10' }),

                React.createElement('div', {
                  ref: containerRef,
                  className: 'flex-1 overflow-y-auto px-6 md:px-10 py-12 flex flex-col gap-8 no-scrollbar',
                },
                  // Title
                  React.createElement('div', { className: 'border-b border-neutral-100 dark:border-neutral-700 pb-4 flex flex-col gap-2 mt-4' },
                    React.createElement('div', { className: 'flex justify-between text-xs text-neutral-400 dark:text-neutral-500 font-mono' },
                      React.createElement('span', null, 'Dearest ', letter.recipient)
                    ),
                    React.createElement('h1', { className: `font-serif text-2xl font-medium tracking-tight ${themeConfig.titleColor}` },
                      letter.title || 'A gentle letter'
                    )
                  ),

                  // Body
                  React.createElement('div', { className: `font-serif text-sm md:text-base leading-[1.8] whitespace-pre-wrap ${themeConfig.text} tracking-wide opacity-90` },
                    letter.body
                  ),

                  // Signature
                  React.createElement('div', { className: 'mt-8 border-t border-neutral-100 dark:border-neutral-700 pt-6 flex flex-col gap-1 items-end' },
                    React.createElement('span', { className: 'text-xs text-neutral-400 dark:text-neutral-500 font-mono italic' }, 'Written with love,'),
                    React.createElement('span', { className: 'font-serif font-semibold text-lg text-neutral-800 dark:text-neutral-200 italic pr-2' }, letter.sender)
                  )
                ),

                React.createElement('div', { className: 'absolute bottom-0 inset-x-0 h-4 bg-gradient-to-t from-white/80 dark:from-neutral-900/80 to-transparent pointer-events-none z-10' })
              ),

              // Playback controls
              React.createElement('div', { className: 'bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xs border border-neutral-150 dark:border-neutral-700 rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md text-xs z-20' },
                React.createElement('div', { className: 'flex items-center justify-between sm:justify-start w-full sm:w-auto gap-3' },
                  React.createElement('div', { className: 'flex items-center gap-3' },
                    React.createElement('button', {
                      onClick: () => setIsScrolling(!isScrolling),
                      className: 'w-10 h-10 rounded-full bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-100 text-white dark:text-neutral-900 flex items-center justify-center transition cursor-pointer',
                      title: isScrolling ? 'Pause' : 'Play',
                    },
                      isScrolling ? React.createElement(Pause, { className: 'w-4 h-4 fill-white dark:fill-neutral-900' }) : React.createElement(Play, { className: 'w-4 h-4 fill-white dark:fill-neutral-900 ml-0.5' })
                    ),
                    React.createElement('button', {
                      onClick: resetScroll,
                      className: 'w-8 h-8 rounded-full border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 flex items-center justify-center transition cursor-pointer',
                      title: 'Restart',
                    },
                      React.createElement(RotateCcw, { className: 'w-4 h-4' })
                    )
                  ),
                  React.createElement('span', { className: 'text-neutral-500 dark:text-neutral-400 font-medium' },
                    hasFinished
                      ? React.createElement('span', { className: 'text-emerald-600 dark:text-emerald-400 flex items-center gap-1' }, React.createElement(Check, { className: 'w-3.5 h-3.5' }), 'Finished')
                      : isScrolling
                        ? React.createElement('span', { className: 'flex items-center gap-1.5 text-neutral-400' }, React.createElement('span', { className: 'w-2 h-2 rounded-full bg-rose-500 animate-ping' }), 'Auto-scrolling...')
                        : React.createElement('span', { className: 'text-neutral-400' }, 'Paused')
                  )
                ),

                // Speed controls
                React.createElement('div', { className: 'flex items-center justify-between sm:justify-end w-full sm:w-auto gap-2 border-t sm:border-t-0 sm:border-l border-neutral-100 dark:border-neutral-700 pt-2.5 sm:pt-0 sm:pl-3' },
                  React.createElement('span', { className: 'text-neutral-400 dark:text-neutral-500 text-[10px] uppercase font-semibold' }, 'Speed:'),
                  ...[
                    { label: 'Slow', val: 0.03 },
                    { label: 'Med', val: 0.07 },
                    { label: 'Fast', val: 0.12 },
                  ].map(spd =>
                    React.createElement('button', {
                      key: spd.label,
                      onClick: () => { setScrollSpeed(spd.val); setIsScrolling(true); },
                      className: `px-2.5 py-1 rounded text-[10px] font-medium transition cursor-pointer ${scrollSpeed === spd.val ? 'bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/30 text-rose-600 dark:text-rose-400' : 'border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400'}`,
                    }, spd.label)
                  )
                )
              ),

              isPreview && React.createElement('p', { className: 'text-center text-xs text-rose-500 dark:text-rose-400 font-medium bg-rose-50 dark:bg-rose-900/20 py-2 px-4 rounded-xl border border-rose-100 dark:border-rose-800/30' },
                'Preview mode — envelope, layout, auto-scroll and controls operate identically.'
              )
            )
      )
    )
  );
}
