const fs = require('fs');
let tsx = fs.readFileSync('src/App.tsx', 'utf-8');

const targetStr = `              {/* Requirement 3: Period After Opening (PAO) & Opening Date fields */}
              {(formUsage === '使用中' || formUsage === '已用完' || formUsage === '已丟棄') && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-retro-text/75 mb-1 flex items-center gap-1 text-retro-secondary">
                      <Calendar className="w-3.5 h-3.5" />
                      開封日期
                    </label>
                    <input 
                      type="date" 
                      value={formOpenedDate}
                      onChange={(e) => setFormOpenedDate(e.target.value)}
                      className="w-full p-2.5 bg-white/50 border border-retro-text/10 rounded-xl text-sm text-retro-text focus:outline-none focus:border-retro-primary font-medium"
                    />
                  </div>
                  {formUsage === '使用中' ? (
                    <div>
                      <label className="block text-xs font-bold text-retro-text/75 mb-1 flex items-center gap-1 text-retro-secondary">
                        <ClockIcon className="w-3.5 h-3.5" />
                        開封後可使用月數
                      </label>
                      <input 
                        type="number" 
                        min="1"
                        placeholder="例如: 6, 12, 24"
                        value={formPaoMonths}
                        onChange={(e) => setFormPaoMonths(e.target.value)}
                        className="w-full p-2.5 bg-white/50 border border-retro-text/10 rounded-xl text-sm text-retro-text focus:outline-none focus:border-retro-primary font-medium"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-retro-text/75 mb-1 flex items-center gap-1 text-retro-secondary">
                        <Calendar className="w-3.5 h-3.5" />
                        結束日期
                      </label>
                      <input 
                        type="date" 
                        value={formFinishedDate}
                        onChange={(e) => setFormFinishedDate(e.target.value)}
                        className="w-full p-2.5 bg-white/50 border border-retro-text/10 rounded-xl text-sm text-retro-text focus:outline-none focus:border-retro-primary font-medium"
                      />
                    </div>
                  )}
                </div>
              )}`;

const replacement = `              {/* Requirement 3: Period After Opening (PAO) & Opening Date fields */}
              <div className="grid grid-cols-2 gap-3">
                {/* 開封日期 (只有 未開封 不顯示) */}
                {formUsage !== '未開封' && (
                  <div>
                    <label className="block text-xs font-bold text-retro-text/75 mb-1 flex items-center gap-1 text-retro-secondary">
                      <Calendar className="w-3.5 h-3.5" />
                      開封日期
                    </label>
                    <input 
                      type="date" 
                      value={formOpenedDate}
                      onChange={(e) => setFormOpenedDate(e.target.value)}
                      className="w-full p-2.5 bg-white/50 border border-retro-text/10 rounded-xl text-sm text-retro-text focus:outline-none focus:border-retro-primary font-medium"
                    />
                  </div>
                )}
                
                {/* 結束日期 (只有 已用完/已丟棄 顯示) */}
                {(formUsage === '已用完' || formUsage === '已丟棄') && (
                  <div>
                    <label className="block text-xs font-bold text-retro-text/75 mb-1 flex items-center gap-1 text-retro-secondary">
                      <Calendar className="w-3.5 h-3.5" />
                      結束日期
                    </label>
                    <input 
                      type="date" 
                      value={formFinishedDate}
                      onChange={(e) => setFormFinishedDate(e.target.value)}
                      className="w-full p-2.5 bg-white/50 border border-retro-text/10 rounded-xl text-sm text-retro-text focus:outline-none focus:border-retro-primary font-medium"
                    />
                  </div>
                )}

                {/* PAO (未開封 或 使用中 顯示) */}
                {(formUsage === '使用中' || formUsage === '未開封') && (
                  <div className={formUsage === '未開封' ? 'col-span-2' : ''}>
                    <label className="block text-xs font-bold text-retro-text/75 mb-1 flex items-center gap-1 text-retro-secondary">
                      <ClockIcon className="w-3.5 h-3.5" />
                      開封後可使用月數
                    </label>
                    <input 
                      type="number" 
                      min="1"
                      placeholder="例如: 6, 12, 24"
                      value={formPaoMonths}
                      onChange={(e) => setFormPaoMonths(e.target.value)}
                      className="w-full p-2.5 bg-white/50 border border-retro-text/10 rounded-xl text-sm text-retro-text focus:outline-none focus:border-retro-primary font-medium"
                    />
                  </div>
                )}
              </div>`;

if (tsx.includes(targetStr)) {
  tsx = tsx.replace(targetStr, replacement);
  fs.writeFileSync('src/App.tsx', tsx);
  console.log("Replaced successfully!");
} else {
  console.log("Could not find target string.");
}
