const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const target = `                            if (days < minDays && inst.expiry) {
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
                              {inst.capacity && (`;

if (content.includes(target)) {
  content = content.replace(target, `                            )}
                          </div>
                          
                          {/* PAO Expiry / Date Details */}
                          <div className="grid grid-cols-2 gap-2 mt-2 bg-stone-50/50 p-2 rounded-lg">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3 h-3 text-retro-text/40" />
                                <span className="text-[10px] font-bold text-retro-text/60">有效期限</span>
                              </div>
                              <span className={\`text-xs font-bold \${isUrgent ? 'text-red-500 animate-pulse' : 'text-retro-text'}\`}>
                                {inst.expiry.replace(/-/g, '/')} 
                                <span className="text-[9px] text-retro-text/40 ml-1">
                                  ({daysLeft < 0 ? '已過期' : \`剩 \${daysLeft} 天\`})
                                </span>
                              </span>
                            </div>
                            
                            {(inst.openedDate || inst.paoMonths) && (
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1.5">
                                  <Info className="w-3 h-3 text-retro-text/40" />
                                  <span className="text-[10px] font-bold text-retro-text/60">開封狀態</span>
                                </div>
                                <span className="text-xs font-bold text-retro-secondary flex flex-col">
                                  {inst.openedDate && <span>已於 {inst.openedDate.replace(/-/g, '/')} 開封</span>}
                                  {pao && <span className="text-[9px] text-amber-600">建議在 {pao.date.replace(/-/g, '/')} 前用完</span>}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>`);
  fs.writeFileSync('src/App.tsx', content);
  console.log('patched');
} else {
  console.log('not found');
}
