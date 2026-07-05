const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldImage = '                <img \n                  referrerPolicy="no-referrer"\n                  src={selectedDetailProduct.photo} \n                  alt={selectedDetailProduct.name}\n                  onClick={() => setFullscreenImage(selectedDetailProduct.photo!)}\n                  className="h-18 w-auto max-w-[8rem] rounded-xl object-cover border border-retro-text/10 shadow-sm cursor-pointer hover:scale-105 transition-transform"\n                />';

const newImage = '                <CachedImage\n                  src={selectedDetailProduct.photo} \n                  alt={selectedDetailProduct.name}\n                  onClick={() => setFullscreenImage(selectedDetailProduct.photo!)}\n                  className="h-18 w-18 flex-shrink-0"\n                  imageClassName="h-18 w-auto max-w-[8rem] rounded-xl object-cover border border-retro-text/10 shadow-sm cursor-pointer hover:scale-105 transition-transform"\n                />';

code = code.replace(oldImage, newImage);
fs.writeFileSync('src/App.tsx', code);
