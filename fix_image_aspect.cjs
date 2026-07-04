const fs = require('fs');

let tsx = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Form preview
tsx = tsx.replace(
  'className="w-10 h-10 rounded-lg object-cover border border-retro-text/10"',
  'className="h-10 w-auto max-w-[4rem] rounded-lg object-cover border border-retro-text/10"'
);

// 2. Detail view
tsx = tsx.replace(
  'className="w-14 h-18 rounded-xl object-cover border border-retro-text/10 shadow-sm cursor-pointer hover:scale-105 transition-transform"',
  'className="h-18 w-auto max-w-[8rem] rounded-xl object-cover border border-retro-text/10 shadow-sm cursor-pointer hover:scale-105 transition-transform"'
);
// detail view empty state also needs to not look weird? It's currently w-14 h-18. We can leave the empty state alone.

// 3. ProductCard
tsx = tsx.replace(
  'className="w-11 h-14 rounded-lg object-cover border border-retro-text/10 shadow-sm group-hover:scale-105 transition-transform"',
  'className="h-14 w-auto max-w-[6rem] rounded-lg object-cover border border-retro-text/10 shadow-sm group-hover:scale-105 transition-transform"'
);

fs.writeFileSync('src/App.tsx', tsx);
console.log('done fixing image aspect ratios');
