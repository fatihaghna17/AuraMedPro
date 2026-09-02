import fs from 'fs';

let code = fs.readFileSync('src/components/tabs/SetupNewQuizTab.tsx', 'utf8');

// Fix imports
code = code.replace("import { BookOpen, Play, Trash, Info }", "import { BookOpen, Play, Trash, Trash2, Info }");

// Add props
const missingProps = `
  removeDatabase: any;
  keyboardNavEnabled: boolean;
  setKeyboardNavEnabled: any;
  isAdaptiveMode: boolean;
  setIsAdaptiveMode: any;
`;

code = code.replace('globalDatabases: string[];', 'globalDatabases: string[];\n' + missingProps);

const missingDestructure = `, removeDatabase, keyboardNavEnabled, setKeyboardNavEnabled, isAdaptiveMode, setIsAdaptiveMode`;

code = code.replace('globalDatabases\n})', 'globalDatabases' + missingDestructure + '\n})');

fs.writeFileSync('src/components/tabs/SetupNewQuizTab.tsx', code);

// Fix App.tsx
let appCode = fs.readFileSync('src/App.tsx', 'utf8');

const missingPropsPass = ` removeDatabase={removeDatabase} keyboardNavEnabled={keyboardNavEnabled} setKeyboardNavEnabled={setKeyboardNavEnabled} isAdaptiveMode={isAdaptiveMode} setIsAdaptiveMode={setIsAdaptiveMode}`;

appCode = appCode.replace('globalDatabases={globalDatabases} />', 'globalDatabases={globalDatabases}' + missingPropsPass + ' />');

fs.writeFileSync('src/App.tsx', appCode);
console.log('Fixed dependencies for SetupNewQuizTab');
