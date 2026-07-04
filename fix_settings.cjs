const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Add ArrowLeft import
if (!code.includes('ArrowLeft,')) {
    code = code.replace('ImageIcon,', 'ImageIcon,\n  ArrowLeft,');
}

// 2. Fix settingsView type
code = code.replace(
    "useState<'menu' | 'apikey' | 'category' | 'history'>('menu');",
    "useState<'menu' | 'apikey' | 'category' | 'history' | 'appearance' | 'backup'>('menu');"
);

// 3. Fix setSettingsView(null) to setSettingsView('menu')
code = code.replace(
    "onClick={() => setSettingsView(null)}",
    "onClick={() => setSettingsView('menu')}"
);

fs.writeFileSync('src/App.tsx', code);
