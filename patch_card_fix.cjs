const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// replace inside return
const oldCardReturn = `              {(() => {
                const inUseCount = instances.filter(inst => inst.usage === '使用中').reduce((sum, inst) => sum + inst.qty, 0);
                return (
                  <span className="text-[10px] font-semibold text-retro-text/60 bg-stone-100 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-sm">
                    <span className="flex items-center gap-1">
                      <Package className="w-3 h-3 text-retro-primary" />
                      {totalQty}
                    </span>
                    {inUseCount > 0 && (
                      <>
                        <span className="w-px h-2.5 bg-stone-300"></span>
                        <span className="flex items-center gap-1">
                          <PackageOpen className="w-3 h-3 text-emerald-500" />
                          {inUseCount}
                        </span>
                      </>
                    )}
                  </span>
                );
              })()}`;

const newCardReturn = `              <span className="text-[10px] font-semibold text-retro-text/60 bg-stone-100 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-sm">
                <span className="flex items-center gap-1">
                  <Package className="w-3 h-3 text-retro-primary" />
                  {totalQty}
                </span>
                {instances.filter(inst => inst.usage === '使用中').reduce((sum, inst) => sum + inst.qty, 0) > 0 && (
                  <>
                    <span className="w-px h-2.5 bg-stone-300"></span>
                    <span className="flex items-center gap-1">
                      <PackageOpen className="w-3 h-3 text-emerald-500" />
                      {instances.filter(inst => inst.usage === '使用中').reduce((sum, inst) => sum + inst.qty, 0)}
                    </span>
                  </>
                )}
              </span>`;

code = code.replace(oldCardReturn, newCardReturn);

fs.writeFileSync('src/App.tsx', code);
