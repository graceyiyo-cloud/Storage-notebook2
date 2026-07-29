const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  '  ChevronRight, PackageOpen,',
  '  ChevronRight, PackageOpen, Copy,'
);

fs.writeFileSync('src/App.tsx', code);
