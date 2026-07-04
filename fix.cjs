const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const target = `                    }
                                               <div className="relative flex items-center gap-1 cursor-pointer bg-stone-100 hover:bg-stone-200 px-2 py-0.5 rounded-md transition-colors ml-1">
                                <span className={\`w-2 h-2 rounded-full \${inst.usage === '使用中' ? 'bg-green-500 animate-pulse' : 'bg-stone-300'}\`}></span>
                                <select
                                  value={inst.usage === '未開封' ? '未開封' : '使用中'}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === 'archived') {
                                      handleArchiveInstance(selectedDetailProduct.id, inst.id);
                                    } else {
                                      const nextProducts = products.map(prod => {
                                        if (prod.id === selectedDetailProduct.id) {
                                          return {
                                            ...prod,
                                            instances: prod.instances.map(i => {
                                              if (i.id === inst.id) {
                                                return { 
                                                  ...i, 
                                                  usage: val as any,
                                                  openedDate: val === '使用中' && !i.openedDate ? new Date().toISOString().split('T')[0] : i.openedDate
                                                };
                                              }
                                              return i;
                                            })
                                          };
                                        }
                                        return prod;
                                      });
                                      setProducts(nextProducts);
                                      const updated = nextProducts.find(p => p.id === selectedDetailProduct.id);
                                      if (updated) setSelectedDetailProduct(updated);
                                      showToast(\`狀態已變更為：\${val === '未開封' ? '未使用' : '已開封'}\`);
                                    }
                                  }}
                                  className="text-xs font-bold text-retro-text/80 bg-transparent outline-none cursor-pointer appearance-none pr-3 relative z-10"
                                >
                                  <option value="未開封">未使用</option>
                                  <option value="使用中">已開封</option>
                                  <option value="archived">封存</option>
                                </select>
                                <ChevronDown className="w-3 h-3 absolute right-1 text-retro-text/40 pointer-events-none" />
                              </div>
                            </div>
                            {/* Instance edit/archive buttons */}
                            {selectedDetailProduct.status !== 'archived' && (
                              <div className="flex items-center gap-2 bg-stone-50 rounded-lg px-2 py-0.5">
                                <button 
                                  onClick={() => {
                                    handleEditInstanceTrigger(selectedDetailProduct, inst);
                                    setSelectedDetailProduct(null); // Close modal
                                  }}
                                  className="action-btn-no-pixel text-retro-primary hover:text-retro-secondary p-0.5 transition-colors cursor-pointer"`;

