const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const oldStatsFn = `  const getSubcategoryStats = (subName: string, categoryId: string) => {
    const matchedProds = products.filter(p => p.status === 'active' && p.category === categoryId && p.subcategory === subName);
    const totalCount = matchedProds.length;
    let totalQty = 0;
    matchedProds.forEach(p => {
      p.instances.forEach(i => {
        totalQty += i.qty;
      });
    });
    return { count: totalCount, qty: totalQty };
  };`;

const newStatsFn = `  const getSubcategoryStats = (subName: string, categoryId: string) => {
    const matchedProds = products.filter(p => p.status === 'active' && p.category === categoryId && p.subcategory === subName);
    const totalCount = matchedProds.length;
    let totalQty = 0;
    let openedQty = 0;
    matchedProds.forEach(p => {
      p.instances.forEach(i => {
        totalQty += i.qty;
        if (i.usage === '使用中') {
          openedQty += i.qty;
        }
      });
    });
    return { count: totalCount, qty: totalQty, openedQty };
  };`;

code = code.replace(oldStatsFn, newStatsFn);

const oldSubHeader = `<span className="ml-auto text-[10px] bg-retro-primary/10 text-retro-primary px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                            <span>{stats.count}件</span>
                            <span className="opacity-40">|</span>
                            <Package className="w-3 h-3" />
                            <span>{stats.qty}</span>
                          </span>`;

const newSubHeader = `<span className="ml-auto text-[10px] bg-retro-primary/10 text-retro-primary px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5 shadow-sm">
                            <span className="flex items-center gap-1" title="總數量">
                              <Package className="w-3 h-3" />
                              <span>{stats.qty}</span>
                            </span>
                            <span className="w-px h-2.5 bg-retro-primary/20"></span>
                            <span className="flex items-center gap-1 text-emerald-600" title="使用中">
                              <Unlock className="w-3 h-3" />
                              <span>{stats.openedQty}</span>
                            </span>
                          </span>`;

code = code.replace(oldSubHeader, newSubHeader);

fs.writeFileSync('src/App.tsx', code);
