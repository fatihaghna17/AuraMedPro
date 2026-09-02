import fs from 'fs';

let code = fs.readFileSync('src/components/screens/ResultScreen.tsx', 'utf8');

// replace setReportModalOpen with setReportModal
code = code.replace(/setReportModalOpen/g, 'setReportModal');
// fix duplicate interface entry
code = code.replace(/setReportModal: any;\s*setReportModal: any;/g, 'setReportModal: any;');

fs.writeFileSync('src/components/screens/ResultScreen.tsx', code);

let appCode = fs.readFileSync('src/App.tsx', 'utf8');
appCode = appCode.replace('setReportModalOpen={setReportModalOpen}', 'setReportModal={setReportModal}');
fs.writeFileSync('src/App.tsx', appCode);

console.log('Fixed ReportModal');
