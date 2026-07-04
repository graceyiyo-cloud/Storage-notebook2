const fs = require('fs');
const content = fs.readFileSync('cached_App.tsx.js', 'utf8');
const match = content.match(/\/\/# sourceMappingURL=data:application\/json;base64,(.+)$/);
if (match) {
  const base64 = match[1];
  const json = Buffer.from(base64, 'base64').toString('utf8');
  const sourcemap = JSON.parse(json);
  const sourceIndex = sourcemap.sources.findIndex(s => s.includes('App.tsx'));
  if (sourceIndex !== -1) {
    fs.writeFileSync('src/App.tsx', sourcemap.sourcesContent[sourceIndex]);
    console.log('Successfully recovered App.tsx!');
  } else {
    console.log('App.tsx not found in sourcemap sources:', sourcemap.sources);
  }
} else {
  console.log('No sourcemap found in file.');
}
