import fs from 'fs';
const lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

let start = -1;
let end = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("{dashboardTab === 'banks' && (")) {
    start = i;
    for (let j = i; j < lines.length; j++) {
      if (lines[j].includes(")}")) {
        // check if next is 'new'
        if (lines[j+2] && lines[j+2].includes("dashboardTab === 'new'")) {
          end = j;
          break;
        }
      }
    }
    break;
  }
}

if (start !== -1 && end !== -1) {
  const props = `theme={theme} bankFilter={bankFilter} setBankFilter={setBankFilter} searchQuery={searchQuery} setSearchQuery={setSearchQuery} globalDatabases={globalDatabases} selectedDatabases={selectedDatabases} setSelectedDatabases={setSelectedDatabases} setDashboardTab={setDashboardTab} removeDatabase={removeDatabase} showSwipeHint={showSwipeHint} setShowSwipeHint={setShowSwipeHint} questionDatabase={questionDatabase} handleFileUpload={handleFileUpload} handleFolderUpload={handleFolderUpload} handleCreateFolder={handleCreateFolder} handleMoveQuiz={handleMoveQuiz} handleResetPersonal={handleResetPersonal} customFolders={customFolders} quizFolderMap={quizFolderMap} isUploaderModalOpen={false} setIsUploaderModalOpen={()=>{}} uploaderMap={uploaderMap}`;
  
  lines.splice(start, end - start + 1, `            {dashboardTab === 'banks' && <SetupBanksTab ${props} />}`);
}

const importIdx = lines.findIndex(l => l.includes("import { SetupHomeTab }"));
lines.splice(importIdx + 1, 0, "import { SetupBanksTab } from './components/tabs/SetupBanksTab';");

fs.writeFileSync('src/App.tsx', lines.join('\n'));
console.log('App.tsx updated for SetupBanksTab');
