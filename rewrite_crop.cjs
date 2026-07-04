const fs = require('fs');

let tsx = fs.readFileSync('src/App.tsx', 'utf-8');

tsx = tsx.replace(
  "import Cropper from 'react-easy-crop';",
  "import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';\nimport 'react-image-crop/dist/ReactCrop.css';"
);

// Replace getCroppedImg
const oldGetCroppedImgStart = tsx.indexOf('const getCroppedImg =');
const oldGetCroppedImgEnd = tsx.indexOf('// Helper component to render icons');
const oldGetCroppedImgStr = tsx.substring(oldGetCroppedImgStart, oldGetCroppedImgEnd);

const newGetCroppedImg = `const getCroppedImg = async (image: HTMLImageElement, crop: PixelCrop): Promise<string> => {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('No 2d context');
  }

  const pixelRatio = window.devicePixelRatio;
  
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

// Replace states
tsx = tsx.replace(
  "const [crop, setCrop] = useState({ x: 0, y: 0 });\n  const [zoom, setZoom] = useState(1);\n  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);\n  const [cropAspect, setCropAspect] = useState<number>(1);",
  "const [crop, setCrop] = useState<Crop>({ unit: '%', width: 50, height: 50, x: 25, y: 25 });\n  const [croppedAreaPixels, setCroppedAreaPixels] = useState<PixelCrop | null>(null);\n  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);"
);

// Replace onCropComplete handler
const oldOnCropCompleteStart = tsx.indexOf('const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {');
const oldOnCropCompleteEnd = tsx.indexOf('const handleCropConfirm = async () => {');
const oldOnCropCompleteStr = tsx.substring(oldOnCropCompleteStart, oldOnCropCompleteEnd);

const newOnCropComplete = `const onCropComplete = (crop: PixelCrop) => {
    setCroppedAreaPixels(crop);
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setImageRef(e.currentTarget);
  };

  `;
tsx = tsx.replace(oldOnCropCompleteStr, newOnCropComplete);

// Replace handleCropConfirm body
const oldCropConfirmStr = `const croppedBase64 = await getCroppedImg(cropImageSrc, croppedAreaPixels);`;
const newCropConfirmStr = `if (!imageRef) return;\n      const croppedBase64 = await getCroppedImg(imageRef, croppedAreaPixels);`;
tsx = tsx.replace(oldCropConfirmStr, newCropConfirmStr);

// Replace JSX
const cropperModalStart = tsx.indexOf('{/* ==================== Image Cropper Modal ==================== */}');
const cropperModalEnd = tsx.indexOf('{/* ==================== Main App View ==================== */}');
const oldCropperModalStr = tsx.substring(cropperModalStart, cropperModalEnd);

const newCropperModal = `{/* ==================== Image Cropper Modal ==================== */}
      {cropImageSrc && (
        <div className="fixed inset-0 bg-stone-900/95 backdrop-blur-md z-[120] flex flex-col items-center justify-center animate-fade-in p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-black rounded-lg overflow-hidden flex flex-col items-center justify-center min-h-[400px]">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => onCropComplete(c)}
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
tsx = tsx.replace(oldCropperModalStr, newCropperModal);

fs.writeFileSync('src/App.tsx', tsx);
console.log('done');
