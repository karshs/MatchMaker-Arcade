// Notes routes — all protected
const { Router } = require('express');
const { protect } = require('../middleware/auth');
const { getNotes, addNote, deleteNote } = require('../controllers/notes.controller');

const router = Router();

router.use(protect);

// Notes nested under a customer
router.get('/customers/:id/notes',  getNotes);  // list all notes for a customer
router.post('/customers/:id/notes', addNote);   // add a note to a customer

// Delete by note ID directly (not nested under customer)
router.delete('/notes/:noteId', deleteNote);

module.exports = router;
