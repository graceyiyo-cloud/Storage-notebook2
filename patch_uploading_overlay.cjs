const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const analyzingOverlay = `        {isAnalyzing && (
          <div className="fixed inset-0 bg-stone-900/85 z-50 flex items-center justify-center p-6 backdrop-blur-sm">
            <div className="bg-retro-card p-6 rounded-2xl max-w-sm w-full text-center shadow-2xl border border-retro-primary/20">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full border-4 border-retro-primary border-t-transparent animate-spin"></div>
                <h3 className="font-bold font-display text-lg tracking-wide flex items-center gap-1.5 justify-center">
                  <Sparkles className="w-5 h-5 text-retro-secondary animate-pulse" />
                  AI 影像辨識中...
                </h3>
                <div className="w-full bg-retro-bg rounded-full h-2 overflow-hidden mt-1">
                  <div className="bg-retro-primary h-full animate-progress" style={{ width: '75%' }}></div>
                </div>
                <p className="text-xs text-retro-text/75 font-semibold mt-1">{aiStatusText}</p>
              </div>
            </div>
          </div>
        )}`;

const uploadingOverlay = `
        {isUploading && (
          <div className="fixed inset-0 bg-stone-900/85 z-50 flex items-center justify-center p-6 backdrop-blur-sm">
            <div className="bg-retro-card p-6 rounded-2xl max-w-sm w-full text-center shadow-2xl border border-retro-primary/20">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full border-4 border-retro-primary border-t-transparent animate-spin"></div>
                <h3 className="font-bold font-display text-lg tracking-wide flex items-center gap-1.5 justify-center">
                  照片上傳中...
                </h3>
                <p className="text-xs text-retro-text/75 font-semibold mt-1">請稍候</p>
              </div>
            </div>
          </div>
        )}
`;

code = code.replace(analyzingOverlay, analyzingOverlay + uploadingOverlay);

fs.writeFileSync('src/App.tsx', code);
