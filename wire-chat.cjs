const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// Add ChatWidget import after existing imports
code = code.replace(
  "import { useState, useEffect, useRef } from 'react';",
  "import { useState, useEffect, useRef } from 'react';\nimport ChatWidget from './ChatWidget.jsx';"
);

// Add <ChatWidget /> inside the App return, before the closing div
code = code.replace(
  "      <ScrollProgressBar />\n      <Nav />",
  "      <ScrollProgressBar />\n      <ChatWidget />\n      <Nav />"
);

fs.writeFileSync('src/App.jsx', code, 'utf8');
console.log('ChatWidget added:', code.includes('ChatWidget'));

