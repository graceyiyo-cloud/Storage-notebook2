const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const target = `                              <span className={\`w-2 h-2 rounded-full ml-1 \${inst.usage === '使用中' ? 'bg-green-500 animate-pulse' : 'bg-stone-300'}\`}></span>
                              <span className="text-xs font-bold text-retro-text/80">{inst.usage}</span>
                            </div>
                            {/* Instance edit/archive buttons */}
                            {selectedDetailProduct.status !== 'archived' && (
                              <div className="flex items-center gap-2 bg-stone-50 rounded-lg px-2 py-0.5">
                                <button 
                                  onClick={() => {
                                    handleEditInstanceTrigger(selectedDetailProduct, inst);
                                    setSelectedDetailProduct(null); // Close modal
                                  }}
                                  className="action-btn-no-pixel text-retro-primary hover:text-retro-secondary p-0.5 transition-colors cursor-pointer"
                                  title="編輯此規格"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                <span className="w-[1px] h-3 bg-retro-text/10"></span>
                                <button 
                                  onClick={() => handleArchiveInstance(selectedDetailProduct.id, inst.id)}
                                  className="action-btn-no-pixel text-retro-secondary hover:text-red-500 p-0.5 transition-colors cursor-pointer"
                                  title="歸檔/封存此細項"
                                >
                                  <Archive className="w-3 h-3" />
                                </button>
                                <span className="w-[1px] h-3 bg-retro-text/10"></span>
                                <button 
                                  onClick={() => handleDeleteInstanceDirect(selectedDetailProduct.id, inst.id)}
                                  className="action-btn-no-pixel text-red-400 hover:text-red-600 p-0.5 transition-colors cursor-pointer"
                                  title="永久刪除此細項"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}`;

const replacement = `                              <div className="relative flex items-center gap-1 cursor-pointer bg-stone-100 hover:bg-stone-200 px-2 py-0.5 rounded-md transition-colors ml-1">
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
                                                  usage: val,
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
                                  className="action-btn-no-pixel text-retro-primary hover:text-retro-secondary p-0.5 transition-colors cursor-pointer"
                                  title="編輯此規格"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                <span className="w-[1px] h-3 bg-retro-text/10"></span>
                                <button 
                                  onClick={() => handleDeleteInstanceDirect(selectedDetailProduct.id, inst.id)}
                                  className="action-btn-no-pixel text-red-400 hover:text-red-600 p-0.5 transition-colors cursor-pointer"
                                  title="永久刪除此細項"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/App.tsx', content);
  console.log('patched');
} else {
  console.log('Target not found');
}
