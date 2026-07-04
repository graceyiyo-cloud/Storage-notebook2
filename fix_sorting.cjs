const fs = require('fs');
let tsx = fs.readFileSync('src/App.tsx', 'utf-8');

tsx = tsx.replace(
  'const groupProds = activeProducts.filter(p => p.subcategory === subName);',
  `const groupProds = activeProducts
                      .filter(p => p.subcategory === subName)
                      .sort((a, b) => {
                        const aOpened = a.instances.some(i => i.usage === '使用中') ? 1 : 0;
                        const bOpened = b.instances.some(i => i.usage === '使用中') ? 1 : 0;
                        return bOpened - aOpened;
                      });`
);
fs.writeFileSync('src/App.tsx', tsx);
console.log('done');
