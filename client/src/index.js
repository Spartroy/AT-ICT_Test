import React from 'react';
import ReactDOM from 'react-dom/client';
// Global styles load before App so component styles cascade after them.
import './styles/fonts.css';
import './styles/tokens.css';
import './index.css';
import App from './App';

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
