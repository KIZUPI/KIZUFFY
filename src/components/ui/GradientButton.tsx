import React from 'react';
import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { THEMES, type ThemeKey } from '../../types';

interface GradientButtonProps {
  variant?: ThemeKey | 'primary';
  size?: 'sm' | 'md' | 'lg';
  mode?: 'filled' | 'outline' | 'ghost';
  loading?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  title?: string;
  style?: React.CSSProperties;
}

const sizeMap = {
  sm: 'px-4 py-2 text-xs rounded-xl',
  md: 'px-6 py-3 text-sm rounded-full',
  lg: 'px-8 py-4 text-base rounded-full',
};

export function GradientButton({
  variant = 'primary',
  size = 'md',
  mode = 'filled',
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}: GradientButtonProps) {
  const theme = THEMES[variant as ThemeKey];
  const gradient = theme?.gradient ?? 'from-rose-500 to-rose-600';

  const baseClasses = sizeMap[size];

  const modeClasses = mode === 'filled'
    ? `bg-gradient-to-r ${gradient} text-white shadow-md hover:shadow-lg`
    : mode === 'outline'
    ? `border-2 border-transparent bg-clip-padding ${baseClasses.includes('rounded-full') ? 'rounded-full' : 'rounded-xl'} [background-image:linear-gradient(white,white),linear-gradient(to_right,${gradient.replace('from-','').replace('to-','')})] [background-origin:border-box] [background-clip:padding-box,border-box] text-neutral-700 dark:text-neutral-200 dark:[background-image:linear-gradient(#171717,#171717),linear-gradient(to_right,${gradient.replace('from-','').replace('to-','')})]`
    : `text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800`;

  return React.createElement(
    motion.button,
    {
      whileHover: { scale: disabled || loading ? 1 : 1.03 },
      whileTap: { scale: disabled || loading ? 1 : 0.97 },
      className: `${baseClasses} ${modeClasses} font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${className}`,
      disabled: disabled || loading,
      ...props,
    },
    loading
      ? React.createElement(Loader2, { className: 'w-4 h-4 animate-spin' })
      : icon,
    children
  );
}
