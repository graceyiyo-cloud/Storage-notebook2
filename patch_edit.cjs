const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "                                    handleEditInstanceTrigger(selectedDetailProduct, inst);\n                                    setSelectedDetailProduct(null); // Close modal\n                                  }}",
  "                                    handleEditInstanceTrigger(selectedDetailProduct, inst);\n                                  }}"
);

fs.writeFileSync('src/App.tsx', code);
