const fs = require('fs');
let tsx = fs.readFileSync('src/App.tsx', 'utf-8');

tsx = tsx.replace(
  '{activeProducts.map(prod => (',
  `{[...activeProducts]
      .sort((a, b) => {
        const aOpened = a.instances.some(i => i.usage === '使用中') ? 1 : 0;
        const bOpened = b.instances.some(i => i.usage === '使用中') ? 1 : 0;
        return bOpened - aOpened;
      })
      .map(prod => (`
);
fs.writeFileSync('src/App.tsx', tsx);
console.log('done');
