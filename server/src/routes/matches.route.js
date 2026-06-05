// Matches routes — all protected
const { Router } = require('express');
const { protect } = require('../middleware/auth');
const { getMatches, sendMatch, getSentMatches } = require('../controllers/matches.controller');

const router = Router();

router.use(protect);

router.get('/:id/matches',                   getMatches);      // run engine, get ranked matches
router.post('/:id/matches/:matchId/send',    sendMatch);       // mark a match as sent
router.get('/:id/sent-matches',              getSentMatches);  // view sent match history

module.exports = router;
