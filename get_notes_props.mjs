import fs from 'fs';
const block = fs.readFileSync('block_notestab.txt', 'utf8');
const regex = /\b(set[A-Z][a-zA-Z0-9_]*)\b/g;
const setters = [...new Set(block.match(regex))];
console.log('Setters:', setters.join(', '));
