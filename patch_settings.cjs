const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const oldThemeAndFont = `                  <div className="p-4 bg-white border border-retro-text/10 rounded-2xl shadow-sm flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-retro-text text-sm">視覺風格設定</span>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleThemeChange('retro')}
                        className={\`flex-1 py-2.5 text-sm font-bold rounded-xl border transition-all cursor-pointer \${appTheme === 'retro' ? 'border-retro-primary bg-retro-primary/10 text-retro-primary shadow-sm' : 'border-retro-text/10 bg-white text-retro-text/50 hover:text-retro-text hover:border-retro-text/20'}\`}
                      >復古風</button>
                      <button 
                        onClick={() => handleThemeChange('pixel')}
                        className={\`flex-1 py-2.5 text-sm font-bold rounded-xl border transition-all cursor-pointer \${appTheme === 'pixel' ? 'border-retro-primary bg-retro-primary/10 text-retro-primary shadow-sm' : 'border-retro-text/10 bg-white text-retro-text/50 hover:text-retro-text hover:border-retro-text/20'}\`}
                      >像素風</button>
                      <button 
                        onClick={() => handleThemeChange('minimal')}
                        className={\`flex-1 py-2.5 text-sm font-bold rounded-xl border transition-all cursor-pointer \${appTheme === 'minimal' ? 'border-retro-primary bg-retro-primary/10 text-retro-primary shadow-sm' : 'border-retro-text/10 bg-white text-retro-text/50 hover:text-retro-text hover:border-retro-text/20'}\`}
                      >文青風</button>
                    </div>
                  </div>

                  <div className="p-4 bg-white border border-retro-text/10 rounded-2xl shadow-sm flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600">
                        <Type className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-retro-text text-sm">字體大小設定</span>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleFontSizeChange('small')}
                        className={\`flex-1 py-2.5 text-sm font-bold rounded-xl border transition-all cursor-pointer \${appFontSize === 'small' ? 'border-retro-primary bg-retro-primary/10 text-retro-primary shadow-sm' : 'border-retro-text/10 bg-white text-retro-text/50 hover:text-retro-text hover:border-retro-text/20'}\`}
                      >小</button>
                      <button 
                        onClick={() => handleFontSizeChange('medium')}
                        className={\`flex-1 py-2.5 text-sm font-bold rounded-xl border transition-all cursor-pointer \${appFontSize === 'medium' ? 'border-retro-primary bg-retro-primary/10 text-retro-primary shadow-sm' : 'border-retro-text/10 bg-white text-retro-text/50 hover:text-retro-text hover:border-retro-text/20'}\`}
                      >中</button>
                      <button 
                        onClick={() => handleFontSizeChange('large')}
                        className={\`flex-1 py-2.5 text-sm font-bold rounded-xl border transition-all cursor-pointer \${appFontSize === 'large' ? 'border-retro-primary bg-retro-primary/10 text-retro-primary shadow-sm' : 'border-retro-text/10 bg-white text-retro-text/50 hover:text-retro-text hover:border-retro-text/20'}\`}
                      >大</button>
                    </div>
                  </div>`;

const newAppearanceBtn = `                  <button onClick={() => setSettingsView('appearance')} className="p-4 bg-white border border-retro-text/10 rounded-2xl shadow-sm hover:border-retro-primary/50 transition-all flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-retro-text text-sm">外觀設定 (風格與字體)</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-retro-text/30 group-hover:text-retro-primary transition-colors" />
                  </button>`;

code = code.replace(oldThemeAndFont, newAppearanceBtn);

const appearanceModal = `
            {settingsView === 'appearance' && (
              <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs z-50 flex justify-end p-0 animate-fade-in">
                <div className="w-full sm:w-96 bg-stone-50 h-full shadow-2xl flex flex-col animate-slide-in-right pb-safe">
                  <div className="p-4 flex items-center gap-3 border-b border-retro-text/10 bg-white">
                    <button onClick={() => setSettingsView(null)} className="w-10 h-10 flex flex-col items-center justify-center rounded-xl bg-stone-100 text-retro-text hover:bg-stone-200 transition-colors cursor-pointer">
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-lg font-bold font-display text-retro-text flex-1">外觀設定</h2>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-retro-primary" />
                        <h3 className="font-bold text-retro-text text-sm">視覺風格設定</h3>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleThemeChange('retro')}
                          className={\`flex-1 py-2.5 text-sm font-bold rounded-xl border transition-all cursor-pointer \${appTheme === 'retro' ? 'border-retro-primary bg-retro-primary/10 text-retro-primary shadow-sm' : 'border-retro-text/10 bg-white text-retro-text/50 hover:text-retro-text hover:border-retro-text/20'}\`}
                        >復古風</button>
                        <button 
                          onClick={() => handleThemeChange('pixel')}
                          className={\`flex-1 py-2.5 text-sm font-bold rounded-xl border transition-all cursor-pointer \${appTheme === 'pixel' ? 'border-retro-primary bg-retro-primary/10 text-retro-primary shadow-sm' : 'border-retro-text/10 bg-white text-retro-text/50 hover:text-retro-text hover:border-retro-text/20'}\`}
                        >像素風</button>
                        <button 
                          onClick={() => handleThemeChange('minimal')}
                          className={\`flex-1 py-2.5 text-sm font-bold rounded-xl border transition-all cursor-pointer \${appTheme === 'minimal' ? 'border-retro-primary bg-retro-primary/10 text-retro-primary shadow-sm' : 'border-retro-text/10 bg-white text-retro-text/50 hover:text-retro-text hover:border-retro-text/20'}\`}
                        >文青風</button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-2">
                        <Type className="w-5 h-5 text-retro-primary" />
                        <h3 className="font-bold text-retro-text text-sm">字體大小設定</h3>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleFontSizeChange('small')}
                          className={\`flex-1 py-2.5 text-sm font-bold rounded-xl border transition-all cursor-pointer \${appFontSize === 'small' ? 'border-retro-primary bg-retro-primary/10 text-retro-primary shadow-sm' : 'border-retro-text/10 bg-white text-retro-text/50 hover:text-retro-text hover:border-retro-text/20'}\`}
                        >小</button>
                        <button 
                          onClick={() => handleFontSizeChange('medium')}
                          className={\`flex-1 py-2.5 text-sm font-bold rounded-xl border transition-all cursor-pointer \${appFontSize === 'medium' ? 'border-retro-primary bg-retro-primary/10 text-retro-primary shadow-sm' : 'border-retro-text/10 bg-white text-retro-text/50 hover:text-retro-text hover:border-retro-text/20'}\`}
                        >中</button>
                        <button 
                          onClick={() => handleFontSizeChange('large')}
                          className={\`flex-1 py-2.5 text-sm font-bold rounded-xl border transition-all cursor-pointer \${appFontSize === 'large' ? 'border-retro-primary bg-retro-primary/10 text-retro-primary shadow-sm' : 'border-retro-text/10 bg-white text-retro-text/50 hover:text-retro-text hover:border-retro-text/20'}\`}
                        >大</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
`;

code = code.replace('{settingsView === \'history\' && (', appearanceModal + '\n            {settingsView === \'history\' && (');

fs.writeFileSync('src/App.tsx', code);
