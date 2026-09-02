import fs from 'fs';
let lines = fs.readFileSync('src/components/screens/ResultScreen.tsx', 'utf8').split('\n');
lines.splice(20, 1); // remove line 21
fs.writeFileSync('src/components/screens/ResultScreen.tsx', lines.join('\n'));
console.log('Removed duplicate');
