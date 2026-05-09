const fs = require('fs');
let lines = fs.readFileSync('src/App.jsx', 'utf8').split('\n');
// Lines 407-409 (0-indexed 406-408) are the stats
// Replace lines 406, 407, 408 with new stats
lines[406] = "            { num: '9', label: 'Live in Production' },";
lines[407] = "            { num: '3+', label: 'Currently Building' },";
lines[408] = "            { num: '\u221E', label: 'Problems Left to Solve' },";
fs.writeFileSync('src/App.jsx', lines.join('\n'), 'utf8');
// Verify
const check = lines.slice(404, 412).join('\n');
console.log(check);

