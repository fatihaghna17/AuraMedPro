import fs from 'fs';

let nq = fs.readFileSync('src/components/tabs/SetupNewQuizTab.tsx', 'utf8');

// replace duplicate props
nq = nq.replace(/removeDatabase: any;\s*keyboardNavEnabled: boolean;\s*setKeyboardNavEnabled: any;\s*isAdaptiveMode: boolean;\s*setIsAdaptiveMode: any;/g, '');
nq = nq.replace('globalDatabases: string[];', 'globalDatabases: string[];\n  removeDatabase: any;\n  keyboardNavEnabled: boolean;\n  setKeyboardNavEnabled: any;\n  isAdaptiveMode: boolean;\n  setIsAdaptiveMode: any;');

// replace duplicate destructured
nq = nq.replace(/, removeDatabase, keyboardNavEnabled, setKeyboardNavEnabled, isAdaptiveMode, setIsAdaptiveMode/g, '');
nq = nq.replace('globalDatabases\n})', 'globalDatabases, removeDatabase, keyboardNavEnabled, setKeyboardNavEnabled, isAdaptiveMode, setIsAdaptiveMode\n})');

fs.writeFileSync('src/components/tabs/SetupNewQuizTab.tsx', nq);


let prof = fs.readFileSync('src/components/tabs/SetupProfileTab.tsx', 'utf8');
if (!prof.includes('getLevelInfo')) {
  prof = prof.replace("import { getRarityColor", "import { getLevelInfo } from '../../utils/appHelpers';\nimport { getRarityColor");
  fs.writeFileSync('src/components/tabs/SetupProfileTab.tsx', prof);
}

console.log('Fixed tabs');
