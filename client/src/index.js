import React from 'react';
import ReactDOM from 'react-dom/client';
// Global styles load before App so component styles cascade after them.
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/numerals.css';
import './index.css';
import './styles/theme-light.css';
import { initTheme } from './utils/theme';
import App from './App';

// Set data-theme before the first render so the page never flashes the wrong colours.
initTheme();

const rootElement = document.getElementById('root');

if (rootElement.hasChildNodes()) {
  // Page was pre-rendered by react-snap — hydrate it
  ReactDOM.hydrateRoot(
    rootElement,
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
