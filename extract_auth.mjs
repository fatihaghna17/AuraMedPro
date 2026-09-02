import fs from 'fs';

const content = fs.readFileSync('src/App.tsx', 'utf8');

const regexes = {
  currentUser: /  const \[currentUser, setCurrentUser\] = useState<any>\(null\);\n/,
  authLoading: /  const \[authLoading, setAuthLoading\] = useState\(true\);\n/,
  authMode: /  const \[authMode, setAuthMode\] = useState<'login' \| 'register'>\('login'\);\n/,
  emailInput: /  const \[emailInput, setEmailInput\] = useState\(''\);\n/,
  passwordInput: /  const \[passwordInput, setPasswordInput\] = useState\(''\);\n/,
  localSessionId: /  const \[localSessionId, setLocalSessionId\] = useState<string \| null>\(null\);\n/,
  isSessionKicked: /  const \[isSessionKicked, setIsSessionKicked\] = useState\(false\);\n/,
  profileUsername: /  const \[profileUsername, setProfileUsername\] = useState\('user'\);\n/,
  globalDatabases: /  const \[globalDatabases, setGlobalDatabases\] = useState<any\[\]>\(\[\]\);\n/,
  uploaderMap: /  const \[uploaderMap, setUploaderMap\] = useState<Record<string, string>>\(\{\}\);\n/,
  questionDatabase: /  const \[questionDatabase, setQuestionDatabase\] = useState<Record<string, Question\[\]>>\(\{\}\);\n/,
  isLoggingInRef: /  const isLoggingInRef = useRef\(false\);\n/,
  isProfileSyncedRef: /  const isProfileSyncedRef = useRef\(false\);\n/,
};

// we need to find the function blocks.
// instead of regex, I will just dump the file with line numbers and extract manually or using a better script
