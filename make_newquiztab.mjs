import fs from 'fs';

const block = fs.readFileSync('block_newquiz.txt', 'utf8');

const code = `import React from 'react';
import { BookOpen, Play, Trash, Info } from 'lucide-react';

interface SetupNewQuizTabProps {
  theme: string;
  selectedDatabases: string[];
  setSelectedDatabases: any;
  setDashboardTab: any;
  quizMode: string;
  setQuizMode: any;
  shuffleQuestions: boolean;
  setShuffleQuestions: any;
  shuffleOptions: boolean;
  setShuffleOptions: any;
  startQuiz: any;
  globalDatabases: string[];
}

export const SetupNewQuizTab: React.FC<SetupNewQuizTabProps> = ({
  theme, selectedDatabases, setSelectedDatabases, setDashboardTab,
  quizMode, setQuizMode, shuffleQuestions, setShuffleQuestions,
  shuffleOptions, setShuffleOptions, startQuiz, globalDatabases
}) => {
  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
${block}
    </div>
  );
};
`;

// wait, the wrapper is already <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">!
// If I wrap it again, it's double wrapped. I'll just remove the wrapper from block_newquiz.txt, or return the block as is.

let finalBlock = block.replace(/<div className="space-y-6 max-w-2xl mx-auto animate-fade-in">/, '').replace(/<\/div>$/, '');

// Oh actually `extract_newquiz.mjs` dumped everything INSIDE the condition `{dashboardTab === 'new' && (`
// Wait, my `extract_newquiz.mjs` dumped `lines.slice(start + 1, end).join('\n')`
// So it includes the wrapper!

const exactCode = `import React from 'react';
import { BookOpen, Play, Trash, Info } from 'lucide-react';

interface SetupNewQuizTabProps {
  theme: string;
  selectedDatabases: string[];
  setSelectedDatabases: any;
  setDashboardTab: any;
  quizMode: string;
  setQuizMode: any;
  shuffleQuestions: boolean;
  setShuffleQuestions: any;
  shuffleOptions: boolean;
  setShuffleOptions: any;
  startQuiz: any;
  globalDatabases: string[];
}

export const SetupNewQuizTab: React.FC<SetupNewQuizTabProps> = ({
  theme, selectedDatabases, setSelectedDatabases, setDashboardTab,
  quizMode, setQuizMode, shuffleQuestions, setShuffleQuestions,
  shuffleOptions, setShuffleOptions, startQuiz, globalDatabases
}) => {
  return (
    <>
${block}
    </>
  );
};
`;

fs.writeFileSync('src/components/tabs/SetupNewQuizTab.tsx', exactCode);
console.log('SetupNewQuizTab.tsx written');
