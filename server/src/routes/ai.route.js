// AI route — protected, single POST endpoint
const { Router } = require('express');
const { protect } = require('../middleware/auth');
const { getInsights } = require('../controllers/ai.controller');

const router = Router();

router.use(protect);

router.post('/insights', getInsights);

module.exports = router;
