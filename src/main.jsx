import { createRoot } from 'react-dom/client';
import App from './App.jsx';

// No StrictMode: the 3D modes own WebGL contexts; dev double-invoke would churn
// / leak GL contexts. Their effects clean up correctly on unmount.
createRoot(document.getElementById('root')).render(<App />);
