UPDATE profiles 
SET password_hash = 'pbkdf2$100000$u+KOiSHmnPioqJSRVQpETg==$f1fi2qT7HMZ9m3wpEWDhRECg6SM5OFWhKD8802EUUcU=' 
WHERE LOWER(username) = 'nao' OR LOWER(email) = 'nao@ai.online';

INSERT INTO profiles (
  id, username, email, password_hash, is_guest, role, xp, streak, level, 
  total_questions_answered, created_at, last_active, angkatan, prodi, subscription_status
)
SELECT 
  '722ad297-4633-46f4-95f8-689208e67903',
  'nao',
  'nao@ai.online',
  'pbkdf2$100000$u+KOiSHmnPioqJSRVQpETg==$f1fi2qT7HMZ9m3wpEWDhRECg6SM5OFWhKD8802EUUcU=',
  0,
  'user',
  0,
  0,
  1,
  0,
  datetime('now'),
  datetime('now'),
  '24',
  'kedokteran',
  'trial'
WHERE NOT EXISTS (
  SELECT 1 FROM profiles WHERE LOWER(username) = 'nao' OR LOWER(email) = 'nao@ai.online'
);