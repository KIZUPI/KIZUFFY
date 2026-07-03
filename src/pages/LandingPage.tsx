import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Heart, PenTool, Sparkles, Check, Mail, BookOpen, Trash2,
  ArrowRight, Star, Shield, Zap, Eye, Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDraft } from '../context/DraftContext';
import { getUserLetters, deleteLetter } from '../lib/supabase';
import { TEMPLATES } from '../lib/utils';
import { THEMES, type ThemeKey, type Letter } from '../types';
import { ThemeBadge } from '../components/shared/ThemeBadge';
import { EmptyState } from '../components/shared/EmptyState';
import { CopyButton } from '../components/ui/CopyButton';

// ── Scramble Reveal ──────────────────────────────────────
function ScrambleReveal({ text, className = '' }: { text: string; className?: string }) {
  const chars = '!<>-_/[]{}—=+*^?#________';
  const [display, setDisplay] = useState('');

  useEffect(() => {
    let frame = 0;
    const maxFrames = 30;
    let id: number;

    const scramble = () => {
      frame++;
      const progress = frame / maxFrames;
      setDisplay(
        text
          .split('')
          .map((ch, i) => {
            if (ch === ' ') return ' ';
            if (progress > i / text.length + 0.4) return ch;
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join('')
      );
      if (frame < maxFrames) id = requestAnimationFrame(scramble);
    };

    id = requestAnimationFrame(scramble);
    return () => cancelAnimationFrame(id);
  }, [text]);

  return React.createElement('span', { className }, display || text);
}

// ── Animated Counter ─────────────────────────────────────
function AnimatedCounter({ value, duration = 1.4 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start: number;
    let id: number;

    const animate = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.round(eased * value));
      if (p < 1) id = requestAnimationFrame(animate);
    };

    id = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(id);
  }, [value, duration]);

  return React.createElement('span', { className: 'tabular-nums' }, count.toLocaleString());
}

