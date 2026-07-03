import React from 'react';
import { createHashRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DraftProvider } from './context/DraftContext';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { AppLayout } from './components/layout/AppLayout';
import { LandingPage } from './pages/LandingPage';
import { ComposePage } from './pages/ComposePage';
import { PreviewPage } from './pages/PreviewPage';
import { SuccessPage } from './pages/SuccessPage';
import { LetterReaderPage } from './pages/LetterReaderPage';

function NotFoundPage() {
  return React.createElement('div', {
    className: 'flex-grow flex flex-col items-center justify-center p-8 text-center gap-6 min-h-[60vh]',
  },
    React.createElement('h1', { className: 'font-serif text-6xl text-neutral-300 dark:text-neutral-700' }, '404'),
    React.createElement('h2', { className: 'font-serif text-2xl text-neutral-800 dark:text-neutral-200' }, 'Page Not Found'),
    React.createElement('p', { className: 'text-neutral-500 dark:text-neutral-400 text-sm max-w-sm' },
      "The page you're looking for doesn't exist or has been moved."
    ),
    React.createElement('a', {
      href: '#/',
      className: 'px-6 py-3 rounded-full bg-gradient-to-r from-rose-400 to-pink-500 text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all hover:scale-105',
    }, 'Back to Home')
  );
}

const router = createHashRouter([
  {
    path: '/',
    element: React.createElement(AppLayout),
    children: [
      { index: true, element: React.createElement(LandingPage) },
      { path: 'compose', element: React.createElement(ComposePage) },
      { path: 'preview', element: React.createElement(PreviewPage) },
      { path: 'success/:id', element: React.createElement(SuccessPage) },
      { path: 'letter/:id', element: React.createElement(LetterReaderPage) },
      { path: '*', element: React.createElement(NotFoundPage) },
    ],
  },
]);

export default function App() {
  return React.createElement(ErrorBoundary, null,
    React.createElement(AuthProvider, null,
      React.createElement(DraftProvider, null,
        React.createElement(RouterProvider, { router })
      )
    )
  );
}
