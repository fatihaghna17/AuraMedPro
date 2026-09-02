import fs from 'fs';
const lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

const getEnd = (start) => {
  let openBraces = 0;
  let started = false;
  for (let i = start; i < lines.length; i++) {
    const line = lines[i];
    openBraces += (line.match(/\{/g) || []).length;
    openBraces -= (line.match(/\}/g) || []).length;
    if (line.includes('{')) started = true;
    if (started && openBraces === 0) return i;
  }
  return -1;
};

// block1
let start1 = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("{dashboardTab === 'home' && (")) {
    start1 = i;
    break;
  }
}
const end1 = getEnd(start1);
fs.writeFileSync('block1.txt', lines.slice(start1 + 1, end1).join('\n'));

// block2
let start2 = -1;
for (let i = end1 + 1; i < lines.length; i++) {
  if (lines[i].includes("{dashboardTab === 'home' && (")) {
    start2 = i;
    break;
  }
}
const end2 = getEnd(start2);
fs.writeFileSync('block2.txt', lines.slice(start2 + 1, end2).join('\n'));

console.log('start1:', start1, 'end1:', end1);
console.log('start2:', start2, 'end2:', end2);
