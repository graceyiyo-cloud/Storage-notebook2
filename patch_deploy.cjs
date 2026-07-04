const fs = require('fs');

let yaml = fs.readFileSync('.github/workflows/deploy.yml', 'utf-8');

yaml = yaml.replace(
  "        uses: actions/upload-pages-artifact@v3\\n        with:\\n          path: './dist'",
  "        uses: actions/upload-pages-artifact@v3\\n        with:\\n          name: github-pages-${{ github.run_id }}-${{ github.run_attempt }}\\n          path: './dist'"
);

yaml = yaml.replace(
  "        uses: actions/deploy-pages@v4",
  "        uses: actions/deploy-pages@v4\\n        with:\\n          artifact_name: github-pages-${{ github.run_id }}-${{ github.run_attempt }}"
);

fs.writeFileSync('.github/workflows/deploy.yml', yaml);
console.log('done patching deploy.yml');
