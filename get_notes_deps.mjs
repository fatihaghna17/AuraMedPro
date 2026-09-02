import fs from 'fs';
const block = fs.readFileSync('block_notestab.txt', 'utf8');

const allProps = [
  'theme', 'answerNotes', 'setNotePopupOpen', 'deleteAnswerNote', 'studyRoomCollections', 
  'activeCollectionId', 'setActiveCollectionId', 'createNewCollection', 'studyNotes',
  'addStudyNoteToCollection', 'removeStudyNoteFromCollection', 'deleteCollection',
  'isNoteModalOpen', 'setIsNoteModalOpen', 'editingNote', 'setEditingNote',
  'noteRefQuestion', 'setNoteRefQuestion'
];

const foundProps = allProps.filter(p => block.includes(p));
console.log(foundProps.join(', '));
