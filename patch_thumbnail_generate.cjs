const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `        ctx?.drawImage(img, 0, 0, width, height);
        
        // Compress as JPEG
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);`;

const replacement = `        ctx?.drawImage(img, 0, 0, width, height);
        
        // Compress as JPEG
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);

        // Generate tiny thumbnail for instant load
        const thumbCanvas = document.createElement('canvas');
        const THUMB_SIZE = 64;
        let tWidth = img.width;
        let tHeight = img.height;
        if (tWidth > tHeight) {
          tHeight *= THUMB_SIZE / tWidth;
          tWidth = THUMB_SIZE;
        } else {
          tWidth *= THUMB_SIZE / tHeight;
          tHeight = THUMB_SIZE;
        }
        thumbCanvas.width = tWidth;
        thumbCanvas.height = tHeight;
        const tCtx = thumbCanvas.getContext('2d');
        tCtx?.drawImage(img, 0, 0, tWidth, tHeight);
        const thumbBase64 = thumbCanvas.toDataURL('image/jpeg', 0.5);`;

code = code.replace(target, replacement);

const target2 = `              const downloadURL = await getDownloadURL(storageRef);
              setFormPhoto(downloadURL);
              showToast('圖片上傳成功');`;

const replacement2 = `              const downloadURL = await getDownloadURL(storageRef);
              setFormPhoto(downloadURL);
              setFormPhotoThumbnail(thumbBase64);
              showToast('圖片上傳成功');`;

code = code.replace(target2, replacement2);

fs.writeFileSync('src/App.tsx', code);
