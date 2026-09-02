import fs from 'fs';
let code = fs.readFileSync('src/components/screens/ResultScreen.tsx', 'utf8');

code = code.replace("import { supabase } from '../../supabaseClient';", "");
code = code.replace("import { getCorrectLetterForQuestion, renderHtmlText, renderQuestionImage, isUserAnswerCorrect, getFeedbackForScore, generateQuestionFingerprint } from '../../utils/quizUtils';", "import { getCorrectLetterForQuestion, renderHtmlText, renderQuestionImage, isUserAnswerCorrect, getFeedbackForScore } from '../../utils/quizUtils';\nimport { generateQuestionFingerprint } from '../../utils/srsAlgorithm';");

fs.writeFileSync('src/components/screens/ResultScreen.tsx', code);
console.log('Fixed imports in ResultScreen');
