const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  'src={selectedDetailProduct.photo}',
  'src={selectedDetailProduct.photo}\n                  thumbnail={selectedDetailProduct.photoThumbnail}'
);

code = code.replace(
  'src={product.photo}',
  'src={product.photo}\n              thumbnail={product.photoThumbnail}'
);

fs.writeFileSync('src/App.tsx', code);
