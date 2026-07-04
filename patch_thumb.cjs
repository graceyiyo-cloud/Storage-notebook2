const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  '<div className="w-16 h-16 flex-shrink-0 flex items-center justify-center">',
  '<div className="w-12 h-14 sm:w-14 sm:h-14 flex-shrink-0 flex items-center justify-center">'
);

// We should also make sure object-cover is an option or keep object-contain but it's now inside a narrower container.
// Let's keep object-contain, but because width is 12 (48px) instead of 16 (64px), we gain 16px for the text.

fs.writeFileSync('src/App.tsx', code);
