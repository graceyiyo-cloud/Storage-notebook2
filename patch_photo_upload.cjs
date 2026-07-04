const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  '  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, isFormPhoto: boolean) => {\n    const file = e.target.files?.[0];\n    if (file) {',
  '  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, isFormPhoto: boolean) => {\n    const file = e.target.files?.[0];\n    e.target.value = ""; // Reset input to allow selecting the same file again\n    if (file) {'
);

fs.writeFileSync('src/App.tsx', code);
