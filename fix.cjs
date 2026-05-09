const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// Replace all the garbled UTF-8 mojibake sequences with proper chars
// These happen when UTF-8 is read as latin-1 then re-encoded
const fixes = [
  // Arrows
  ['â†'', '\u2192'],   // →
  ['â†—', '\u2197'],   // ↗
  // Em dash
  ['â€"', '\u2014'],   // —
  ['â€"', '\u2013'],   // –
  // Quotes
  ['â€œ', '\u201C'],   // "
  ['â€\x9d', '\u201D'],// "
  // Bullet
  ['â\x80¢', '\u2022'],// •
  // Emojis - project icons
  ['\u00f0\u009f\u00a5\u0097', '\u{1F957}'], // 🥗
  ['\u00f0\u009f\u00a4\u0096', '\u{1F916}'], // 🤖
  ['\u00f0\u009f\u0093\u00a1', '\u{1F4E1}'], // 📡
  ['\u00f0\u009f\u0092\u00bc', '\u{1F4BC}'], // 💼
  ['\u00e2\u009c\u00a8', '\u2728'],          // ✨
  ['\u00f0\u009f\u00a6\u0092', '\u{1F992}'], // 🦒
  ['\u00f0\u009f\u008c\u00b4', '\u{1F334}'], // 🌴
  ['\u00e2\u009c\u0088\u00ef\u00b8\u008f', '\u2708\uFE0F'], // ✈️
  ['\u00f0\u009f\u0094\u00b7', '\u{1F537}'], // 🔷
  ['\u00c2\u00b0', '\u00B0'],                // °
  // Status dot
  ['\u00e2\u0097\u008f', '\u25CF'],          // ●
  // Infinity
  ['\u00e2\u0088\u009e', '\u221E'],          // ∞
  // Gigaton em dash in description
  ["Gigachad on TON \u00e2\u20ac\u201c Memecoin Website", "Gigachad on TON \u2014 Memecoin Website"],
];

let count = 0;
fixes.forEach(([from, to]) => {
  const before = code.length;
  code = code.split(from).join(to);
  if (code.length !== before) count++;
});

// Also just do a blanket replacement of the most common ones by their hex patterns
// The emoji icons appear as garbled 3-4 byte sequences - replace them with text fallbacks
// that look clean in the UI (we'll use text/unicode that renders properly)
const emojiMap = {
  'plato': '🥗',
  'dipper': '🤖', 
  'splash': '📡',
  'careeva': '💼',
  'reflect': '✨',
  'omo': '🦒',
  'gigaton': '🔷',
  'staywestpalm': '🌴',
  'wayfound': '✈️',
};

// Fix emoji field - find each project's emoji property and replace garbled value
Object.entries(emojiMap).forEach(([id, emoji]) => {
  // Match: id: 'plato', ... emoji: 'GARBLED',
  const reg = new RegExp("(id: '" + id + "'[\\s\\S]{0,300}?emoji: ')[^']+(')", 'm');
  code = code.replace(reg, '$1' + emoji + '$2');
});

// Fix the arrow characters in highlights display
// The â†' should be → 
code = code.replace(/\u00e2\u0086\u0092/g, '\u2192'); // →
code = code.replace(/\u00e2\u0086\u0097/g, '\u2197'); // ↗

fs.writeFileSync('src/App.jsx', code, 'utf8');
console.log('Applied', count, 'fixes');
console.log('File size:', code.length);

