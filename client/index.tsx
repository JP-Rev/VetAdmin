
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Tailwind + tokens de tema (procesado por PostCSS en el build)
import AppWrapper from './App'; // Changed to AppWrapper
import { setupServiceWorker } from './lib/swUpdate';

setupServiceWorker();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>
);