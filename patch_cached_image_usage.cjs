const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldImage = '            <img \n              referrerPolicy="no-referrer"\n              src={product.photo} \n              alt={product.name}\n              onClick={(e) => {\n                if (onImageClick) {\n                  e.stopPropagation();\n                  onImageClick(product.photo!);\n                }\n              }}\n              className="max-w-full max-h-full rounded-lg object-contain border border-retro-text/10 shadow-sm group-hover:scale-105 transition-transform"\n            />';

const newImage = '            <CachedImage\n              src={product.photo} \n              alt={product.name}\n              onClick={(e: React.MouseEvent) => {\n                if (onImageClick) {\n                  e.stopPropagation();\n                  onImageClick(product.photo!);\n                }\n              }}\n              className="w-full h-full flex items-center justify-center"\n              imageClassName="max-w-full max-h-full rounded-lg object-contain border border-retro-text/10 shadow-sm group-hover:scale-105 transition-transform"\n            />';

code = code.replace(oldImage, newImage);
fs.writeFileSync('src/App.tsx', code);
