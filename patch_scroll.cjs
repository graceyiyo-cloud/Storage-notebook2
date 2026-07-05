const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/    setTimeout\(\(\) => \{\n      document\.getElementById\('manual-add-form'\)\?\.scrollIntoView\(\{ behavior: 'smooth' \}\);\n    \}, 100\);/g, '');
code = code.replace(/                setTimeout\(\(\) => \{\n                  document\.getElementById\('manual-add-form'\)\?\.scrollIntoView\(\{ behavior: 'smooth' \}\);\n                \}, 100\);/g, '');

fs.writeFileSync('src/App.tsx', code);
