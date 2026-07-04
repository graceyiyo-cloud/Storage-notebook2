const fs = require('fs');
let tsx = fs.readFileSync('src/App.tsx', 'utf-8');

const target = `{/* Thumb */}
        {product.photo ? (
          <img 
            referrerPolicy="no-referrer"
            src={product.photo} 
            alt={product.name}
            onClick={(e) => {
              if (onImageClick) {
                e.stopPropagation();
                onImageClick(product.photo!);
              }
            }}
            className="h-14 w-auto max-w-[6rem] rounded-lg object-cover border border-retro-text/10 shadow-sm group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-11 h-14 rounded-lg bg-retro-primary/10 border border-dashed border-retro-primary/30 flex items-center justify-center text-retro-primary flex-shrink-0">
            <CategoryIcon name={categoryIcon} className="w-5 h-5 opacity-40" />
          </div>
        )}`;

const replace = `{/* Thumb */}
        <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center">
          {product.photo ? (
            <img 
              referrerPolicy="no-referrer"
              src={product.photo} 
              alt={product.name}
              onClick={(e) => {
                if (onImageClick) {
                  e.stopPropagation();
                  onImageClick(product.photo!);
                }
              }}
              className="max-w-full max-h-full rounded-lg object-contain border border-retro-text/10 shadow-sm group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full rounded-lg bg-retro-primary/10 border border-dashed border-retro-primary/30 flex items-center justify-center text-retro-primary">
              <CategoryIcon name={categoryIcon} className="w-6 h-6 opacity-40" />
            </div>
          )}
        </div>`;

if (tsx.includes(target)) {
  tsx = tsx.replace(target, replace);
  fs.writeFileSync('src/App.tsx', tsx);
  console.log('Thumbnail updated successfully!');
} else {
  console.log('Target not found!');
}
