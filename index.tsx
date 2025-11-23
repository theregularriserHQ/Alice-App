import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { I18nProvider } from './contexts/i18nContext.tsx';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </React.StrictMode>
);
