const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// Move pepelien before omo in crypto filter so it appears as featured card
code = code.replace(
  "crypto: PROJECTS.filter(p => ['splash','gigaton','omo','pepelien'].includes(p.id))",
  "crypto: PROJECTS.filter(p => ['splash','pepelien','omo','gigaton'].includes(p.id))"
);

fs.writeFileSync('src/App.jsx', code, 'utf8');
console.log('done:', code.includes("'splash','pepelien','omo'"));

