const express = require('express');
const router = express.Router();
const auth = require('../controllers/authController');
const protect = require('../middleware/auth');

router.post('/login', auth.login);
router.post('/logout', auth.logout);
router.get('/me', protect, auth.me);
router.post('/forgot-password', auth.forgotPassword);
router.post('/reset-password/:token', auth.resetPassword);
router.get('/google', auth.googleAuth);
router.get('/google/callback', auth.googleCallback);

module.exports = router;
