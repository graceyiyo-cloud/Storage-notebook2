const fs = require('fs');

let css = fs.readFileSync('src/index.css', 'utf-8');
css = css.replace(
  '[data-theme="pixel"] nav button,\n[data-theme="pixel"] button.action-btn-no-pixel {',
  '[data-theme="pixel"] nav button,\n[data-theme="pixel"] button.action-btn-no-pixel,\n[data-theme="pixel"] .no-pixel-border {'
);
fs.writeFileSync('src/index.css', css);

let tsx = fs.readFileSync('src/App.tsx', 'utf-8');
const target = `<div className="relative flex items-center gap-1 cursor-pointer bg-stone-100 hover:bg-stone-200 px-2 py-0.5 rounded-md transition-colors ml-1">
                                <span className={\`w-2 h-2 rounded-full \${inst.usage === '使用中' ? 'bg-green-500 animate-pulse' : 'bg-stone-300'}\`}></span>
                                <select`;

const replacement = `<div className="relative flex items-center gap-1 cursor-pointer bg-stone-100 hover:bg-stone-200 px-2 py-0.5 rounded-md transition-colors ml-1 border border-transparent">
                                <span className={\`w-2 h-2 rounded-full \${inst.usage === '使用中' ? 'bg-green-500 animate-pulse' : 'bg-stone-300'}\`}></span>
                                <select`;

tsx = tsx.replace(target, replacement);

const targetSelect = `className="text-xs font-bold text-retro-text/80 bg-transparent outline-none cursor-pointer appearance-none pr-3 relative z-10"`;
const replacementSelect = `className="text-xs font-bold text-retro-text/80 bg-transparent outline-none cursor-pointer appearance-none pr-3 relative z-10 no-pixel-border"`;
tsx = tsx.replace(targetSelect, replacementSelect);

fs.writeFileSync('src/App.tsx', tsx);
console.log('fixed');
