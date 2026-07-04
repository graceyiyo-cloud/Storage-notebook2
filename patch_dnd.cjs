const fs = require('fs');
let tsx = fs.readFileSync('src/App.tsx', 'utf-8');

const moveFns = `  const moveCatUp = (index: number) => {
    if (index <= 0) return;
    const newCats = [...categories];
    [newCats[index - 1], newCats[index]] = [newCats[index], newCats[index - 1]];
    setCategories(newCats);
  };
  const moveCatDown = (index: number) => {
    if (index >= categories.length - 1) return;
    const newCats = [...categories];
    [newCats[index + 1], newCats[index]] = [newCats[index], newCats[index + 1]];
    setCategories(newCats);
  };

  const moveSubCatUp = (catId: string, sIdx: number) => {
    if (sIdx <= 0) return;
    setCategories(categories.map(c => {
      if (c.id === catId) {
        const newSubs = [...c.subcategories];
        [newSubs[sIdx - 1], newSubs[sIdx]] = [newSubs[sIdx], newSubs[sIdx - 1]];
        return { ...c, subcategories: newSubs };
      }
      return c;
    }));
  };
  
  const moveSubCatDown = (catId: string, sIdx: number) => {
    setCategories(categories.map(c => {
      if (c.id === catId) {
        if (sIdx >= c.subcategories.length - 1) return c;
        const newSubs = [...c.subcategories];
        [newSubs[sIdx + 1], newSubs[sIdx]] = [newSubs[sIdx], newSubs[sIdx + 1]];
        return { ...c, subcategories: newSubs };
      }
      return c;
    }));
  };
`;

tsx = tsx.replace(
  'const handleSubDrop = (e: React.DragEvent, categoryId: string, index: number) => {',
  moveFns + '\n  const handleSubDrop = (e: React.DragEvent, categoryId: string, index: number) => {'
);


// Replace imports if needed (ArrowUp, ArrowDown)
if (!tsx.includes('ChevronUp')) {
  tsx = tsx.replace('ChevronRight', 'ChevronRight, ChevronUp, ChevronDown');
}

// Add arrow buttons to categories
const catBarReplace = `                        <div className="flex items-center gap-2">
                          <div className="cursor-grab p-1 hover:bg-stone-200 rounded text-stone-400 active:text-stone-700 hidden sm:block">
                            <GripVertical className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col sm:hidden">
                            <button onClick={(e) => { e.stopPropagation(); moveCatUp(idx); }} disabled={idx === 0} className="p-0.5 text-stone-400 hover:bg-stone-200 rounded disabled:opacity-30">
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); moveCatDown(idx); }} disabled={idx === categories.length - 1} className="p-0.5 text-stone-400 hover:bg-stone-200 rounded disabled:opacity-30">
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <span className="text-sm">`;

tsx = tsx.replace(
  `                        <div className="flex items-center gap-2">
                          <div className="cursor-grab p-1 hover:bg-stone-200 rounded text-stone-400 active:text-stone-700">
                            <GripVertical className="w-4 h-4" />
                          </div>
                          <span className="text-sm">`,
  catBarReplace
);

const subCatBarReplace = `                                <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
                                  <div className="cursor-grab p-0.5 text-stone-400 hover:text-stone-600 hidden sm:block">
                                    <GripVertical className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="flex flex-col sm:hidden">
                                    <button onClick={(e) => { e.stopPropagation(); moveSubCatUp(cat.id, sIdx); }} disabled={sIdx === 0} className="p-0.5 text-stone-400 hover:bg-stone-200 rounded disabled:opacity-30">
                                      <ChevronUp className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); moveSubCatDown(cat.id, sIdx); }} disabled={sIdx === cat.subcategories.length - 1} className="p-0.5 text-stone-400 hover:bg-stone-200 rounded disabled:opacity-30">
                                      <ChevronDown className="w-3.5 h-3.5" />
                                    </button>
                                  </div>`;

tsx = tsx.replace(
  `                                <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
                                  <div className="cursor-grab p-0.5 text-stone-400 hover:text-stone-600">
                                    <GripVertical className="w-3.5 h-3.5" />
                                  </div>`,
  subCatBarReplace
);

fs.writeFileSync('src/App.tsx', tsx);
console.log('done patching mobile dnd');
