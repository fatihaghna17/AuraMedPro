import fs from 'fs';

const block = fs.readFileSync('block_banks.txt', 'utf8');

const code = `import React from 'react';
import { BookOpen, Check, ChevronRight, Download, FolderPlus, Plus, RotateCcw, Trash } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { SearchFilterHeader } from '../SearchFilterHeader';
import { FormatGuide } from '../FormatGuide';
import { UploadZone } from '../UploadZone';

interface SetupBanksTabProps {
  theme: string;
  bankFilter: string;
  setBankFilter: any;
  searchQuery: string;
  setSearchQuery: any;
  globalDatabases: string[];
  selectedDatabases: string[];
  setSelectedDatabases: any;
  setDashboardTab: any;
  removeDatabase: any;
  showSwipeHint: boolean;
  setShowSwipeHint: any;
  questionDatabase: any;
  handleFileUpload: any;
  handleFolderUpload: any;
  handleCreateFolder: any;
  handleMoveQuiz: any;
  handleResetPersonal: any;
  customFolders: string[];
  quizFolderMap: Record<string, string>;
  isUploaderModalOpen: boolean;
  setIsUploaderModalOpen: any;
  uploaderMap: Record<string, string>;
}

export const SetupBanksTab: React.FC<SetupBanksTabProps> = ({
  theme, bankFilter, setBankFilter, searchQuery, setSearchQuery,
  globalDatabases, selectedDatabases, setSelectedDatabases,
  setDashboardTab, removeDatabase, showSwipeHint, setShowSwipeHint,
  questionDatabase, handleFileUpload, handleFolderUpload,
  handleCreateFolder, handleMoveQuiz, handleResetPersonal,
  customFolders, quizFolderMap, isUploaderModalOpen, setIsUploaderModalOpen,
  uploaderMap
}) => {
  return (
    <div className="space-y-6">
${block}
    </div>
  );
};
`;

fs.writeFileSync('src/components/tabs/SetupBanksTab.tsx', code);
console.log('SetupBanksTab.tsx written');
