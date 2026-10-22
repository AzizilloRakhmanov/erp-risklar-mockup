import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './design-system/tokens.css';
import Shell from './shell/Shell.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Shell />
  </StrictMode>
);
