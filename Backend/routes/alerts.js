const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const c = require('../controllers/alertController');

router.use(protect);
router.get('/my', c.myAlerts);
router.get('/unread-count', c.unreadCount);
router.patch('/:id/read', c.markRead);

module.exports = router;
