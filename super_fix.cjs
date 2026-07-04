const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const startIndex = content.indexOf('                  {/* Detailed Instances List */}');
const endIndex = content.indexOf("              ) : detailActiveTab === 'purchase' ? (");

if (startIndex !== -1 && endIndex !== -1) {
  const prefix = content.substring(0, startIndex);
  const suffix = content.substring(endIndex);
  
  const replacement = `                  {/* Detailed Instances List */}
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
                              
                              {/* The new Usage select replacing the badge */}
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
                            )}
                          </div>

                          {/* PAO Expiry / Date Details Grid */}
                          <div className="rounded-xl overflow-hidden bg-stone-50/50 mt-2 border border-retro-text/10">
                            {/* Row 1: Expiry */}
                            <div className="grid grid-cols-3 divide-x divide-retro-text/10 border-b border-retro-text/10 bg-retro-bg/30 text-[10px] font-bold text-retro-text/60">
                              <div className="px-3 py-1.5 flex items-center">數量 / 容量</div>
                              <div className="px-3 py-1.5 flex items-center">有效期限</div>
                              <div className="px-3 py-1.5 flex items-center">剩餘</div>
                            </div>
                            <div className="grid grid-cols-3 divide-x divide-retro-text/10 bg-white text-xs font-bold text-retro-text">
                              <div className="px-3 py-2.5 flex items-center">{inst.qty} / {inst.capacity || '-'}</div>
                              <div className="px-3 py-2.5 flex items-center">{inst.expiry ? inst.expiry : '-'}</div>
                              <div className="px-3 py-2.5 flex items-center justify-between">
                                <span className={isUrgent ? 'text-red-500' : ''}>
                                  {daysLeft !== 9999 ? \`\${daysLeft} 天\` : '-'}
                                </span>
                              </div>
                            </div>

                            {/* Row 2: PAO (Only if in use and has PAO) */}
                            {inst.usage === '使用中' && inst.paoMonths && inst.openedDate && pao && (
                              <>
                                <div className={\`grid grid-cols-3 divide-x divide-retro-text/10 border-b border-t border-retro-text/10 text-[10px] font-bold \${pao.isExpired ? 'bg-red-50 text-red-600/70' : 'bg-retro-bg/30 text-retro-text/60'}\`}>
                                  <div className="px-3 py-1.5 flex items-center">開封日期</div>
                                  <div className="px-3 py-1.5 flex items-center">使用期限</div>
                                  <div className="px-3 py-1.5 flex items-center">剩餘</div>
                                </div>
                                <div className={\`grid grid-cols-3 divide-x divide-retro-text/10 text-xs font-bold \${pao.isExpired ? 'bg-red-50/50 text-red-600' : 'bg-white text-retro-text'}\`}>
                                  <div className="px-3 py-2.5 flex items-center">{inst.openedDate}</div>
                                  <div className="px-3 py-2.5 flex items-center">{pao.expiryDate}</div>
                                  <div className="px-3 py-2.5 flex items-center justify-between">
                                    <span>
                                      {pao.isExpired ? \`\${pao.daysOverdue} 天 (過期)\` : \`\${pao.daysLeft} 天\`}
                                    </span>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
`;
  content = prefix + replacement + suffix;
  fs.writeFileSync('src/App.tsx', content);
  console.log('successfully cleaned the mess');
} else {
  console.log('could not find boundaries', startIndex, endIndex);
}
