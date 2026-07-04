const fs = require('fs');

let tsx = fs.readFileSync('src/App.tsx', 'utf-8');

// Replace imports
tsx = tsx.replace(
  "import Cropper from 'react-easy-crop';",
  "import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';\nimport 'react-image-crop/dist/ReactCrop.css';"
);

// Replace getCroppedImg
const getCroppedImgStart = tsx.indexOf('const getCroppedImg =');
const getCroppedImgEnd = tsx.indexOf('// Helper component to render icons', getCroppedImgStart);
const oldGetCroppedImgStr = tsx.substring(getCroppedImgStart, getCroppedImgEnd);

const newGetCroppedImg = `const getCroppedImg = async (image: HTMLImageElement, crop: PixelCrop): Promise<string> => {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('No 2d context');
  }

  const cropWidth = crop.width * scaleX;
  const cropHeight = crop.height * scaleY;
  
  const MAX_SIZE = 500;
  let targetWidth = cropWidth;
  let targetHeight = cropHeight;

  if (targetWidth > MAX_SIZE || targetHeight > MAX_SIZE) {
    if (targetWidth > targetHeight) {
      targetHeight = (MAX_SIZE / targetWidth) * targetHeight;
      targetWidth = MAX_SIZE;
    } else {
      targetWidth = (MAX_SIZE / targetHeight) * targetWidth;
      targetHeight = MAX_SIZE;
    }
  }

  canvas.width = targetWidth;
  canvas.height = targetHeight;

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    cropWidth,
    cropHeight,
    0,
    0,
    targetWidth,
    targetHeight
  );

  return canvas.toDataURL('image/jpeg', 0.8);
};

`;

tsx = tsx.replace(oldGetCroppedImgStr, newGetCroppedImg);

// Find cropper states and replace them
const statesTarget = `const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [cropAspect, setCropAspect] = useState<number>(1);`;

const statesReplace = `const [crop, setCrop] = useState<Crop>();
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<PixelCrop | null>(null);
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);`;

tsx = tsx.replace(statesTarget, statesReplace);

// Remove onCropComplete (react-easy-crop style)
// We will replace it with simple onCropComplete for react-image-crop
const onCropCompleteTarget = `const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);`;
  
const onCropCompleteReplace = `const onCropComplete = (crop: PixelCrop) => {
    setCroppedAreaPixels(crop);
  };
  
  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setImageRef(e.currentTarget);
    const { width, height } = e.currentTarget;
    setCrop({
      unit: '%',
      x: 10,
      y: 10,
      width: 80,
      height: 80
    });
  };`;

tsx = tsx.replace(onCropCompleteTarget, onCropCompleteReplace);

// Handle handleCropConfirm body
const cropConfirmTarget = `const croppedBase64 = await getCroppedImg(cropImageSrc, croppedAreaPixels);`;
const cropConfirmReplace = `if (!imageRef) return;\n      const croppedBase64 = await getCroppedImg(imageRef, croppedAreaPixels);`;
tsx = tsx.replace(cropConfirmTarget, cropConfirmReplace);


// Find Cropper Modal JSX and replace it
const modalTargetStart = `{/* ==================== Image Cropper Modal ==================== */}`;
// Search for the end of the modal. The modal ends just before `{/* ==================== Main App View ==================== */}`
const modalTargetEnd = `{/* ==================== Main App View ==================== */}`;
const startIdx = tsx.indexOf(modalTargetStart);
const endIdx = tsx.indexOf(modalTargetEnd);

if (startIdx !== -1 && endIdx !== -1) {
  const modalStr = tsx.substring(startIdx, endIdx);
  
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
}

// Remove the `setCropAspect(1)` from the file upload which we added in the previous buggy turn
tsx = tsx.replace("setCropImageSrc(base64Image);\n        setCropAspect(1);", "setCropImageSrc(base64Image);");

fs.writeFileSync('src/App.tsx', tsx);
console.log('done fixing cropper');
