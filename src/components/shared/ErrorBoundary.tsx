import React from 'react';
import { Heart } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.hash = '#/';
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return React.createElement('div', {
        className: 'flex-grow flex flex-col items-center justify-center min-h-screen bg-neutral-50 dark:bg-neutral-950 gap-6 px-6 text-center',
      },
        React.createElement('div', {
          className: 'w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center border border-red-100 dark:border-red-800/30 text-red-500',
        },
          React.createElement(Heart, { className: 'w-8 h-8' })
        ),
        React.createElement('h2', {
          className: 'font-serif text-2xl font-medium text-neutral-800 dark:text-neutral-200',
        }, 'Something went wrong'),
        React.createElement('p', {
          className: 'text-neutral-500 dark:text-neutral-400 text-sm max-w-md leading-relaxed',
        }, this.state.error?.message || 'An unexpected error occurred. Please try refreshing the page.'),
        React.createElement('button', {
          onClick: this.handleReset,
          className: 'px-6 py-3 rounded-full bg-gradient-to-r from-rose-400 to-pink-500 text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all hover:scale-105 cursor-pointer',
        }, 'Back to Home')
      );
    }

    return this.props.children as React.ReactNode;
  }
}
