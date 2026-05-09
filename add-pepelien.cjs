const fs = require('fs');
const https = require('https');

const opts = {
  hostname: 'api.github.com',
  path: '/repos/ZbienVC/portfolio/contents/src/App.jsx?ref=master',
  headers: { 'Authorization': 'token GITHUB_TOKEN_REDACTED', 'User-Agent': 'openclaw' }
};

https.get(opts, res => {
  let b = '';
  res.on('data', d => b += d);
  res.on('end', () => {
    let code = Buffer.from(JSON.parse(b).content, 'base64').toString('utf8');

    // 1. Add pepelien project before staywestpalm
    const pepelien = `  {
    id: 'pepelien',
    name: '$PEPELIEN',
    tagline: 'Elon. Pepe. Alien. On Solana.',
    description: 'A fully custom memecoin website for $PEPELIEN on Solana. Space/alien theme, Orbitron font, matrix rain + particle burst effects, Gigachad meme vault, live DexScreener chart, and full Web3 CTAs.',
    status: 'live',
    url: 'https://pepelien.com',
    github: 'https://github.com/ZbienVC/pepelien',
    color: '#39FF14',
    colorEnd: '#4CAF50',
    tagClass: '',
    tags: ['Next.js', 'TypeScript', 'Tailwind', 'Framer Motion', 'Solana'],
    emoji: '\u{1F47D}',
    highlights: ['Matrix rain + particle burst entry', 'Orbitron space font system', 'Glitch title effect', 'Live Solana chart embed'],
  },
`;
    code = code.replace("  {\n    id: 'staywestpalm',", pepelien + "  {\n    id: 'staywestpalm',");

    // 2. Add pepelien to crypto category
    code = code.replace(
      "crypto: PROJECTS.filter(p => ['splash','gigaton','omo'].includes(p.id))",
      "crypto: PROJECTS.filter(p => ['splash','gigaton','omo','pepelien'].includes(p.id))"
    );

    // 3. Update hero stats — now 10 live
    code = code.replace(
      "{ num: '9', label: 'Live in Production' },",
      "{ num: '10', label: 'Live in Production' },"
    );

    fs.writeFileSync('src/App.jsx', code, 'utf8');
    console.log('pepelien added:', code.includes("id: 'pepelien'"));
    console.log('10 live:', code.includes("'10', label: 'Live in Production'"));
    console.log('crypto tab updated:', code.includes("'pepelien'"));
  });
});

