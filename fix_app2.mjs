import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');
content = content.replace(/\s*\)\}\n\n\s*\{dashboardTab === 'notes'/g, '\n\n            {dashboardTab === \'notes\'');
fs.writeFileSync('src/App.tsx', content);
console.log('Fixed 2');
