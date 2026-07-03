import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Heart, Send, Eye, ArrowLeft, Loader2, LogIn, ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDraft } from '../context/DraftContext';
import { createLetter, createAnonymousLetter } from '../lib/supabase';
import { TEMPLATES } from '../lib/utils';
import { THEMES, type ThemeKey } from '../types';
import { GradientButton } from '../components/ui/GradientButton';
import { StatusPill } from '../components/ui/StatusPill';

export function ComposePage() {
  const { user, loading: authLoading, signIn } = useAuth();
  const { draft, updateField, setDraft, applyTemplate } = useDraft();
  const navigate = useNavigate();

  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const themeConfig = THEMES[draft.theme] || THEMES.romantic;

  const canPublish = draft.title.trim() && draft.recipient.trim() && draft.sender.trim() && draft.body.trim();

  const handlePublish = async () => {
    if (!canPublish) { alert('Please fill out all fields.'); return; }

    if (!user && !isAnonymous) {
      try { await signIn(); return; } catch { return; }
    }

    setIsPublishing(true);
    setPublishStatus('loading');

    try {
      let id: string;

      if (isAnonymous && !user) {
        // Store anonymous letters in Supabase too — gives them short UUIDs
        const letter = await createAnonymousLetter({
          title: draft.title,
          recipient: draft.recipient,
          sender: draft.sender,
          body: draft.body,
          theme: draft.theme,
        });
        id = letter.id;
      } else {
        const letter = await createLetter({
          title: draft.title,
          recipient: draft.recipient,
          sender: draft.sender,
          body: draft.body,
          theme: draft.theme,
        });
        id = letter.id;
      }

      setPublishStatus('success');
      // Navigate immediately — the SuccessPage itself shows the success state
      navigate(`/success/${id}`);
    } catch (err) {
      console.error('Publish error:', err);
      setPublishStatus('error');
      alert('Failed to publish. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  // ── Auth gate ───────────────────────────────────────
  if (!authLoading && !user && !isAnonymous) {
    return React.createElement(motion.div, {
      initial: { opacity: 0, y: 15 },
      animate: { opacity: 1, y: 0 },
      className: 'max-w-md mx-auto px-6 py-20 w-full flex flex-col items-center text-center gap-6',
    },
      React.createElement('div', { className: 'w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center border border-rose-100 dark:border-rose-800/30 text-rose-500 shadow-inner' },
        React.createElement(Heart, { className: 'w-8 h-8 fill-rose-500/20' })
      ),
      React.createElement('h2', { className: 'font-serif text-3xl font-medium text-neutral-800 dark:text-neutral-200' }, 'Secure Composing'),
      React.createElement('p', { className: 'text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed' },
        'Please sign in with Google to write and compose letters securely.'
      ),
      React.createElement(GradientButton, { onClick: signIn, size: 'lg', className: 'w-full', icon: React.createElement(LogIn, { className: 'w-5 h-5' }) }, 'Sign In with Google'),
      React.createElement('button', {
        onClick: () => setIsAnonymous(true),
        className: 'w-full py-2.5 px-6 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400 font-semibold transition border border-neutral-200/60 dark:border-neutral-700 flex items-center justify-center gap-2 cursor-pointer text-xs',
      }, 'Write Anonymously instead'),
      React.createElement(Link, { to: '/', className: 'text-xs text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 underline' }, 'Go back to Home')
    );
  }

  if (authLoading) {
    return React.createElement('div', { className: 'max-w-xl mx-auto px-6 py-32 flex flex-col items-center justify-center gap-4' },
      React.createElement(Loader2, { className: 'w-8 h-8 text-rose-500 animate-spin' }),
      React.createElement('span', { className: 'text-sm text-neutral-500 dark:text-neutral-400 font-medium' }, 'Authorizing account...')
    );
  }

  // ── Compose Form ─────────────────────────────────────
  return React.createElement(motion.div, {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    className: 'max-w-5xl mx-auto px-4 sm:px-6 py-10 w-full flex flex-col gap-8',
  },
    // Header
    React.createElement('div', { className: 'flex flex-col sm:flex-row sm:items-center justify-between gap-4' },
      React.createElement('div', { className: 'flex items-center gap-2' },
        React.createElement(Link, { to: '/', className: 'inline-flex items-center justify-center p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition' },
          React.createElement(ArrowLeft, { className: 'w-5 h-5' })
        ),
        React.createElement('div', null,
          React.createElement('h1', { className: 'font-serif text-2xl font-semibold text-neutral-800 dark:text-neutral-200' }, 'Compose Letter'),
          React.createElement('p', { className: 'text-neutral-400 dark:text-neutral-500 text-xs' }, 'Your letter is automatically structured and beautifully styled.')
        )
      ),
      isAnonymous && !user && React.createElement('div', { className: 'inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/30 px-3.5 py-1.5 rounded-full text-xs font-medium' },
        React.createElement('span', { className: 'w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse' }),
        'Anonymous Mode'
      ),
      React.createElement(StatusPill, { status: publishStatus })
    ),

    // Template picker
    React.createElement('div', { className: 'flex flex-col gap-2.5' },
      React.createElement('span', { className: 'text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider' }, 'Quick Inspiration'),
      React.createElement('div', { className: 'flex flex-wrap gap-2' },
        ...TEMPLATES.map((tpl, i) =>
          React.createElement('button', {
            key: i,
            onClick: () => applyTemplate(i),
            className: 'px-4 py-2 rounded-full text-xs font-medium bg-white dark:bg-neutral-900 hover:bg-rose-50 dark:hover:bg-rose-900/20 border border-neutral-200 dark:border-neutral-700 hover:border-rose-100 dark:hover:border-rose-800 text-neutral-700 dark:text-neutral-300 hover:text-rose-700 dark:hover:text-rose-400 transition shadow-sm cursor-pointer',
          }, tpl.name)
        )
      )
    ),

    // Main editor grid
    React.createElement('div', { className: 'grid grid-cols-1 lg:grid-cols-12 gap-8 items-start' },

      // Left: Customizer
      React.createElement('div', { className: 'lg:col-span-4 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-3xl p-6 shadow-sm flex flex-col gap-6' },
        React.createElement('h3', { className: 'font-serif text-lg font-medium text-neutral-800 dark:text-neutral-200 pb-3 border-b border-neutral-100 dark:border-neutral-800' }, 'Letter Customizer'),

        // Theme selector
        React.createElement('div', { className: 'flex flex-col gap-3' },
          React.createElement('label', { className: 'text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider' }, 'Emotional Tone'),
          React.createElement('div', { className: 'grid grid-cols-2 gap-2' },
            ...Object.entries(THEMES).map(([key, config]) => {
              const selected = draft.theme === key;
              return React.createElement('button', {
                key,
                onClick: () => updateField('theme', key as ThemeKey),
                className: `flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs font-medium transition cursor-pointer ${selected ? 'border-neutral-900 dark:border-white bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow' : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700'}`,
              },
                React.createElement('span', { className: 'w-3.5 h-3.5 rounded-full', style: { backgroundColor: config.heartColor } }),
                config.name
              );
            })
          )
        ),

        // Envelope preview
        React.createElement('div', { className: 'rounded-2xl p-4 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-700 flex flex-col items-center gap-3 text-center' },
          React.createElement('span', { className: 'text-[10px] font-mono text-neutral-400 dark:text-neutral-500 uppercase tracking-widest' }, 'Selected Envelope'),
          React.createElement('div', { className: 'w-24 h-16 rounded-lg bg-gradient-to-br from-neutral-100 to-neutral-200/80 dark:from-neutral-700 dark:to-neutral-600 flex items-center justify-center border border-neutral-300 dark:border-neutral-600 relative shadow-inner overflow-hidden' },
            React.createElement('div', { className: 'absolute inset-0 bg-gradient-to-tr from-transparent to-white/30 dark:to-white/5' }),
            React.createElement(Heart, { className: 'w-6 h-6', style: { color: themeConfig.heartColor, fill: themeConfig.heartColor + '20' } })
          ),
          React.createElement('p', { className: 'text-xs text-neutral-500 dark:text-neutral-400' },
            'Your reader opens a ', React.createElement('span', { className: 'font-medium text-neutral-700 dark:text-neutral-300' }, themeConfig.name), ' envelope.'
          )
        )
      ),

      // Right: Editor
      React.createElement('div', { className: 'lg:col-span-8 flex flex-col gap-4' },
        React.createElement('div', { className: `p-6 md:p-8 rounded-3xl ${themeConfig.paper} transition-colors duration-500 flex flex-col gap-6` },

          // Metadata inputs
          React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
            ...[
              { field: 'recipient' as const, label: 'Recipient Name', placeholder: 'e.g., My Dear Julia' },
              { field: 'sender' as const, label: 'Sender / Signature', placeholder: 'e.g., Yours Forever' },
            ].map(({ field, label, placeholder }) =>
              React.createElement('div', { key: field, className: 'flex flex-col gap-1.5' },
                React.createElement('label', { className: 'text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider' }, label),
                React.createElement('input', {
                  type: 'text',
                  placeholder,
                  value: draft[field],
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) => updateField(field, e.target.value),
                  className: `px-3 py-2 border border-neutral-200/60 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:border-rose-300 dark:focus:border-rose-700 bg-white/70 dark:bg-neutral-800/70 ${themeConfig.text}`,
                })
              )
            )
          ),

          // Title
          React.createElement('div', { className: 'flex flex-col gap-1.5' },
            React.createElement('label', { className: 'text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider' }, 'Letter Title'),
            React.createElement('input', {
              type: 'text',
              placeholder: 'A whisper of warm thoughts',
              value: draft.title,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => updateField('title', e.target.value),
              className: `px-3.5 py-2.5 border border-neutral-200/60 dark:border-neutral-700 rounded-xl text-sm md:text-base font-serif focus:outline-none focus:border-rose-300 dark:focus:border-rose-700 bg-white/70 dark:bg-neutral-800/70 ${themeConfig.titleColor}`,
            })
          ),

          // Body
          React.createElement('div', { className: 'flex flex-col gap-1.5 flex-grow' },
            React.createElement('label', { className: 'text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider' }, 'Your Message'),
            React.createElement('textarea', {
              placeholder: 'Write your letter here... Pour your heart out.',
              value: draft.body,
              onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => updateField('body', e.target.value),
              rows: 12,
              className: `px-4 py-3.5 border border-neutral-200/60 dark:border-neutral-700 rounded-2xl text-sm md:text-base font-serif leading-relaxed focus:outline-none focus:border-rose-300 dark:focus:border-rose-700 bg-white/70 dark:bg-neutral-800/70 h-80 resize-none ${themeConfig.text}`,
            }),
            React.createElement('div', { className: 'flex justify-between text-[10px] text-neutral-400 dark:text-neutral-500 mt-1' },
              React.createElement('span', null, 'Plain text with paragraphs'),
              React.createElement('span', null, `${draft.body.length} characters`)
            )
          )
        ),

        // Actions
        React.createElement('div', { className: 'flex items-center justify-end gap-3 mt-4' },
          React.createElement(GradientButton, {
            mode: 'outline',
            onClick: () => navigate('/preview'),
            disabled: isPublishing || !draft.body.trim(),
            icon: React.createElement(Eye, { className: 'w-4 h-4' }),
          }, 'Preview'),
          React.createElement(GradientButton, {
            variant: 'romantic',
            onClick: handlePublish,
            disabled: isPublishing || !canPublish,
            loading: isPublishing,
            icon: React.createElement(Send, { className: 'w-4 h-4' }),
          }, 'Post Letter')
        )
      )
    )
  );
}
