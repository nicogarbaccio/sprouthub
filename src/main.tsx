import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initSentry } from './config/sentry'

// Initialize Sentry before rendering the app
initSentry();

// Auto-reload when a new service worker takes control (after deploy)
// so users always get fresh assets without manually clearing cache
if ('serviceWorker' in navigator) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
