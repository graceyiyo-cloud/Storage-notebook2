const fs = require('fs');

let tsx = fs.readFileSync('src/App.tsx', 'utf-8');

const modalTargetStart = `{/* ==================== Image Cropper Modal ==================== */}`;
const modalTargetEnd = `{/* ==================== 10. Fullscreen Image Modal ==================== */}`;
const startIdx = tsx.indexOf(modalTargetStart);
const endIdx = tsx.indexOf(modalTargetEnd);

if (startIdx !== -1 && endIdx !== -1) {
  const newModalStr = `{/* ==================== Image Cropper Modal ==================== */}
      {cropImageSrc && (
        <div className="fixed inset-0 bg-stone-900/95 backdrop-blur-md z-[120] flex flex-col items-center justify-center animate-fade-in p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-black rounded-lg overflow-hidden flex flex-col items-center justify-center min-h-[400px]">
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={onCropComplete}
              className="max-h-[60vh] max-w-full"
            >
              <img 
                src={cropImageSrc} 
                onLoad={onImageLoad} 
                className="max-h-[60vh] object-contain"
                alt="Crop" 
              />
            </ReactCrop>
          </div>
          <div className="p-6 w-full max-w-md space-y-4">
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setCropImageSrc(null);
                  setCroppedAreaPixels(null);
                  setImageRef(null);
                }}
                className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white font-extrabold text-sm rounded-xl transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleCropConfirm}
                className="flex-1 py-3 bg-retro-primary hover:opacity-90 text-retro-card font-extrabold text-sm rounded-xl transition-all shadow-sm cursor-pointer"
              >
                確定剪裁
              </button>
            </div>
          </div>
        </div>
      )}

      `;
      
  tsx = tsx.substring(0, startIdx) + newModalStr + tsx.substring(endIdx);
  fs.writeFileSync('src/App.tsx', tsx);
  console.log('done fixing modal');
} else {
  console.log('could not find modal bounds', startIdx, endIdx);
}
