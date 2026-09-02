import fs from 'fs';

// Fix SetupNewQuizTab
let code = fs.readFileSync('src/components/tabs/SetupNewQuizTab.tsx', 'utf8');

const doubleProps = `
  removeDatabase: any;
  keyboardNavEnabled: boolean;
  setKeyboardNavEnabled: any;
  isAdaptiveMode: boolean;
  setIsAdaptiveMode: any;

  removeDatabase: any;
  keyboardNavEnabled: boolean;
  setKeyboardNavEnabled: any;
  isAdaptiveMode: boolean;
  setIsAdaptiveMode: any;`;
  
const singleProps = `
  removeDatabase: any;
  keyboardNavEnabled: boolean;
  setKeyboardNavEnabled: any;
  isAdaptiveMode: boolean;
  setIsAdaptiveMode: any;`;

code = code.replace(doubleProps, singleProps);

const doubleDestructure = `, removeDatabase, keyboardNavEnabled, setKeyboardNavEnabled, isAdaptiveMode, setIsAdaptiveMode, removeDatabase, keyboardNavEnabled, setKeyboardNavEnabled, isAdaptiveMode, setIsAdaptiveMode`;
const singleDestructure = `, removeDatabase, keyboardNavEnabled, setKeyboardNavEnabled, isAdaptiveMode, setIsAdaptiveMode`;
code = code.replace(doubleDestructure, singleDestructure);

fs.writeFileSync('src/components/tabs/SetupNewQuizTab.tsx', code);

// Fix SetupProfileTab
let profCode = fs.readFileSync('src/components/tabs/SetupProfileTab.tsx', 'utf8');
if (!profCode.includes('getLevelInfo')) {
  profCode = profCode.replace("import { getRarityColor", "import { getLevelInfo } from '../../utils/appHelpers';\nimport { getRarityColor");
  fs.writeFileSync('src/components/tabs/SetupProfileTab.tsx', profCode);
}
console.log('Fixed build errors');
