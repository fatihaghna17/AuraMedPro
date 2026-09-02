import fs from 'fs';
const block = fs.readFileSync('block_srs.txt', 'utf8');

const allProps = [
  'theme', 'srs', 'triggerToast'
];

const foundProps = allProps.filter(p => block.includes(p));
console.log(foundProps.join(', '));
