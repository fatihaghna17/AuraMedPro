import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');
content = content.replace(/\s*questionDatabase={questionDatabase}\s*initialRoomCode={guestRoomCode}\s*\/>/g, '');
fs.writeFileSync('src/App.tsx', content);
console.log('Fixed');
