import fs from 'fs';

const block = fs.readFileSync('block_banks.txt', 'utf8');

const allProps = [
  'theme', 'bankFilter', 'setBankFilter', 'globalDatabases', 'uploaderMap', 
  'selectedDatabases', 'setSelectedDatabases', 'setDashboardTab', 'triggerToast',
  'currentUser', 'removeDatabase', 'setShowSwipeHint', 'showSwipeHint', 
  'setGlobalCustomFolders', 'globalCustomFolders', 'globalQuizFolderMap',
  'searchQuery', 'setSearchQuery', 'questionDatabase', 'setQuestionDatabase'
];

const foundProps = allProps.filter(p => block.includes(p));
console.log(foundProps.join(', '));
