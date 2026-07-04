const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const targetLine1 = `<span className="text-[10px] font-semibold text-retro-text/50 bg-stone-100 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Package className="w-3 h-3 text-retro-primary" />
              共 {totalQty} 件
            </span>`;

const newCode1 = `
            <span className="text-[10px] font-semibold text-retro-text/60 bg-stone-100 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-sm">
              <span className="flex items-center gap-1">
                <Package className="w-3 h-3 text-retro-primary" />
                {totalQty}
              </span>
              <span className="w-px h-2.5 bg-stone-300"></span>
              <span className="flex items-center gap-1">
                <Unlock className="w-3 h-3 text-emerald-500" />
                {instances.filter(inst => inst.usage === '使用中').reduce((sum, inst) => sum + inst.qty, 0)}
              </span>
            </span>
`;

code = code.replace(targetLine1, newCode1);

fs.writeFileSync('src/App.tsx', code);
