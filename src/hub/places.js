import { LIVE_COUNT } from '../content/portfolio.js';

// Arranged so the front-center corridor (camera → fox) stays clear.
export const LANDMARKS = [
  { id: 'projects', label: 'Projects', hint: `${LIVE_COUNT} live`, kind: 'monoliths', accent: '#e0a155', pos: [-2.4, 0, -9.5], labelY: 3.55 },
  { id: 'about', label: 'About', hint: 'who I am', kind: 'cabin', accent: '#f0b978', pos: [-7.2, 0, -3.5], labelY: 3.7 },
  { id: 'experience', label: 'Experience', hint: 'the climb', kind: 'cairn', accent: '#c9a25e', pos: [7.2, 0, -3.5], labelY: 3.9 },
  { id: 'life', label: 'Life', hint: 'off the clock', kind: 'lake', accent: '#5fd6c4', pos: [-7.4, 0, 3.2], labelY: 2.7 },
  { id: 'skills', label: 'Skills', hint: 'the kit', kind: 'cache', accent: '#d8b07a', pos: [7.6, 0, 1.5], labelY: 2.7 },
  { id: 'contact', label: 'Contact', hint: 'say hi', kind: 'signpost', accent: '#f0b978', pos: [3.4, 0, 6.5], labelY: 3.4 },
];
