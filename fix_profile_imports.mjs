import fs from 'fs';
let prof = fs.readFileSync('src/components/tabs/SetupProfileTab.tsx', 'utf8');

prof = prof.replace("import { Download, Upload, LogOut } from 'lucide-react';", 
  "import { Download, Upload, LogOut } from 'lucide-react';\nimport { getRarityColor, getRarityBg } from '../../utils/achievements';\nimport { getLevelInfo } from '../../utils/appHelpers';");

fs.writeFileSync('src/components/tabs/SetupProfileTab.tsx', prof);
console.log('Fixed profile imports');