const replacement = `                    }
                    return null;
                  })()}

                  {/* Bento Stats Counters */}
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="bg-stone-50 p-2.5 rounded-xl border border-retro-text/5 text-center flex flex-col justify-between min-h-[70px]">
                      <span className="text-[10px] font-bold text-retro-text/50">總數量</span>
                      <span className="text-xl font-extrabold text-retro-primary font-mono">
                        {selectedDetailProduct.instances.reduce((sum, inst) => sum + inst.qty, 0)}
                      </span>
                    </div>
                    <div className="bg-stone-50 p-2.5 rounded-xl border border-retro-text/5 text-center flex flex-col justify-between min-h-[70px]">
                      <span className="text-[10px] font-bold text-retro-text/50">開封中數量</span>
                      <span className="text-xl font-extrabold text-green-600 font-mono">
                        {selectedDetailProduct.instances.filter(inst => inst.usage === '使用中').reduce((sum, inst) => sum + inst.qty, 0)}
                      </span>
                    </div>
                    <div className="bg-stone-50 p-2.5 rounded-xl border border-retro-text/5 text-center flex flex-col justify-between min-h-[70px]">
                      <span className="text-[10px] font-bold text-retro-text/50">最近到期天數</span>
                      <div className="flex flex-col items-center">
                        <span className="text-xl font-extrabold text-amber-600 font-mono leading-none">
                          {(() => {
                            let minDays = 9999;
                            selectedDetailProduct.instances.forEach(inst => {
                              const days = calculateDaysToExpiry(inst.expiry);
                              if (days < minDays) minDays = days;
                            });
                            return minDays !== 9999 ? minDays : '-';
                          })()}
                        </span>
                        {(() => {
                          let closestDate = null;
                          let minDays = 9999;
                          selectedDetailProduct.instances.forEach(inst => {
                            const days = calculateDaysToExpiry(inst.expiry);
                            if (days < minDays && inst.expiry) {
                              minDays = days;
                              closestDate = inst.expiry;
                            }
                          });
                          return minDays !== 9999 && closestDate ? (
                            <span className="text-[9px] font-bold text-retro-text/40 mt-1">
                              {closestDate.replace(/-/g, '/')}
                            </span>
                          ) : null;
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Detailed Instances List */}
                  <div className="space-y-3">
                    <span className="text-[11px] font-extrabold text-retro-text/50 uppercase tracking-wider block">
                      📋 規格明細與狀態
                    </span>
                    {selectedDetailProduct.instances.map((inst, index) => {
                      const daysLeft = calculateDaysToExpiry(inst.expiry);
                      const isUrgent = daysLeft <= 60;
                      const pao = calculatePaoExpiry(inst.openedDate, inst.paoMonths);

                      return (
                        <div key={inst.id} className="p-3 bg-white rounded-xl border border-retro-text/10 space-y-2 shadow-xs">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-retro-text bg-retro-bg/40 px-2 py-0.5 rounded-lg flex items-center gap-1">
                                <Package className="w-3 h-3 text-retro-primary" />
                                {inst.qty} 件
                              </span>
                              {inst.capacity && (
                                <span className="text-xs font-bold text-retro-primary bg-retro-primary/10 px-2 py-0.5 rounded-lg">
                                  {inst.capacity}
                                </span>
                              )}
                              <div className="relative flex items-center gap-1 cursor-pointer bg-stone-100 hover:bg-stone-200 px-2 py-0.5 rounded-md transition-colors ml-1">
                                <span className={\`w-2 h-2 rounded-full \${inst.usage === '使用中' ? 'bg-green-500 animate-pulse' : 'bg-stone-300'}\`}></span>
                                <select
                                  value={inst.usage === '未開封' ? '未開封' : '使用中'}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === 'archived') {
                                      handleArchiveInstance(selectedDetailProduct.id, inst.id);
                                    } else {
                                      const nextProducts = products.map(prod => {
                                        if (prod.id === selectedDetailProduct.id) {
                                          return {
                                            ...prod,
                                            instances: prod.instances.map(i => {
                                              if (i.id === inst.id) {
                                                return { 
                                                  ...i, 
                                                  usage: val as any,
                                                  openedDate: val === '使用中' && !i.openedDate ? new Date().toISOString().split('T')[0] : i.openedDate
                                                };
                                              }
                                              return i;
                                            })
                                          };
                                        }
                                        return prod;
                                      });
                                      setProducts(nextProducts);
                                      const updated = nextProducts.find(p => p.id === selectedDetailProduct.id);
                                      if (updated) setSelectedDetailProduct(updated);
                                      showToast(\`狀態已變更為：\${val === '未開封' ? '未使用' : '已開封'}\`);
                                    }
                                  }}
                                  className="text-xs font-bold text-retro-text/80 bg-transparent outline-none cursor-pointer appearance-none pr-3 relative z-10"
                                >
                                  <option value="未開封">未使用</option>
                                  <option value="使用中">已開封</option>
                                  <option value="archived">封存</option>
                                </select>
                                <ChevronDown className="w-3 h-3 absolute right-1 text-retro-text/40 pointer-events-none" />
                              </div>
                            </div>
                            
                            {/* Instance edit/delete buttons */}
                            {selectedDetailProduct.status !== 'archived' && (
                              <div className="flex items-center gap-2 bg-stone-50 rounded-lg px-2 py-0.5">
                                <button 
                                  onClick={() => {
                                    handleEditInstanceTrigger(selectedDetailProduct, inst);
                                    setSelectedDetailProduct(null); // Close modal
                                  }}
                                  className="action-btn-no-pixel text-retro-primary hover:text-retro-secondary p-0.5 transition-colors cursor-pointer"`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  
  // also clean up the old archive button that's left below
  const oldArchive = `<span className="w-[1px] h-3 bg-retro-text/10"></span>
                                <button 
                                  onClick={() => handleArchiveInstance(selectedDetailProduct.id, inst.id)}
                                  className="action-btn-no-pixel text-retro-secondary hover:text-red-500 p-0.5 transition-colors cursor-pointer"
                                  title="歸檔/封存此細項"
                                >
                                  <Archive className="w-3 h-3" />
                                </button>`;
  content = content.replace(oldArchive, '');
  
  fs.writeFileSync('src/App.tsx', content);
  console.log('patched');
} else {
  console.log('Target not found');
}
