const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  '            <div className="flex justify-between items-center mb-4 sticky top-0 bg-retro-card z-10 pb-2 border-b border-retro-text/5">',
  '            <div className="flex justify-between items-center mb-4 pb-2 border-b border-retro-text/5">'
);

fs.writeFileSync('src/App.tsx', code);
