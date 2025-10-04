import './utils/fetchInterceptor';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './assets/globalStyle/index.css'
import './assets/globalStyle/root.css';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);