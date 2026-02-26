import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';

// Hide the loading screen when React app mounts
const hideLoadingScreen = () => {
  const loadingScreen = document.getElementById('loading-screen');
  const rootElement = document.getElementById('root');

  if (loadingScreen && rootElement) {
    loadingScreen.style.transition = 'opacity 0.5s ease';
    loadingScreen.style.opacity = '0';

    setTimeout(() => {
      loadingScreen.style.display = 'none';
      rootElement.style.display = 'block';
    }, 500);
  }
};

// Initialize React app
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found. Check your index.html file.');
}

try {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  // Hide loading screen after React mounts
  setTimeout(hideLoadingScreen, 100);

  // Register service worker for PWA
  if ('serviceWorker' in navigator && window.location.hostname !== 'localhost') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js');
    });
  }

  // Log app startup
  console.log('🚀 Career Risk Calculator started successfully');
  console.log('📊 Version: 2.0.0');
  console.log('🌍 Environment:', import.meta.env.MODE);

} catch (error) {
  console.error('Failed to start application:', error);

  // Show error to user
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    loadingScreen.innerHTML = `
      <div style="text-align: center; color: white; padding: 2rem;">
        <h1 style="color: #ff6b6b; margin-bottom: 1rem;">⚠️ Application Error</h1>
        <p>Failed to load the application. Please refresh the page or try again later.</p>
        <button onclick="window.location.reload()" style="
          margin-top: 1rem;
          padding: 0.75rem 1.5rem;
          background: white;
          color: #0F4C81;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        ">
          Refresh Page
        </button>
      </div>
    `;
  }
}