const express = require('express');
const { db } = require('../config/db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

// GET /api/notifications — get current user's notifications
router.get('/', authRequired, (req, res) => {
  const notifications = db.prepare(`
    SELECT * FROM notifications
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 50
  `).all(req.user.id);

  const unreadCount = db.prepare(
    'SELECT COUNT(*) as c FROM notifications WHERE user_id = ? AND is_read = 0'
  ).get(req.user.id).c;

  res.json({ notifications, unreadCount });
});

// PUT /api/notifications/:id/read — mark one notification as read
router.put('/:id/read', authRequired, (req, res) => {
  const notif = db.prepare('SELECT * FROM notifications WHERE id = ?').get(req.params.id);
  if (!notif) return res.status(404).json({ message: 'Notification not found.' });
  if (notif.user_id !== req.user.id) return res.status(403).json({ message: 'Not authorized.' });

  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(req.params.id);
  res.json({ message: 'Marked as read.' });
});

// PUT /api/notifications/read-all — mark all as read
router.put('/read-all', authRequired, (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
  res.json({ message: 'All notifications marked as read.' });
});

module.exports = router;
