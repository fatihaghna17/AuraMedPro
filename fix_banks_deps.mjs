import fs from 'fs';

let code = fs.readFileSync('src/components/tabs/SetupBanksTab.tsx', 'utf8');

// Fix imports
code = code.replace("import { AnimatePresence }", "import { AnimatePresence, motion }");
code = code.replace("import { BookOpen, Check, ChevronRight, Download, FolderPlus, Plus, RotateCcw, Trash }", "import { BookOpen, Check, ChevronRight, Download, FolderPlus, Plus, RotateCcw, Trash, Trash2 }");

// Add missing props
const missingProps = `
  filteredDatabases: any;
  quizHistory: any[];
  questionLimits: any;
  setQuestionLimits: any;
  profileUsername: string;
  downloadDatabase: any;
  setMoveQuizModal: any;
  removeGlobalDatabase: any;
`;

code = code.replace('uploaderMap: Record<string, string>;', 'uploaderMap: Record<string, string>;\n' + missingProps);

const missingDestructure = `, filteredDatabases, quizHistory, questionLimits, setQuestionLimits, profileUsername, downloadDatabase, setMoveQuizModal, removeGlobalDatabase`;

code = code.replace('uploaderMap\n})', 'uploaderMap' + missingDestructure + '\n})');

fs.writeFileSync('src/components/tabs/SetupBanksTab.tsx', code);

// Fix App.tsx
let appCode = fs.readFileSync('src/App.tsx', 'utf8');

const missingPropsPass = ` filteredDatabases={filteredDatabases} quizHistory={quizHistory} questionLimits={questionLimits} setQuestionLimits={setQuestionLimits} profileUsername={profileUsername} downloadDatabase={downloadDatabase} setMoveQuizModal={setMoveQuizModal} removeGlobalDatabase={removeGlobalDatabase}`;

appCode = appCode.replace('uploaderMap={uploaderMap} />', 'uploaderMap={uploaderMap}' + missingPropsPass + ' />');

fs.writeFileSync('src/App.tsx', appCode);
console.log('Fixed dependencies for SetupBanksTab');
