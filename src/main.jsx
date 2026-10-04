import React from 'react';
import {createRoot} from 'react-dom/client';
import './styles.css';
import './dark.css';
import Service from './service.jsx';
import './neutral.css';
document.documentElement.classList.add('dark');
document.documentElement.dataset.theme='dark';
createRoot(document.getElementById('root')).render(<Service/>);
