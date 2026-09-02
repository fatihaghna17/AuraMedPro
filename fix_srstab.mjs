import fs from 'fs';

let code = fs.readFileSync('src/components/tabs/SetupSRSTab.tsx', 'utf8');

code = code.replace("import { Brain, CheckCircle, Play, Trash, X } from 'lucide-react';", "import { Brain, CheckCircle, Play, Trash, Trash2, X, CheckCircle2 } from 'lucide-react';");
code = code.replace("import { getCorrectLetterForQuestion, renderHtmlText } from '../../utils/appHelpers';", "import { getCorrectLetterForQuestion, renderHtmlText } from '../../utils/quizUtils';");

fs.writeFileSync('src/components/tabs/SetupSRSTab.tsx', code);
console.log('Fixed SetupSRSTab');
