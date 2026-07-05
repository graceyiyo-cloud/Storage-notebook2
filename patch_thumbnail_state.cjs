const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "const [formPhoto, setFormPhoto] = useState<string>(''); // Base64 string",
  "const [formPhoto, setFormPhoto] = useState<string>(''); // Base64 string\n  const [formPhotoThumbnail, setFormPhotoThumbnail] = useState<string>(''); // Thumbnail base64"
);

fs.writeFileSync('src/App.tsx', code);
