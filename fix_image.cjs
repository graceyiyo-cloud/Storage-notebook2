const fs = require('fs');

let tsx = fs.readFileSync('src/App.tsx', 'utf-8');
const target = `const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<string> => {
  const image = new Image();
  image.src = imageSrc;
  await new Promise((resolve) => {
    image.onload = resolve;
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('No 2d context');
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return canvas.toDataURL('image/jpeg', 0.8);
};`;

const replacement = `const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<string> => {
  const image = new Image();
  image.src = imageSrc;
  await new Promise((resolve) => {
    image.onload = resolve;
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('No 2d context');
  }

  // 壓縮圖片：限制最大邊長為 500px
  const MAX_SIZE = 500;
  let targetWidth = pixelCrop.width;
  let targetHeight = pixelCrop.height;

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
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    targetWidth,
    targetHeight
  );

  // 使用 70% 質量的 JPEG 進行壓縮，能大幅降低檔案大小
  return canvas.toDataURL('image/jpeg', 0.7);
};`;

tsx = tsx.replace(target, replacement);

fs.writeFileSync('src/App.tsx', tsx);
console.log('fixed image crop compression');
