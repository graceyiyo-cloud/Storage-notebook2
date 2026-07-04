const fs = require('fs');
let code = fs.readFileSync('vite.config.ts', 'utf-8');
code = code.replace(/base:\s*['"`].*?['"`],/, "base: './',");
fs.writeFileSync('vite.config.ts', code);
