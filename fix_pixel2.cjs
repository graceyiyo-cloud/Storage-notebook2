const fs = require('fs');

let css = fs.readFileSync('src/index.css', 'utf-8');
css = css + '\n\n[data-theme="pixel"] .pixel-box {\n  border: 1px solid var(--theme-text) !important;\n  box-shadow: 1px 1px 0px var(--theme-text) !important;\n}\n';
fs.writeFileSync('src/index.css', css);

let tsx = fs.readFileSync('src/App.tsx', 'utf-8');
const target = `<div className="relative flex items-center gap-1 cursor-pointer bg-stone-100 hover:bg-stone-200 px-2 py-0.5 rounded-md transition-colors ml-1 border border-transparent">`;
const replacement = `<div className="relative flex items-center gap-1 cursor-pointer bg-stone-100 hover:bg-stone-200 px-2 py-0.5 rounded-md transition-colors ml-1 pixel-box">`;

tsx = tsx.replace(target, replacement);

fs.writeFileSync('src/App.tsx', tsx);
console.log('fixed 2');
