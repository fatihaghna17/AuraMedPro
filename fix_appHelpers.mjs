import fs from 'fs';
let content = fs.readFileSync('src/utils/appHelpers.ts', 'utf8');

const correctElim = `  let newEliminasiOpsi = q.eliminasi_opsi;
  if (q.eliminasi_opsi) {
    const letters = ['A', 'B', 'C', 'D', 'E'];
    const updatedEliminasi: Record<string, string> = {};

    q.pilihan.forEach((oldOpt, oldIdx) => {
      const oldLetter = letters[oldIdx];
      const desc = q.eliminasi_opsi![oldLetter] || q.eliminasi_opsi![oldLetter.toLowerCase()];
      if (desc) {
        const newIdx = shuffledPilihan.indexOf(oldOpt);
        if (newIdx !== -1) {
          const newLetter = letters[newIdx];
          updatedEliminasi[newLetter] = desc;
        }
      }
    });
    newEliminasiOpsi = updatedEliminasi;
  }`;

content = content.replace(/  let newEliminasiOpsi = q\.eliminasi_opsi;[\s\S]+?\}\n    \}\);\n  \}/, correctElim);
fs.writeFileSync('src/utils/appHelpers.ts', content);
