import fs from 'fs';

const block = fs.readFileSync('block_srs.txt', 'utf8');

const code = `import React from 'react';
import { Brain, CheckCircle, Play, Trash, X } from 'lucide-react';
import { getCorrectLetterForQuestion, renderHtmlText } from '../../utils/appHelpers';
import { getIntervalLabel } from '../../utils/srsAlgorithm';

interface SetupSRSTabProps {
  theme: string;
  srs: any;
  triggerToast: any;
  srsAnswerRevealed: boolean;
  setSrsAnswerRevealed: any;
  srsPendingRating: number | null;
  setSrsPendingRating: any;
}

export const SetupSRSTab: React.FC<SetupSRSTabProps> = ({
  theme, srs, triggerToast, srsAnswerRevealed, setSrsAnswerRevealed,
  srsPendingRating, setSrsPendingRating
}) => {
  return (
    <>
${block}
    </>
  );
};
`;

fs.writeFileSync('src/components/tabs/SetupSRSTab.tsx', code);
console.log('SetupSRSTab.tsx written');
