import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Remove import
content = content.replace(/const MabarMain = lazyWithRetry\(\(\) => import\("\.\/components\/mabar\/MabarMain"\)\);\n?/g, '');

// 2. Remove from dashboardTab state type
content = content.replace(/ \| 'mabar'/g, '');

// 3. Remove setDashboardTab('mabar') inside guest login
content = content.replace(/setDashboardTab\('mabar'\);\n?/g, '');

// 4. Remove MabarMain render block
const blockStart = content.indexOf("{dashboardTab === 'mabar' && (");
if (blockStart !== -1) {
  const blockEnd = content.indexOf(")}", blockStart);
  if (blockEnd !== -1) {
    content = content.substring(0, blockStart) + content.substring(blockEnd + 2);
  }
}

fs.writeFileSync('src/App.tsx', content);
console.log('App.tsx updated');
