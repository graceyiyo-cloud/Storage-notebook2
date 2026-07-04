const fs = require('fs');

let tsx = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Change defaults from '使用中' to '未開封'
tsx = tsx.replace(
  "const [formUsage, setFormUsage] = useState<'使用中' | '未開封' | '已用完' | '已丟棄'>('使用中');",
  "const [formUsage, setFormUsage] = useState<'使用中' | '未開封' | '已用完' | '已丟棄'>('未開封');"
);

// We need to replace setFormUsage('使用中') with setFormUsage('未開封') globally (except where we actually want '使用中')
// Let's check occurrences
// It's mostly in reset functions. Let's just do a string replacement.
tsx = tsx.replace(/setFormUsage\('使用中'\)/g, "setFormUsage('未開封')");

// 2. Change PAO visibility condition
// In the current code:
// {(formUsage === '使用中' || formUsage === '已用完' || formUsage === '已丟棄') && (
//   <div className="grid grid-cols-2 gap-3">
//     ... 開封日期 ...
//     ... 開封後可使用月數 ...
//   </div>
// )}
// We can separate them or just change the condition so it always shows "開封後可使用月數", but only shows "開封日期" when not 未開封.

fs.writeFileSync('src/App.tsx', tsx);
