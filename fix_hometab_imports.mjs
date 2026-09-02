import fs from 'fs';

let code = fs.readFileSync('src/components/tabs/SetupHomeTab.tsx', 'utf8');

// Fix OnboardingTour import
code = code.replace("import OnboardingTour from '../OnboardingTour';", "import { OnboardingTour } from '../OnboardingTour';");

// Remove CompetencyWidget import
code = code.replace("import CompetencyWidget from '../CompetencyWidget';\n", "");

// Remove competencyStats and globalDatabases from props definition
code = code.replace("  competencyStats: any;\n", "");
code = code.replace("  globalDatabases: string[];\n", "");

// Remove from destructuring
code = code.replace(" competencyStats,\n  globalDatabases,", "");
code = code.replace(" fetchGlobalLeaderboard, competencyStats,\n  globalDatabases", " fetchGlobalLeaderboard");

fs.writeFileSync('src/components/tabs/SetupHomeTab.tsx', code);

// Fix App.tsx
let appCode = fs.readFileSync('src/App.tsx', 'utf8');
appCode = appCode.replace(" competencyStats={competencyStats}", "");
appCode = appCode.replace(" globalDatabases={globalDatabases}", "");

fs.writeFileSync('src/App.tsx', appCode);
console.log('Fixed imports and props');
