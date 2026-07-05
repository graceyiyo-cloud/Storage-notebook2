const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldImage = '          <img \n            referrerPolicy="no-referrer"\n            src={fullscreenImage} \n            alt="Fullscreen preview" \n            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-slide-up"\n            onClick={(e) => e.stopPropagation()}\n          />';

const newImage = '          <CachedImage\n            src={fullscreenImage} \n            alt="Fullscreen preview" \n            className="w-full h-full flex items-center justify-center"\n            imageClassName="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-slide-up"\n            onClick={(e: React.MouseEvent) => e.stopPropagation()}\n          />';

code = code.replace(oldImage, newImage);
fs.writeFileSync('src/App.tsx', code);
