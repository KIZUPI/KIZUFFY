import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Header } from './Header';

export function AppLayout() {
  const location = useLocation();
  const isReaderPage = location.pathname.startsWith('/letter/');

  return React.createElement('div', {
    className: 'min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col font-sans transition-colors duration-300',
  },
    !isReaderPage && React.createElement(Header),
    React.createElement('main', { className: 'flex-grow flex flex-col' },
      React.createElement(motion.div, {
        key: location.pathname,
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.2, ease: 'easeOut' },
        className: 'flex-grow flex flex-col',
      },
        React.createElement(Outlet)
      )
    )
  );
}
