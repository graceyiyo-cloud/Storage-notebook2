const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  'className={`p-4 rounded-2xl flex items-center justify-between',
  'className={`py-3.5 pr-4 pl-2.5 sm:pl-3 rounded-2xl flex items-center justify-between'
);

code = code.replace(
  '<div className="flex gap-3.5 items-center min-w-0 flex-1">',
  '<div className="flex gap-3 items-center min-w-0 flex-1">'
);

code = code.replace(
  '<div className="flex items-center gap-3 ml-3 flex-shrink-0">',
  '<div className="flex items-center gap-2 sm:gap-3 ml-2 flex-shrink-0">'
);

fs.writeFileSync('src/App.tsx', code);
