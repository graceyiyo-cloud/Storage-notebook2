const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "    : (currentTab === 'settings' && settingsView === 'apikey') ? '#settings-apikey'",
  "    : (currentTab === 'settings' && settingsView === 'apikey') ? '#settings-apikey'\n    : (currentTab === 'settings' && settingsView === 'appearance') ? '#settings-appearance'\n    : (currentTab === 'settings' && settingsView === 'backup') ? '#settings-backup'"
);

const newCases = `      } else if (hash === '#settings-apikey') {
        setConfirmDialog(null);
        setCropImageSrc(null);
        setFullscreenImage(null);
        setShowAddForm(false);
        setSelectedDetailProduct(null);
        if (settingsView !== 'apikey') setSettingsView('apikey');
      } else if (hash === '#settings-appearance') {
        setConfirmDialog(null);
        setCropImageSrc(null);
        setFullscreenImage(null);
        setShowAddForm(false);
        setSelectedDetailProduct(null);
        if (settingsView !== 'appearance') setSettingsView('appearance');
      } else if (hash === '#settings-backup') {
        setConfirmDialog(null);
        setCropImageSrc(null);
        setFullscreenImage(null);
        setShowAddForm(false);
        setSelectedDetailProduct(null);
        if (settingsView !== 'backup') setSettingsView('backup');
      } else if (hash === '#settings-units') {
        setConfirmDialog(null);
        setCropImageSrc(null);
        setFullscreenImage(null);
        setShowAddForm(false);
        setSelectedDetailProduct(null);
        if (settingsView !== 'units') setSettingsView('units');`;

code = code.replace(
  "      } else if (hash === '#settings-apikey') {\n        setConfirmDialog(null);\n        setCropImageSrc(null);\n        setFullscreenImage(null);\n        setShowAddForm(false);\n        setSelectedDetailProduct(null);\n        if (settingsView !== 'apikey') setSettingsView('apikey');",
  newCases
);

fs.writeFileSync('src/App.tsx', code);
