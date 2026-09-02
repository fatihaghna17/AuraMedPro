import fs from 'fs';

const block = fs.readFileSync('block_newquiz.txt', 'utf8');

const allProps = [
  'theme', 'selectedDatabases', 'setSelectedDatabases', 'quizMode', 'setQuizMode', 
  'questionLimits', 'setQuestionLimits', 'shuffleQuestions', 'setShuffleQuestions', 
  'shuffleOptions', 'setShuffleOptions', 'handleStartQuiz',
  'globalDatabases', 'questionDatabase'
];

const foundProps = allProps.filter(p => block.includes(p));
console.log(foundProps.join(', '));
