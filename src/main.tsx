import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

import ErrorBoundary from './components/ErrorBoundary.tsx';

// Auto reload on new deployment / stale dynamic import chunk
window.addEventListener('vite:preloadError', (event) => {
  console.warn('Vite preload error detected, refreshing page for latest version...', event);
  window.location.reload();
});

// Register Service Worker for PWA (background notifications + offline caching)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // SW registration failed — non-critical, app still works
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
