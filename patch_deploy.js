const fs = require('fs');
let yml = fs.readFileSync('.github/workflows/deploy.yml', 'utf8');

yml = yml.replace(
  /uses: actions\/upload-pages-artifact@v3\n\s+with:\n\s+path: '\.\/dist'/g,
  "uses: actions/upload-pages-artifact@v3\n        with:\n          name: my-app-pages\n          path: './dist'"
);

yml = yml.replace(
  /uses: actions\/deploy-pages@v4/g,
  "uses: actions/deploy-pages@v4\n        with:\n          artifact_name: my-app-pages"
);

fs.writeFileSync('.github/workflows/deploy.yml', yml);
console.log('patched');
