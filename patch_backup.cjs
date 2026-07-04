const fs = require('fs');
let tsx = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Add backup and restore functions
const backupCode = `
  const handleExportBackup = () => {
    const backupData = {
      categories,
      products,
      exportDate: new Date().toISOString()
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", \`cosmetics_backup_\${new Date().toISOString().split('T')[0]}.json\`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    setToastMessage("備份檔已下載，您可以將其上傳至 Google Drive 保存");
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.categories && json.products) {
          setCategories(json.categories);
          setProducts(json.products);
          setToastMessage("資料已成功還原！正在同步至雲端...");
          
          // Force save to localStorage immediately
          localStorage.setItem('cosmetics_backup_categories', JSON.stringify(json.categories));
          localStorage.setItem('cosmetics_backup_products', JSON.stringify(json.products));
          
          if (user) {
             const userRef = doc(db, 'users', user.uid);
             await setDoc(userRef, { categories: json.categories, updatedAt: new Date().toISOString() }, { merge: true });
             for (const p of json.products) {
               await setDoc(doc(db, 'users', user.uid, 'products', p.id), p);
             }
          }
        } else {
          setToastMessage("備份檔格式不正確");
        }
      } catch (err) {
        console.error(err);
        setToastMessage("讀取備份檔失敗");
      }
    };
    reader.readAsText(file);
    // reset input
    e.target.value = '';
  };
`;

// Insert the backup code before the return statement of MainApp
tsx = tsx.replace('  // Get current subcategories for selected form category', backupCode + '\n  // Get current subcategories for selected form category');


// 2. Add the Backup & Restore UI in settings menu
const backupUI = `
                  <button onClick={() => setSettingsView('backup')} className="p-4 bg-white border border-retro-text/10 rounded-2xl shadow-sm hover:border-retro-primary/50 transition-all flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                      </div>
                      <span className="font-bold text-retro-text text-sm">備份與還原 (可存至 Google Drive)</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-retro-text/30 group-hover:text-retro-primary group-hover:translate-x-1 transition-all" />
                  </button>
`;

tsx = tsx.replace(/(\<button onClick=\{\(\) \=\> setSettingsView\('history'\).*?\<\/button\>)/s, '$1\n' + backupUI);


// 3. Add the backup view
const backupView = `
            {settingsView === 'backup' && (
              <div className="space-y-4 animate-fade-in">
                <button onClick={() => setSettingsView('menu')} className="text-xs font-bold text-retro-text/50 hover:text-retro-primary flex items-center gap-1 transition-colors cursor-pointer mb-2">
                  <ChevronDown className="w-4 h-4 rotate-90" /> 返回設定選單
                </button>
                <div className="p-5 bg-retro-card rounded-2xl border border-retro-text/10 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-retro-secondary flex items-center gap-1.5">
                    資料備份與還原
                  </h3>
                  <p className="text-xs text-retro-text/70 leading-relaxed">
                    您可以將所有資料下載成 JSON 備份檔，並將其上傳至您的 Google Drive 保存。未來若需要還原，只要點擊「還原資料」並選擇該備份檔即可。
                  </p>
                  
                  <div className="flex flex-col gap-3 pt-2">
                    <button 
                      onClick={handleExportBackup}
                      className="w-full flex items-center justify-center gap-2 bg-retro-primary text-white py-3 rounded-xl font-bold hover:bg-retro-primary/90 transition-all"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                      下載備份檔
                    </button>
                    
                    <label className="w-full flex items-center justify-center gap-2 bg-white border border-retro-primary text-retro-primary py-3 rounded-xl font-bold hover:bg-retro-primary/5 transition-all cursor-pointer">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                      從備份檔還原
                      <input type="file" accept=".json" className="hidden" onChange={handleImportBackup} />
                    </label>
                  </div>
                </div>
              </div>
            )}
`;

tsx = tsx.replace(/\{settingsView \=\=\= 'history' \&\& \(/g, backupView + '\n            {settingsView === \'history\' && (');


// 4. Add Local Storage save effect
const localStorageEffect = `
  // LocalStorage Double Backup
  useEffect(() => {
    if (isDataLoaded) {
       localStorage.setItem('cosmetics_backup_categories', JSON.stringify(categories));
       localStorage.setItem('cosmetics_backup_products', JSON.stringify(products));
    }
  }, [categories, products, isDataLoaded]);
`;

tsx = tsx.replace('  const handleExportBackup = () => {', localStorageEffect + '\n  const handleExportBackup = () => {');

// 5. Read from LocalStorage fallback if Firestore fails or is empty
// Wait, we need to modify the loadUserData function
// In loadUserData, we have:
/*
        // Merge root products and subcollection products
        if (rootProducts.length > 0 || subProducts.length > 0) {
           ...
        } else if (!docSnap.exists()) {
          setProducts(INITIAL_PRODUCTS);
        } else {
          setProducts([]);
        }
*/
// We'll replace the loading logic slightly to check localStorage backup if firestore has 0 products
const replaceLoadingFallback = `
        // Merge root products and subcollection products (prefer newer or unique)
        if (rootProducts.length > 0 || subProducts.length > 0) {
          const mergedMap = new Map<string, Product>();
          
          // Add subcollection products first
          subProducts.forEach(p => mergedMap.set(p.id, p));
          
          // Add/override with root products
          rootProducts.forEach(p => { 
             if (!mergedMap.has(p.id)) {
               mergedMap.set(p.id, p);
             } else {
               const exist = mergedMap.get(p.id)!;
               if (!exist.instances || exist.instances.length === 0) {
                 mergedMap.set(p.id, p);
               }
             }
          });
          setProducts(Array.from(mergedMap.values()));
        } else {
          // Fallback to local storage backup
          const lsProducts = localStorage.getItem('cosmetics_backup_products');
          if (lsProducts) {
             try {
               setProducts(JSON.parse(lsProducts));
             } catch(e) {
               setProducts(docSnap.exists() ? [] : INITIAL_PRODUCTS);
             }
          } else {
             setProducts(docSnap.exists() ? [] : INITIAL_PRODUCTS);
          }
        }
`;

tsx = tsx.replace(/\/\/ Merge root products and subcollection products.*?setProducts\(\[\]\);\n        \}/s, replaceLoadingFallback);


fs.writeFileSync('src/App.tsx', tsx);
console.log("Patched!");
