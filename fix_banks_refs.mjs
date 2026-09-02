import fs from 'fs';

let code = fs.readFileSync('src/components/tabs/SetupBanksTab.tsx', 'utf8');

// Fix default exports
code = code.replace("import { SearchFilterHeader } from '../SearchFilterHeader';", "import SearchFilterHeader from '../SearchFilterHeader';");
code = code.replace("import { FormatGuide } from '../FormatGuide';", "import FormatGuide from '../FormatGuide';");
code = code.replace("import { UploadZone } from '../UploadZone';", "import UploadZone from '../UploadZone';");

// Add missing props
const missingProps = `
  fileInputRef: any;
  folderInputRef: any;
  setPasteModalOpen: any;
  folderScrollRef: any;
`;

code = code.replace('removeGlobalDatabase: any;', 'removeGlobalDatabase: any;\n' + missingProps);

const missingDestructure = `, fileInputRef, folderInputRef, setPasteModalOpen, folderScrollRef`;

code = code.replace('removeGlobalDatabase\n})', 'removeGlobalDatabase' + missingDestructure + '\n})');

fs.writeFileSync('src/components/tabs/SetupBanksTab.tsx', code);

// Fix App.tsx
let appCode = fs.readFileSync('src/App.tsx', 'utf8');

const missingPropsPass = ` fileInputRef={fileInputRef} folderInputRef={folderInputRef} setPasteModalOpen={setPasteModalOpen} folderScrollRef={folderScrollRef}`;

appCode = appCode.replace('removeGlobalDatabase={removeGlobalDatabase} />', 'removeGlobalDatabase={removeGlobalDatabase}' + missingPropsPass + ' />');

fs.writeFileSync('src/App.tsx', appCode);
console.log('Fixed refs and imports for SetupBanksTab');
