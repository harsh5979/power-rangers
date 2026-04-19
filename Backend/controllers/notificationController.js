const Notification = require('../models/Notification');

// GET /api/notifications/my
exports.myNotifications = async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user })
    .sort({ createdAt: -1 }).limit(30);
  res.json(notifications);
};

// GET /api/notifications/unread-count
exports.unreadCount = async (req, res) => {
  const count = await Notification.countDocuments({ recipient: req.user, isRead: false });
  res.json({ count });
};

// PATCH /api/notifications/read-all
exports.readAll = async (req, res) => {
  await Notification.updateMany({ recipient: req.user, isRead: false }, { isRead: true });
  res.json({ message: 'All marked read' });
};

// PATCH /api/notifications/:id/read
exports.markRead = async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
  res.json({ message: 'Marked read' });
};
