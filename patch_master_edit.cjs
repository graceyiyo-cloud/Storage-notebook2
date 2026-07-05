const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "    setFormPrice('');\n    setShowAddForm(true);\n    setSelectedDetailProduct(null); // Close detail screen\n    setTimeout(() => {",
  "    setFormPrice('');\n    setShowAddForm(true);\n    setTimeout(() => {"
);

fs.writeFileSync('src/App.tsx', code);
