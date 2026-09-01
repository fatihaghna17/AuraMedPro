const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');
content = content.replace(/const shuffleQuestionOptions = \(q: Question\): Question => \{[\s\S]+?return \{\n    \.\.\.q,\n    pilihan: shuffledPilihan,\n    jawaban_benar: newJawabanBenar,\n    eliminasi_opsi: newEliminasiOpsi\n  \};\n\};/g, '');
fs.writeFileSync('src/App.tsx', content);
console.log("App.tsx modified 2");
