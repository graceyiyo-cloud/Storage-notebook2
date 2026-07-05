const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Remove setSelectedDetailProduct(null) from the button click
code = code.replace(
  "                    handleAddAnotherInstanceTrigger(selectedDetailProduct);\n                    setSelectedDetailProduct(null);\n                  }}",
  "                    handleAddAnotherInstanceTrigger(selectedDetailProduct);\n                  }}"
);

// 2. Change the showAddForm container
const oldShowAddFormStart = `{showAddForm && (
          <div id="manual-add-form" className="mb-6 p-5 bg-retro-card rounded-2xl border border-retro-primary/30 shadow-md animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-retro-secondary flex items-center gap-2">`;

const newShowAddFormStart = `{showAddForm && (
          <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs z-[60] flex items-center justify-center p-4 animate-fade-in pb-safe">
            <div id="manual-add-form" className="w-full max-w-md max-h-[90dvh] overflow-y-auto bg-retro-card rounded-2xl border border-retro-primary/30 shadow-2xl p-5 relative">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-retro-card z-10 pb-2 border-b border-retro-text/5">
              <h3 className="text-lg font-bold text-retro-secondary flex items-center gap-2">`;

code = code.replace(oldShowAddFormStart, newShowAddFormStart);

const oldShowAddFormEnd = `              </div>
            </form>
          </div>
        )}`;

const newShowAddFormEnd = `              </div>
            </form>
            </div>
          </div>
        )}`;

code = code.replace(oldShowAddFormEnd, newShowAddFormEnd);

fs.writeFileSync('src/App.tsx', code);
