const fs = require('fs');

let tsx = fs.readFileSync('src/App.tsx', 'utf-8');

tsx = tsx.replace(
  '  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);',
  '  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);\n  const [cropAspect, setCropAspect] = useState<number>(1);'
);

const oldCropper = `<Cropper
              image={cropImageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />`;
const newCropper = `<Cropper
              image={cropImageSrc}
              crop={crop}
              zoom={zoom}
              aspect={cropAspect}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />`;

tsx = tsx.replace(oldCropper, newCropper);

const oldControls = `<div className="p-6 w-full max-w-md space-y-4">
            <div className="flex items-center gap-4 text-white">`;

const newControls = `<div className="p-6 w-full max-w-md space-y-4">
            <div className="flex justify-center gap-3">
              {[
                { label: '正方形 1:1', value: 1 },
                { label: '直式 3:4', value: 3/4 },
                { label: '橫式 4:3', value: 4/3 },
                { label: '寬螢幕 16:9', value: 16/9 }
              ].map(ratio => (
                <button
                  key={ratio.label}
                  onClick={() => setCropAspect(ratio.value)}
                  className={\`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors \${cropAspect === ratio.value ? 'bg-retro-primary text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}\`}
                >
                  {ratio.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-4 text-white">`;

tsx = tsx.replace(oldControls, newControls);

// Fix the file input on photo upload to reset aspect to 1 if we want, or just leave it
tsx = tsx.replace(
  'setCropImageSrc(base64Image);',
  'setCropImageSrc(base64Image);\n        setCropAspect(1);'
);

fs.writeFileSync('src/App.tsx', tsx);
console.log('fixed cropper aspect');
