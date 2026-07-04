const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  'const [isAnalyzing, setIsAnalyzing] = useState(false);',
  'const [isAnalyzing, setIsAnalyzing] = useState(false);\n  const [isUploading, setIsUploading] = useState(false);'
);

code = code.replace(
  `            setIsAnalyzing(true);\n            showToast('上傳圖片中...');`,
  `            setIsUploading(true);\n            showToast('上傳圖片中...');`
);

code = code.replace(
  `            } finally {\n              setIsAnalyzing(false);\n            }`,
  `            } finally {\n              setIsUploading(false);\n            }`
);

fs.writeFileSync('src/App.tsx', code);
