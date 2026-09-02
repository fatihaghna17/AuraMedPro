import fs from 'fs';
const block = fs.readFileSync('block_quiz.txt', 'utf8');

// I will just let TypeScript tell me what is missing during the build! It's much faster.
console.log('Skipping variable check, will rely on TS');
