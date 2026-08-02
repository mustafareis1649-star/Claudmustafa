import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nProvider } from './shell/i18n/I18nContext';
import App from './App';
import './styles/style.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </StrictMode>,
);
