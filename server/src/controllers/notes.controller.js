// Notes controller — matchmaker's interaction log per customer
const { query } = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

const VALID_TYPES = ['Call', 'Meeting', 'Follow Up', 'General Note'];

// GET /api/customers/:id/notes — newest notes first
async function getNotes(req, res, next) {
  try {
    const { id } = req.params;
    const notes = await query(
      'SELECT * FROM notes WHERE customer_id = $1 ORDER BY created_at DESC',
      [id]
    );
    res.json({ success: true, data: notes });
  } catch (err) {
    next(err);
  }
}

// POST /api/customers/:id/notes — add a new note
async function addNote(req, res, next) {
  try {
    const { id } = req.params;
    const { note_type, content } = req.body;

    if (!note_type || !content) {
      return next(new AppError('note_type and content are required.', 400));
    }

    if (!VALID_TYPES.includes(note_type)) {
      return next(new AppError(`note_type must be one of: ${VALID_TYPES.join(', ')}`, 400));
    }

    // Verify the customer exists before inserting the note
    const customer = await query('SELECT id FROM customers WHERE id = $1', [id]);
    if (customer.length === 0) return next(new AppError('Customer not found.', 404));

    const rows = await query(
      'INSERT INTO notes (customer_id, note_type, content) VALUES ($1, $2, $3) RETURNING *',
      [id, note_type, content.trim()]
    );

    // Also bump last_updated on the customer so the dashboard shows recent activity
    await query('UPDATE customers SET last_updated = NOW() WHERE id = $1', [id]);

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/notes/:noteId — remove a single note
async function deleteNote(req, res, next) {
  try {
    const { noteId } = req.params;
    const rows = await query(
      'DELETE FROM notes WHERE id = $1 RETURNING id',
      [noteId]
    );

    if (rows.length === 0) return next(new AppError('Note not found.', 404));

    res.json({ success: true, message: 'Note deleted.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getNotes, addNote, deleteNote };
