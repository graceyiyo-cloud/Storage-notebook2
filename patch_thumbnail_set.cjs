const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replaceAll("setFormPhoto('');", "setFormPhoto('');\n    setFormPhotoThumbnail('');");
code = code.replaceAll("setFormPhoto(prod.photo || '');", "setFormPhoto(prod.photo || '');\n    setFormPhotoThumbnail(prod.photoThumbnail || '');");

fs.writeFileSync('src/App.tsx', code);
