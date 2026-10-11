import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/index.css';
import '@fontsource/vt323/latin-400.css';
import '@fontsource/vt323/latin-ext-400.css';
import '@fontsource/vt323/vietnamese-400.css';

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
