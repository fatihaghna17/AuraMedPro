import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Add import
const importStr = "import { useToast } from './hooks/useToast';\n";
content = content.replace("import { useStudyRoom } from './hooks/useStudyRoom';", importStr + "import { useStudyRoom } from './hooks/useStudyRoom';");

// Remove state
content = content.replace(/  const \[toastMessage, setToastMessage\] = useState<\{[^>]+\} \| null>\(null\);\n/, '');

// Remove triggerToast function
const triggerToastRegex = /  const triggerToast = \([^)]+\) => \{\n    setToastMessage\([^)]+\);\n    setTimeout\(\(\) => \{\n      setToastMessage\(null\);\n    \}, 3000\);\n  \};\n/;
content = content.replace(triggerToastRegex, '');

// Insert hook usage right before the next state (e.g. before notifOpen)
content = content.replace(
  "  const [notifOpen, setNotifOpen] = useState(false);",
  "  const { toastMessage, triggerToast } = useToast();\n  const [notifOpen, setNotifOpen] = useState(false);"
);

fs.writeFileSync('src/App.tsx', content);
console.log("App.tsx modified for useToast");
