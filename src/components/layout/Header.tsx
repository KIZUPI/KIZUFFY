import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Heart, PenTool, LogIn, LogOut, Sun, Moon, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDarkMode } from '../../hooks/useDarkMode';

export function Header() {
  const { user, loading, signIn, signOut } = useAuth();
  const { isDark, toggle } = useDarkMode();

  return React.createElement(
    'header',
    { className: 'border-b border-neutral-100 dark:border-neutral-800 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-6 py-3 transition-colors duration-300' },
    React.createElement('div', { className: 'max-w-7xl mx-auto flex items-center justify-between' },

      // Logo
      React.createElement(Link, {
        to: '/',
        className: 'flex items-center gap-2 group',
      },
        React.createElement('div', { className: 'w-8 h-8 rounded-lg bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow' },
          React.createElement(Heart, { className: 'w-4 h-4 text-white fill-white/20' })
        ),
        React.createElement('span', { className: 'font-serif font-semibold text-lg tracking-tight text-neutral-800 dark:text-neutral-100 hidden sm:inline' },
          'Letter Poster'
        )
      ),

      // Right side
      React.createElement('div', { className: 'flex items-center gap-2 sm:gap-3' },

        // Dark mode toggle
        React.createElement(
          motion.button,
          {
            whileHover: { scale: 1.1 },
            whileTap: { scale: 0.9 },
            onClick: toggle,
            className: 'p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 transition cursor-pointer',
            'aria-label': isDark ? 'Switch to light mode' : 'Switch to dark mode',
          },
          isDark
            ? React.createElement(Sun, { className: 'w-4 h-4' })
            : React.createElement(Moon, { className: 'w-4 h-4' })
        ),

        // Compose CTA
        React.createElement(Link, {
          to: '/compose',
          className: 'hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-rose-400 to-pink-500 text-white text-xs font-semibold shadow-sm hover:shadow-md transition-all hover:scale-105',
        },
          React.createElement(PenTool, { className: 'w-3.5 h-3.5' }),
          'Write a Letter'
        ),

        // Auth
        loading
          ? React.createElement(Loader2, { className: 'w-5 h-5 animate-spin text-neutral-400' })
          : user
            ? React.createElement('div', { className: 'flex items-center gap-2' },
                user.user_metadata?.avatar_url
                  ? React.createElement('img', {
                      src: user.user_metadata.avatar_url,
                      alt: user.user_metadata?.full_name || '',
                      className: 'w-8 h-8 rounded-full border border-rose-100 dark:border-rose-800 shadow-sm',
                      referrerPolicy: 'no-referrer',
                    })
                  : React.createElement('div', {
                      className: 'w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-900/30 text-rose-500 flex items-center justify-center font-bold text-xs border border-rose-100 dark:border-rose-800',
                    }, (user.user_metadata?.full_name || user.email || 'U')[0].toUpperCase()),
                React.createElement(
                  motion.button,
                  {
                    whileHover: { scale: 1.1 },
                    whileTap: { scale: 0.9 },
                    onClick: () => { if (confirm('Sign out?')) signOut(); },
                    className: 'p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-red-500 transition cursor-pointer',
                    title: 'Sign Out',
                  },
                  React.createElement(LogOut, { className: 'w-4 h-4' })
                )
              )
            : React.createElement(
                motion.button,
                {
                  whileHover: { scale: 1.03 },
                  whileTap: { scale: 0.97 },
                  onClick: signIn,
                  className: 'px-4 py-2 rounded-full bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-semibold transition shadow-sm hover:shadow flex items-center gap-1.5 cursor-pointer',
                },
                React.createElement(LogIn, { className: 'w-3.5 h-3.5' }),
                'Sign In'
              )
      )
    )
  );
}
