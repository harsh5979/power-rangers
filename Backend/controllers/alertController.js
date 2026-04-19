const Alert = require('../models/Alert');

// GET /api/alerts/my
exports.myAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find({ recipient: req.user })
      .populate('student', 'name rollNumber riskLevel riskScore')
      .sort({ createdAt: -1 });
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/alerts/:id/read
exports.markRead = async (req, res) => {
  try {
    await Alert.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/alerts/unread-count
exports.unreadCount = async (req, res) => {
  try {
    const count = await Alert.countDocuments({ recipient: req.user, isRead: false });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
