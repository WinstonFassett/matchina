import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import FloatingApp from './FloatingApp.tsx';

const container = document.querySelector('#app');
if (container) {
  const root = createRoot(container);
  root.render(<FloatingApp />);
};
