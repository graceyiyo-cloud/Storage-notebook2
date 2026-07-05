const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `const CachedImage = ({ src, thumbnail, alt, className, imageClassName, onClick, ...props }: any) => {
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
      {!isLoaded && thumbnail && (
        <img src={thumbnail} alt="thumbnail" className={\`absolute inset-0 \${imageClassName || 'w-full h-full object-contain'} blur-sm opacity-50 scale-105\`} />
      )}
      {!isLoaded && !thumbnail && cachedSrc && (
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
};`;

const replacement = `const CachedImage = ({ src, thumbnail, alt, className, imageClassName, onClick, ...props }: any) => {
  const [isLoaded, setIsLoaded] = useState(false);

  // Fallback to instantly mark as loaded if it's already a data URI
  useEffect(() => {
    if (src && (src.startsWith('data:') || src.startsWith('blob:'))) {
      setIsLoaded(true);
    } else {
      setIsLoaded(false);
    }
  }, [src]);

  return (
    <div className={\`relative \${className || ''} overflow-hidden\`} onClick={onClick}>
      {!isLoaded && thumbnail && (
        <img src={thumbnail} alt="thumbnail" className={\`absolute inset-0 \${imageClassName || 'w-full h-full object-contain'} blur-md opacity-50 scale-105\`} />
      )}
      {!isLoaded && !thumbnail && (
        <div className="absolute inset-0 flex items-center justify-center bg-stone-100/50 rounded-lg animate-pulse">
          <ImageIcon className="w-4 h-4 text-stone-300" />
        </div>
      )}
      {src && (
        <img
          src={src}
          alt={alt}
          className={\`\${imageClassName || 'w-full h-full object-contain'} transition-opacity duration-500 relative z-10 \${isLoaded ? 'opacity-100' : 'opacity-0'}\`}
          onLoad={() => setIsLoaded(true)}
          referrerPolicy="no-referrer"
          {...props}
        />
      )}
    </div>
  );
};`;

code = code.replace(target, replacement);
fs.writeFileSync('src/App.tsx', code);
