const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace handleImportBackup definition to clear the file input after using
code = code.replace(
  '  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {',
  '  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {\n    const target = e.target;'
);

code = code.replace(
  '        // Force save to localStorage immediately',
  '        // Force save to localStorage immediately\n          target.value = ""; // clear input'
);


code = code.replace(
  'const file = e.target.files?.[0];',
  'const file = target.files?.[0];'
);


// Replace label with button and useRef
const oldLabel = `<label className="w-full flex items-center justify-center gap-2 bg-white border border-retro-primary text-retro-primary py-3 rounded-xl font-bold hover:bg-retro-primary/5 transition-all cursor-pointer">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                      從備份檔還原
                      <input type="file" accept=".json" className="hidden" onChange={handleImportBackup} />
                    </label>`;

const newButton = `<button 
                      onClick={() => document.getElementById('backupFileInput')?.click()}
                      className="w-full flex items-center justify-center gap-2 bg-white border border-retro-primary text-retro-primary py-3 rounded-xl font-bold hover:bg-retro-primary/5 transition-all cursor-pointer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                      從備份檔還原
                    </button>
                    <input id="backupFileInput" type="file" accept=".json" className="hidden" onChange={handleImportBackup} />`;

code = code.replace(oldLabel, newButton);

fs.writeFileSync('src/App.tsx', code);
