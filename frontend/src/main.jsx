import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { CurrencyProvider } from './context/CurrencyContext.jsx';
import App from './App.jsx';
import './index.css';
import './i18n.js';

import { TimezoneProvider } from './context/TimezoneContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <CurrencyProvider>
          <TimezoneProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </TimezoneProvider>
        </CurrencyProvider>
      </ThemeProvider>
    </AuthProvider>
  </React.StrictMode>,
);
