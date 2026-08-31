import re

with open('/home/z/my-project/AuraMedPro/src/App.tsx', 'r') as f:
    content = f.read()

# Remove orphaned lines between AnswerNotePopup self-close and the real closing div
pattern = r'      onDelete={deleteAnswerNote}
    \n    </div>'
content = re.sub(pattern, '      onDelete={deleteAnswerNote}\n    ', content, count=1)

with open('/home/z/my-project/AuraMedPro/src/App.tsx', 'w') as f:
    f.write(content)
print('Fixed!')
