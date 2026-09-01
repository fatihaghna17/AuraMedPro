const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// add imports
const importAppHelpers = "import { getLevelInfo, shuffleArray, shuffleQuestionOptions, formatNotifTime } from './utils/appHelpers';\n";
const importQuizStorage = "import { saveHistoryToLocalStorage, loadHistoryFromLocalStorage } from './utils/quizStorage';\n";

if (!content.includes('./utils/appHelpers')) {
  content = content.replace("import { SAMPLE_BANKS } from './data/sampleBanks';", importAppHelpers + importQuizStorage + "import { SAMPLE_BANKS } from './data/sampleBanks';");
}

// remove formatNotifTime
content = content.replace(/const formatNotifTime = \([^)]+\) => {[\s\S]*?};\n/, '');

// remove saveHistoryToLocalStorage
content = content.replace(/const saveHistoryToLocalStorage = \([^)]+\) => {[\s\S]*?};\n/, '');
content = content.replace(/saveHistoryToLocalStorage\(([^)]+)\)/g, 'saveHistoryToLocalStorage($1, setQuizHistory)');

// remove getLevelInfo
content = content.replace(/const getLevelInfo = \([^)]+\) => {[\s\S]*?};\n/, '');
// getLevelInfo might have a second part or inner functions
content = content.replace(/const getLevelInfo =[\s\S]+?progress\n    };\n  };\n/, '');

// remove shuffleArray
content = content.replace(/const shuffleArray =[\s\S]+?return a;\n  };\n/, '');

// remove shuffleQuestionOptions
content = content.replace(/const shuffleQuestionOptions =[\s\S]+?eliminasi_opsi: newEliminasiOpsi\n  };\n};\n/g, '');

fs.writeFileSync('src/App.tsx', content);
console.log("App.tsx modified");
