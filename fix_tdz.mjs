import fs from 'fs';
let lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

const extractAndRemove = (searchStr) => {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(searchStr)) {
      const line = lines[i];
      lines[i] = '// removed for TDZ';
      return line;
    }
  }
  return '';
};

const l1 = extractAndRemove('const [selectedDatabases, setSelectedDatabases]');
const l2 = extractAndRemove('const [pendingSessions, setPendingSessions]');
const l3 = extractAndRemove('const [globalCustomFolders, setGlobalCustomFolders]');
const l4 = extractAndRemove('const [globalQuizFolderMap, setGlobalQuizFolderMap]');

// find where to insert (before const { currentUser... = useAuth)
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const {') && lines[i+1] && lines[i+1].includes('currentUser, authLoading')) {
    lines.splice(i, 0, l1, l2, l3, l4);
    break;
  }
}

fs.writeFileSync('src/App.tsx', lines.join('\n'));
