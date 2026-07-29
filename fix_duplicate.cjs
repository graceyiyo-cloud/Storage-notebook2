const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const t1 = `  const handleEditInstanceTrigger = (prod: Product, inst: ProductInstance) => {`;
const r1 = `  const handleDuplicateInstanceTrigger = (prod: Product, inst: ProductInstance) => {
    setEditingProductId(prod.id);
    setEditingInstanceId(null);
    setIsEditingMaster(false);
    setIsAddingInstanceToExisting(true);
    setFormBrand(prod.brand);
    setFormName(prod.name);
    setFormCategory(prod.category);
    setFormSubcategory(prod.subcategory);
    setFormQty(inst.qty);
    
    // Parse capacity and unit
    let cap = inst.capacity || '';
    let unit = 'ml';
    if (cap.endsWith('ml')) { unit = 'ml'; cap = cap.slice(0, -2); }
    else if (cap.endsWith('g')) { unit = 'g'; cap = cap.slice(0, -1); }
    else if (cap.endsWith('個')) { unit = '個'; cap = cap.slice(0, -1); }
    else if (cap.endsWith('罐')) { unit = '罐'; cap = cap.slice(0, -1); }
    else if (cap.endsWith('錠')) { unit = '錠'; cap = cap.slice(0, -1); }
    else if (cap.endsWith('顆')) { unit = '顆'; cap = cap.slice(0, -1); }
    
    setFormCapacity(cap.trim());
    setFormCapacityUnit(unit);
    setFormUsage(inst.usage);
    setFormThreshold(prod.threshold ? String(prod.threshold) : '');
    setFormExpiry(inst.expiry);
    setFormPaoMonths(inst.paoMonths ? String(inst.paoMonths) : '');
    setFormOpenedDate(inst.openedDate || '');
    setFormFinishedDate(inst.finishedDate || '');
    setFormPhoto(prod.photo || '');
    setFormPhotoThumbnail(prod.photoThumbnail || '');
    setFormPurchaseDate(inst.purchaseDate || '');
    setFormPurchasePlace(inst.purchasePlace || '');
    setFormPrice(inst.price !== undefined ? String(inst.price) : '');
    
    setShowAddForm(true);
  };

  const handleEditInstanceTrigger = (prod: Product, inst: ProductInstance) => {`;

const t2 = `                                <button 
                                  onClick={() => {
                                    handleEditInstanceTrigger(selectedDetailProduct, inst);
                                  }}
                                  className="action-btn-no-pixel text-retro-primary hover:text-retro-secondary p-0.5 transition-colors cursor-pointer"
                                  title="編輯此規格"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                
                                <span className="w-[1px] h-3 bg-retro-text/10"></span>`;
const r2 = `                                <button 
                                  onClick={() => {
                                    handleDuplicateInstanceTrigger(selectedDetailProduct, inst);
                                  }}
                                  className="action-btn-no-pixel text-emerald-500 hover:text-emerald-600 p-0.5 transition-colors cursor-pointer"
                                  title="複製此明細去新增"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>

                                <span className="w-[1px] h-3 bg-retro-text/10"></span>

                                <button 
                                  onClick={() => {
                                    handleEditInstanceTrigger(selectedDetailProduct, inst);
                                  }}
                                  className="action-btn-no-pixel text-retro-primary hover:text-retro-secondary p-0.5 transition-colors cursor-pointer"
                                  title="編輯此明細"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                
                                <span className="w-[1px] h-3 bg-retro-text/10"></span>`;

code = code.replace(t1, r1);
code = code.replace(t2, r2);
fs.writeFileSync('src/App.tsx', code);
