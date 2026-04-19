const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const c = require('../controllers/notificationController');

router.use(protect);
router.get('/my', c.myNotifications);
router.get('/unread-count', c.unreadCount);
router.patch('/read-all', c.readAll);
router.patch('/:id/read', c.markRead);

module.exports = router;
