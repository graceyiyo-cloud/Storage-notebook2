const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  'className={`py-3.5 pr-4 pl-2.5 sm:pl-3 rounded-2xl flex items-center justify-between',
  'className={`py-3.5 pr-4 pl-1.5 sm:pl-2 rounded-2xl flex items-center justify-between'
);

code = code.replace(
  '<div className="flex gap-3 items-center min-w-0 flex-1">',
  '<div className="flex gap-2.5 items-center min-w-0 flex-1">'
);

fs.writeFileSync('src/App.tsx', code);
