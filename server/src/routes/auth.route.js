// Auth routes — maps URLs to controller functions
const { Router } = require('express');
const { login, getMe } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

const router = Router();

// POST /api/auth/login — public, no token needed
router.post('/login', login);

// GET /api/auth/me — protected, requires valid JWT
router.get('/me', protect, getMe);

module.exports = router;
