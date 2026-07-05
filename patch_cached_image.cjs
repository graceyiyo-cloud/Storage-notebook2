const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const cachedImageComponent = `
// --- Cached Image Component ---
const CachedImage = ({ src, alt, className, imageClassName, onClick, ...props }: any) => {
  const [cachedSrc, setCachedSrc] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!src) return;

    // Fast path: if it's a blob or data URL, just use it
    if (src.startsWith('data:') || src.startsWith('blob:')) {
      setCachedSrc(src);
      return;
    }

    const loadImg = async () => {
      try {
        if ('caches' in window) {
          const cache = await caches.open('product-images-v1');
          const response = await cache.match(src);
          if (response) {
            const blob = await response.blob();
            if (isMounted) setCachedSrc(URL.createObjectURL(blob));
            return;
          }
          
          // Fetch and cache
          const fetchResponse = await fetch(src, { mode: 'cors' });
          if (fetchResponse.ok) {
            cache.put(src, fetchResponse.clone());
            const blob = await fetchResponse.blob();
            if (isMounted) setCachedSrc(URL.createObjectURL(blob));
          } else {
            if (isMounted) setCachedSrc(src);
          }
        } else {
          if (isMounted) setCachedSrc(src);
        }
      } catch (err) {
        console.warn('Cache error:', err);
        if (isMounted) setCachedSrc(src);
      }
    };
    loadImg();

    return () => {
      isMounted = false;
    };
  }, [src]);

  return (
    <div className={\`relative \${className || ''}\`} onClick={onClick}>
      {!isLoaded && cachedSrc && (
        <div className="absolute inset-0 flex items-center justify-center bg-stone-100/50 rounded-lg animate-pulse">
          <ImageIcon className="w-4 h-4 text-stone-300" />
        </div>
      )}
      {cachedSrc && (
        <img
          src={cachedSrc}
          alt={alt}
          className={\`\${imageClassName || 'w-full h-full object-contain'} transition-opacity duration-300 \${isLoaded ? 'opacity-100' : 'opacity-0'}\`}
          onLoad={() => setIsLoaded(true)}
          {...props}
        />
      )}
    </div>
  );
};
`;

code = code.replace('// Helper component to render icons based on category settings', cachedImageComponent + '\n// Helper component to render icons based on category settings');
fs.writeFileSync('src/App.tsx', code);
