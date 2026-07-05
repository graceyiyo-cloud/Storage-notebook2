const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `const CachedImage = ({ src, alt, className, imageClassName, onClick, ...props }: any) => {`;
const replacement = `const CachedImage = ({ src, thumbnail, alt, className, imageClassName, onClick, ...props }: any) => {`;
code = code.replace(target, replacement);

const targetRender = `      {!isLoaded && cachedSrc && (
        <div className="absolute inset-0 flex items-center justify-center bg-stone-100/50 rounded-lg animate-pulse">
          <ImageIcon className="w-4 h-4 text-stone-300" />
        </div>
      )}`;

const replacementRender = `      {!isLoaded && thumbnail && (
        <img src={thumbnail} alt="thumbnail" className={\`absolute inset-0 \${imageClassName || 'w-full h-full object-contain'} blur-sm opacity-50 scale-105\`} />
      )}
      {!isLoaded && !thumbnail && cachedSrc && (
        <div className="absolute inset-0 flex items-center justify-center bg-stone-100/50 rounded-lg animate-pulse">
          <ImageIcon className="w-4 h-4 text-stone-300" />
        </div>
      )}`;

code = code.replace(targetRender, replacementRender);
fs.writeFileSync('src/App.tsx', code);