// ── Landing Page ─────────────────────────────────────────
export function LandingPage() {
  const { user, loading: authLoading } = useAuth();
  const { setDraft } = useDraft();

  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<ThemeKey | 'all'>('all');

  const fetchLetters = useCallback(async () => {
    if (!user) { setLetters([]); setLoading(false); return; }
    try {
      const data = await getUserLetters(user.id);
      setLetters(data);
    } catch (err) {
      console.error('Failed to fetch letters:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchLetters(); }, [fetchLetters]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this letter?')) return;
    try {
      await deleteLetter(id);
      setLetters(prev => prev.filter(l => l.id !== id));
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const filteredLetters = activeFilter === 'all'
    ? letters
    : letters.filter(l => l.theme === activeFilter);

  const shareBaseUrl = window.location.origin + window.location.pathname;

  // ── Render ──────────────────────────────────────────
  return React.createElement('div', { className: 'max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-20 flex flex-col gap-20 w-full' },

    // ═══ HERO ═══════════════════════════════════════════
    React.createElement('section', { className: 'text-center flex flex-col items-center gap-6' },

      // Badge
      React.createElement('div', {
        className: 'inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800/30 text-xs font-medium tracking-wide uppercase',
      },
        React.createElement(Sparkles, { className: 'w-3.5 h-3.5' }),
        'A Gentle Way to Connect'
      ),

      // Headline with scramble
      React.createElement('h1', {
        className: 'font-serif text-4xl sm:text-5xl md:text-6xl text-neutral-800 dark:text-neutral-100 font-medium tracking-tight leading-[1.1] max-w-3xl',
      },
        'Write letters that ',
        React.createElement(ScrambleReveal, { text: 'feel alive', className: 'text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-pink-500 italic font-normal' }),
        '.'
      ),

      // Subtext
      React.createElement('p', {
        className: 'text-neutral-500 dark:text-neutral-400 text-base md:text-lg max-w-xl leading-relaxed',
      }, 'Compose personal letters, customize the emotional theme, and share them. Your recipient opens a beautiful heart-sealed envelope with hands-free auto-scrolling.'),

      // CTA Buttons
      React.createElement('div', { className: 'flex flex-wrap items-center justify-center gap-3 mt-2' },
        React.createElement(Link, {
          to: '/compose',
          className: 'inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600 text-white font-semibold transition-all shadow-md hover:shadow-lg hover:scale-105',
        },
          React.createElement(PenTool, { className: 'w-5 h-5' }),
          'Write a Letter'
        ),
        React.createElement(
          motion.button,
          {
            whileHover: { scale: 1.03 },
            whileTap: { scale: 0.97 },
            onClick: () => {
              const tpl = TEMPLATES[0];
              setDraft({
                title: tpl.title,
                recipient: tpl.recipient,
                sender: tpl.sender,
                body: tpl.body,
                theme: tpl.theme,
              });
            },
            className: 'px-6 py-3.5 rounded-full bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 font-semibold transition shadow-sm hover:shadow cursor-pointer',
          },
          'Try Demo Preset'
        )
      ),

      // Stats
      React.createElement('div', { className: 'flex flex-wrap items-center justify-center gap-6 mt-4' },
        React.createElement('div', { className: 'flex flex-col items-center' },
          React.createElement('span', { className: 'text-3xl font-bold text-neutral-800 dark:text-neutral-100 font-serif' },
            React.createElement(AnimatedCounter, { value: letters.length || 0 })
          ),
          React.createElement('span', { className: 'text-xs text-neutral-400 dark:text-neutral-500 mt-1' }, 'Letters Written')
        ),
        React.createElement('div', { className: 'w-px h-8 bg-neutral-200 dark:bg-neutral-700' }),
        React.createElement('div', { className: 'flex flex-col items-center' },
          React.createElement('span', { className: 'text-3xl font-bold text-neutral-800 dark:text-neutral-100 font-serif' }, '6'),
          React.createElement('span', { className: 'text-xs text-neutral-400 dark:text-neutral-500 mt-1' }, 'Beautiful Themes')
        ),
        React.createElement('div', { className: 'w-px h-8 bg-neutral-200 dark:bg-neutral-700' }),
        React.createElement('div', { className: 'flex flex-col items-center' },
          React.createElement('span', { className: 'text-3xl font-bold text-neutral-800 dark:text-neutral-100 font-serif' },
            React.createElement(AnimatedCounter, { value: 100 })
          ),
          React.createElement('span', { className: 'text-xs text-neutral-400 dark:text-neutral-500 mt-1' }, 'Hearts Shared')
        )
      )
    ),

    // ═══ FEATURE PREVIEW CARD ════════════════════════════
    React.createElement('div', {
      className: 'bg-gradient-to-tr from-rose-50/50 via-neutral-50 to-amber-50/30 dark:from-rose-950/20 dark:via-neutral-900 dark:to-amber-950/10 p-6 sm:p-8 rounded-3xl border border-neutral-100 dark:border-neutral-800 flex flex-col md:flex-row items-center gap-8 shadow-sm',
    },
      React.createElement('div', { className: 'flex-1 flex flex-col gap-4' },
        React.createElement('h3', { className: 'font-serif text-2xl text-neutral-800 dark:text-neutral-200 font-medium' }, 'The Magical Opening'),
        React.createElement('p', { className: 'text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed' },
          'When your recipient opens your shared link, they will see a soft, floating heart envelope. Tapping the heart reveals your letter with a gentle slide animation and comfortable auto-scrolling so they can enjoy your words hands-free.'
        ),
        React.createElement('div', { className: 'flex flex-wrap items-center gap-3 text-xs text-neutral-400 dark:text-neutral-500' },
          ...[['Beautiful Themes', 'emerald'], ['Auto-Scroll', 'emerald'], ['Responsive', 'emerald']].map(([label, color]) =>
            React.createElement('span', { key: label, className: 'flex items-center gap-1' },
              React.createElement(Check, { className: 'w-3.5 h-3.5 text-emerald-500' }),
              label
            )
          )
        )
      ),
      React.createElement('div', { className: 'flex-1 flex justify-center py-4' },
        React.createElement('div', {
          className: 'relative w-64 h-40 rounded-2xl bg-gradient-to-b from-rose-50 to-rose-100 dark:from-rose-900/30 dark:to-rose-800/20 border border-rose-200 dark:border-rose-800/30 flex flex-col items-center justify-center shadow-md animate-pulse',
        },
          React.createElement(Heart, { className: 'w-12 h-12 text-rose-500 fill-rose-500/20 drop-shadow-sm' }),
          React.createElement('span', { className: 'text-[10px] font-mono tracking-widest text-rose-400 dark:text-rose-500 mt-2 uppercase' }, 'Open envelope')
        )
      )
    ),

    // ═══ HOW IT WORKS ════════════════════════════════════
    React.createElement('section', { className: 'flex flex-col gap-8' },
      React.createElement('h2', { className: 'font-serif text-3xl text-center text-neutral-800 dark:text-neutral-200 font-medium' }, 'How It Works'),
      React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-3 gap-6' },
        ...[
          { icon: PenTool, title: '1. Compose', desc: 'Write your letter with our beautiful editor. Choose an emotional theme and customize every detail.' },
          { icon: Eye, title: '2. Preview', desc: 'See exactly how your recipient will experience your letter — envelope, animation, and all.' },
          { icon: Mail, title: '3. Share', desc: 'Get a short, shareable link. Your recipient opens a magical heart-sealed envelope.' },
        ].map(({ icon: Icon, title, desc }) =>
          React.createElement('div', {
            key: title,
            className: 'bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center gap-3',
          },
            React.createElement('div', { className: 'w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center' },
              React.createElement(Icon, { className: 'w-6 h-6 text-rose-500' })
            ),
            React.createElement('h4', { className: 'font-serif font-semibold text-neutral-800 dark:text-neutral-200 text-lg' }, title),
            React.createElement('p', { className: 'text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed' }, desc)
          )
        )
      )
    ),

    // ═══ LETTER HISTORY (authenticated only) ═════════════
    user && React.createElement('section', { className: 'flex flex-col gap-6' },
      React.createElement('div', { className: 'flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-4' },
        React.createElement('h2', { className: 'font-serif text-2xl text-neutral-800 dark:text-neutral-200 font-medium flex items-center gap-2' },
          React.createElement(Mail, { className: 'w-5 h-5 text-neutral-400' }),
          'Your Sent Letters ',
          React.createElement('span', { className: 'text-sm text-neutral-400 font-sans font-normal' }, `(${letters.length})`)
        ),

        // Theme filter tags
        React.createElement('div', { className: 'hidden sm:flex items-center gap-1.5' },
          ...[{ key: 'all' as const, name: 'All' }, ...Object.entries(THEMES).map(([k, v]) => ({ key: k as ThemeKey, name: v.name }))].map(({ key, name }) =>
            React.createElement('button', {
              key,
              onClick: () => setActiveFilter(key),
              className: `px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
                activeFilter === key
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`,
            }, name)
          )
        )
      ),

      loading
        ? React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
            ...[1, 2, 3, 4].map(i =>
              React.createElement('div', { key: i, className: 'h-40 rounded-2xl bg-neutral-100 dark:bg-neutral-800 animate-shimmer' })
            )
          )
        : filteredLetters.length === 0
          ? React.createElement(EmptyState, {
              title: activeFilter === 'all' ? 'No letters yet' : 'No letters with this theme',
              description: activeFilter === 'all' ? 'Write your first letter and it will appear here.' : 'Try selecting a different theme filter.',
              action: activeFilter === 'all' ? { label: 'Write a Letter', to: '/compose' } : undefined,
            })
          : React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
              filteredLetters.map(letter => {
                const themeInfo = THEMES[letter.theme] || THEMES.romantic;
                return React.createElement(
                  motion.div,
                  {
                    key: letter.id,
                    initial: { opacity: 0, y: 10 },
                    animate: { opacity: 1, y: 0 },
                    whileHover: { scale: 1.02, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' },
                    onClick: () => { window.location.hash = `#/letter/${letter.id}`; },
                    className: 'bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-5 shadow-sm transition flex flex-col justify-between gap-4 cursor-pointer relative group',
                  },
                    React.createElement('div', { className: 'flex justify-between items-start' },
                      React.createElement('div', { className: 'flex flex-col gap-1 min-w-0' },
                        React.createElement(ThemeBadge, { theme: letter.theme }),
                        React.createElement('h4', { className: 'font-serif font-medium text-neutral-800 dark:text-neutral-200 text-lg mt-2 truncate' },
                          letter.title || 'Untitled Letter'
                        ),
                        React.createElement('p', { className: 'text-xs text-neutral-400 dark:text-neutral-500' },
                          'To: ', React.createElement('span', { className: 'font-medium text-neutral-600 dark:text-neutral-300' }, letter.recipient),
                          ' • From: ', React.createElement('span', { className: 'font-medium text-neutral-600 dark:text-neutral-300' }, letter.sender)
                        )
                      ),
                      React.createElement('button', {
                        onClick: (e: React.MouseEvent) => handleDelete(letter.id, e),
                        className: 'p-1.5 rounded-lg text-neutral-300 dark:text-neutral-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition opacity-0 group-hover:opacity-100 cursor-pointer shrink-0',
                        title: 'Delete',
                      },
                        React.createElement(Trash2, { className: 'w-4 h-4' })
                      )
                    ),
                    React.createElement('div', { className: 'flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800 pt-3 text-xs text-neutral-400' },
                      React.createElement('span', null, letter.createdAt),
                      React.createElement(CopyButton, { text: `${shareBaseUrl}#/letter/${letter.id}` })
                    )
                  )
                ;
              })
            )
    )
  );
}
