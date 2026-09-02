import fs from 'fs';

let code = fs.readFileSync('src/components/screens/QuizScreen.tsx', 'utf8');

// Fix imports
code = code.replace("import { QuizHeader }", "import QuizHeader");
code = code.replace("import { MobileQuizNavDrawer }", "import MobileQuizNavDrawer");
code = code.replace("import { KeyboardHintPanel }", "import KeyboardHintPanel");
code = code.replace("import { MobileBottomActionBar }", "import MobileBottomActionBar");

code = code.replace("import { EXPLAIN_MODES } from '../../utils/aiExplain';", "import { EXPLAIN_MODES } from '../../utils/aiExplain';\nimport { generateQuestionFingerprint } from '../../utils/srsAlgorithm';\nimport { getLevelInfo } from '../../utils/appHelpers';");

// Add missing props
const missingProps = `
  selectedDatabases: string[];
  userXP: number;
  currentStreak: number;
`;

code = code.replace('openNotePopup: any;', 'openNotePopup: any;\n' + missingProps);

// Add to destructuring
const missingDestructure = `, selectedDatabases, userXP, currentStreak, finishQuiz`;

code = code.replace('openNotePopup\n})', 'openNotePopup' + missingDestructure + '\n})');

fs.writeFileSync('src/components/screens/QuizScreen.tsx', code);

// Update App.tsx
let appCode = fs.readFileSync('src/App.tsx', 'utf8');
const passProps = ` selectedDatabases={selectedDatabases} userXP={userXP} currentStreak={currentStreak}`;
appCode = appCode.replace('openNotePopup={openNotePopup} />', 'openNotePopup={openNotePopup}' + passProps + ' />');
fs.writeFileSync('src/App.tsx', appCode);

console.log('Fixed QuizScreen');
