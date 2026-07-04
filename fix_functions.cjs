const fs = require('fs');

let tsx = fs.readFileSync('src/App.tsx', 'utf-8');

const onCropCompleteTarget = `const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };`;
  
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
fs.writeFileSync('src/App.tsx', tsx);
console.log('done fixing functions');
