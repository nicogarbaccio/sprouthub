import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initSentry } from './config/sentry'
import { registerServiceWorker } from './utils/registerServiceWorker'

// Initialize Sentry before rendering the app
initSentry();

// Production only: in dev the worker would cache Vite's modules and fight hot reload
if (import.meta.env.PROD) {
  registerServiceWorker();
}

createRoot(document.getElementById("root")!).render(<App />);
