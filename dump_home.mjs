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

let start1 = -1, end1 = -1, start2 = -1, end2 = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("{dashboardTab === 'home' && (") && start1 === -1) {
    start1 = i;
    for (let j = i; j < lines.length; j++) {
      if (lines[j].includes(")}")) {
        // next is banks
        if (lines[j+3] && lines[j+3].includes("dashboardTab === 'banks'")) {
          end1 = j;
          break;
        }
      }
    }
  } else if (lines[i].includes("{dashboardTab === 'home' && (") && start1 !== -1) {
    start2 = i;
    for (let j = i; j < lines.length; j++) {
      if (lines[j].includes(")}")) {
        // next is srs
        if (lines[j+2] && lines[j+2].includes("dashboardTab === 'srs'")) {
          end2 = j;
          break;
        }
      }
    }
    break;
  }
}

fs.writeFileSync('block1.txt', lines.slice(start1 + 1, end1).join('\n'));
fs.writeFileSync('block2.txt', lines.slice(start2 + 1, end2).join('\n'));
console.log('Dumped');
