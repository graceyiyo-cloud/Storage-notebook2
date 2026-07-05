const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replaceAll(
  "photo: formPhoto || prod.photo,",
  "photo: formPhoto || prod.photo,\n            photoThumbnail: formPhotoThumbnail || prod.photoThumbnail,"
);

// Also new product creation
code = code.replace(
  "photo: formPhoto,",
  "photo: formPhoto,\n            photoThumbnail: formPhotoThumbnail,"
);

fs.writeFileSync('src/App.tsx', code);
