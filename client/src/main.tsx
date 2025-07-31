import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

if (import.meta.env.DEV) {
  console.log('🚀 Main.tsx loading...');
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

if (import.meta.env.DEV) {
  console.log('📦 Root element found, creating React root...');
}

// Enable React DevTools in development
if (import.meta.env.DEV) {
  import('@welldone-software/why-did-you-render').then((wdyr) => {
    wdyr.default(React, {
      trackAllPureComponents: true,
    });
  }).catch(() => {
    // Silently fail if why-did-you-render is not available
  });
}

const root = ReactDOM.createRoot(rootElement);

if (import.meta.env.DEV) {
  console.log('✅ React root created and app rendered');
}

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)