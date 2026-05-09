const fs = require('fs');
const https = require('https');

// Get the base file which has LifeSection intact
const opts = {
  hostname: 'api.github.com',
  path: '/repos/ZbienVC/portfolio/contents/src/App.jsx?ref=bdf61f8',
  headers: {
    'Authorization': 'token GITHUB_TOKEN_REDACTED',
    'User-Agent': 'openclaw',
  }
};

https.get(opts, res => {
  let b = '';
  res.on('data', d => b += d);
  res.on('end', () => {
    const base = Buffer.from(JSON.parse(b).content, 'base64').toString('utf8');
    
    // Extract LifeSection from base
    const lifeStart = base.indexOf('function LifeSection()');
    const skillsStart = base.indexOf('function SkillsSection()');
    const lifeSection = base.slice(lifeStart, skillsStart);
    
    // Get current file
    let current = fs.readFileSync('src/App.jsx', 'utf8');
    
    // Insert LifeSection before SkillsSection
    const skillsIdx = current.indexOf('function SkillsSection()');
    current = current.slice(0, skillsIdx) + lifeSection + current.slice(skillsIdx);
    
    fs.writeFileSync('src/App.jsx', current, 'utf8');
    
    console.log('LifeSection restored:', current.includes('function LifeSection'));
    console.log('SkillsSection still there:', current.includes('function SkillsSection'));
    console.log('ContactSection still there:', current.includes('function ContactSection'));
    console.log('Total lines:', current.split('\n').length);
  });
});

