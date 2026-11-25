const express = require('express');
const { db } = require('../config/db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

router.get('/', authRequired, (req, res) => {
  const items = db.prepare(`
    SELECT w.id as wishlist_id, p.*
    FROM wishlists w JOIN products p ON w.product_id = p.id
    WHERE w.user_id = ? ORDER BY w.created_at DESC
  `).all(req.user.id);
  res.json(items);
});

router.post('/', authRequired, (req, res) => {
  const { product_id } = req.body;
  try {
    db.prepare('INSERT INTO wishlists (user_id, product_id) VALUES (?, ?)').run(req.user.id, product_id);
    res.status(201).json({ message: 'Added to wishlist.' });
  } catch (e) {
    res.status(409).json({ message: 'Already in wishlist.' });
  }
});

router.delete('/:productId', authRequired, (req, res) => {
  db.prepare('DELETE FROM wishlists WHERE user_id = ? AND product_id = ?').run(req.user.id, req.params.productId);
  res.json({ message: 'Removed from wishlist.' });
});

module.exports = router;
