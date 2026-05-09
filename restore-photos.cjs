const fs = require('fs');
const https = require('https');

const opts = {
  hostname: 'api.github.com',
  path: '/repos/ZbienVC/portfolio/contents/src/App.jsx?ref=bdf61f8',
  headers: { 'Authorization': 'token GITHUB_TOKEN_REDACTED', 'User-Agent': 'openclaw' }
};

https.get(opts, res => {
  let b = '';
  res.on('data', d => b += d);
  res.on('end', () => {
    const base = Buffer.from(JSON.parse(b).content, 'base64').toString('utf8');

    // Extract LIFE_PHOTOS constant from base
    const lifePhotosStart = base.indexOf('const LIFE_PHOTOS');
    const microAppsStart = base.indexOf('// \u2500\u2500 Micro-Apps');
    const lifePhotosBlock = base.slice(lifePhotosStart, microAppsStart);

    let current = fs.readFileSync('src/App.jsx', 'utf8');

    // Check if LIFE_PHOTOS is missing
    if (current.includes('const LIFE_PHOTOS')) {
      console.log('LIFE_PHOTOS already present');
      process.exit(0);
    }

    // Insert before function LifeSection
    const lifeIdx = current.indexOf('function LifeSection()');
    current = current.slice(0, lifeIdx) + lifePhotosBlock + current.slice(lifeIdx);

    fs.writeFileSync('src/App.jsx', current, 'utf8');
    console.log('LIFE_PHOTOS restored:', current.includes('const LIFE_PHOTOS'));
    console.log('Lines:', current.split('\n').length);
  });
});

