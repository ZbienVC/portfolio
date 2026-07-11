import { createRoot } from 'react-dom/client';
import './styles/alpine.css';
import './styles/panels.css';
import './styles/journey.css';
import './styles/hub.css';
import App from './App.jsx';

// No StrictMode: the journey effect owns a WebGL context; dev double-invoke
// would churn / leak GL contexts. The effect cleans up correctly on unmount.
createRoot(document.getElementById('root')).render(<App />);
