export interface Letter {
  id: string;
  title: string;
  recipient: string;
  sender: string;
  body: string;
  theme: ThemeKey;
  createdAt: string;
  userId?: string | null;
}

export const THEMES = {
  romantic: {
    name: 'Romantic',
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    paper: 'bg-stone-50 dark:bg-neutral-900 border border-rose-100/50 dark:border-rose-800/30 shadow-md',
    text: 'text-rose-950 dark:text-rose-100',
    titleColor: 'text-rose-800 dark:text-rose-300',
    accent: 'bg-rose-500 hover:bg-rose-600 text-white focus:ring-rose-200',
    badge: 'bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/30',
    secondary: 'text-rose-700/80 dark:text-rose-300/80',
    envelopeBg: 'from-rose-100 to-rose-200 border-rose-300 dark:from-rose-900/50 dark:to-rose-800/50 dark:border-rose-700/30',
    heartColor: '#f43f5e',
    sparkleColor: '#fecdd3',
    gradient: 'from-rose-400 to-pink-500',
  },
  grateful: {
    name: 'Grateful',
    bg: 'bg-amber-50/60 dark:bg-amber-950/30',
    paper: 'bg-amber-50/20 dark:bg-neutral-900 border border-amber-100 dark:border-amber-800/30 shadow-md',
    text: 'text-amber-950 dark:text-amber-100',
    titleColor: 'text-amber-800 dark:text-amber-300',
    accent: 'bg-amber-500 hover:bg-amber-600 text-white focus:ring-amber-200',
    badge: 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/30',
    secondary: 'text-amber-700/80 dark:text-amber-300/80',
    envelopeBg: 'from-amber-100 to-amber-200 border-amber-300 dark:from-amber-900/50 dark:to-amber-800/50 dark:border-amber-700/30',
    heartColor: '#f59e0b',
    sparkleColor: '#fef3c7',
    gradient: 'from-amber-400 to-orange-500',
  },
  apology: {
    name: 'Apology',
    bg: 'bg-slate-50 dark:bg-slate-950/30',
    paper: 'bg-white dark:bg-neutral-900 border border-slate-200 dark:border-slate-700/30 shadow-md',
    text: 'text-slate-950 dark:text-slate-100',
    titleColor: 'text-slate-800 dark:text-slate-300',
    accent: 'bg-slate-600 hover:bg-slate-700 text-white focus:ring-slate-200',
    badge: 'bg-slate-100 dark:bg-slate-800/40 text-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700/30',
    secondary: 'text-slate-700/80 dark:text-slate-300/80',
    envelopeBg: 'from-slate-100 to-slate-200 border-slate-300 dark:from-slate-800/50 dark:to-slate-700/50 dark:border-slate-600/30',
    heartColor: '#475569',
    sparkleColor: '#cbd5e1',
    gradient: 'from-slate-500 to-zinc-700',
  },
  birthday: {
    name: 'Celebration',
    bg: 'bg-violet-50/50 dark:bg-violet-950/30',
    paper: 'bg-white dark:bg-neutral-900 border border-violet-100 dark:border-violet-800/30 shadow-md',
    text: 'text-violet-950 dark:text-violet-100',
    titleColor: 'text-violet-800 dark:text-violet-300',
    accent: 'bg-violet-500 hover:bg-violet-600 text-white focus:ring-violet-200',
    badge: 'bg-violet-100 dark:bg-violet-900/40 text-violet-800 dark:text-violet-300 border-violet-200 dark:border-violet-800/30',
    secondary: 'text-violet-700/80 dark:text-violet-300/80',
    envelopeBg: 'from-violet-100 to-violet-200 border-violet-300 dark:from-violet-900/50 dark:to-violet-800/50 dark:border-violet-700/30',
    heartColor: '#8b5cf6',
    sparkleColor: '#ddd6fe',
    gradient: 'from-violet-400 to-purple-500',
  },
  friendship: {
    name: 'Friendship',
    bg: 'bg-emerald-50/50 dark:bg-emerald-950/30',
    paper: 'bg-stone-50 dark:bg-neutral-900 border border-emerald-100/50 dark:border-emerald-800/30 shadow-md',
    text: 'text-emerald-950 dark:text-emerald-100',
    titleColor: 'text-emerald-800 dark:text-emerald-300',
    accent: 'bg-emerald-500 hover:bg-emerald-600 text-white focus:ring-emerald-200',
    badge: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/30',
    secondary: 'text-emerald-700/80 dark:text-emerald-300/80',
    envelopeBg: 'from-emerald-100 to-emerald-200 border-emerald-300 dark:from-emerald-900/50 dark:to-emerald-800/50 dark:border-emerald-700/30',
    heartColor: '#10b981',
    sparkleColor: '#a7f3d0',
    gradient: 'from-emerald-400 to-teal-500',
  },
  simple: {
    name: 'Classic',
    bg: 'bg-zinc-50 dark:bg-zinc-950/30',
    paper: 'bg-white dark:bg-neutral-900 border border-zinc-200 dark:border-zinc-700/30 shadow-sm',
    text: 'text-zinc-900 dark:text-zinc-100',
    titleColor: 'text-zinc-800 dark:text-zinc-300',
    accent: 'bg-zinc-800 hover:bg-zinc-900 text-white focus:ring-zinc-200',
    badge: 'bg-zinc-100 dark:bg-zinc-800/40 text-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700/30',
    secondary: 'text-zinc-600 dark:text-zinc-400',
    envelopeBg: 'from-zinc-100 to-zinc-200 border-zinc-300 dark:from-zinc-800/50 dark:to-zinc-700/50 dark:border-zinc-600/30',
    heartColor: '#27272a',
    sparkleColor: '#e4e4e7',
    gradient: 'from-zinc-600 to-neutral-800',
  },
} as const;

export type ThemeKey = keyof typeof THEMES;

export { encodeLetter, decodeLetter, runSelfTest } from '../lib/utils';
