const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// The filter preserves PROJECTS array order, not the filter array order.
// Need to sort results by our desired order explicitly.
code = code.replace(
  "crypto: PROJECTS.filter(p => ['splash','pepelien','omo','gigaton'].includes(p.id))",
  `crypto: ['splash','pepelien','omo','gigaton'].map(id => PROJECTS.find(p => p.id === id)).filter(Boolean)`
);

fs.writeFileSync('src/App.jsx', code, 'utf8');
console.log('done:', code.includes("['splash','pepelien','omo','gigaton'].map"));

