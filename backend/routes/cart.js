const express = require('express');
const { db } = require('../config/db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

// Get current user's cart
router.get('/', authRequired, (req, res) => {
  const items = db.prepare(`
    SELECT ca.id as cart_id, ca.quantity, p.*
    FROM carts ca
    JOIN products p ON ca.product_id = p.id
    WHERE ca.user_id = ?
    ORDER BY ca.created_at DESC
  `).all(req.user.id);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalMrp = items.reduce((sum, item) => sum + item.mrp * item.quantity, 0);

  res.json({
    items,
    summary: {
      itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal,
      totalMrp,
      savings: totalMrp - subtotal
    }
  });
});

// Add item to cart (or increase qty if exists)
router.post('/', authRequired, (req, res) => {
  const { product_id, quantity = 1 } = req.body;
  if (!product_id) return res.status(400).json({ message: 'product_id is required.' });

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(product_id);
  if (!product) return res.status(404).json({ message: 'Product not found.' });

  const existing = db.prepare('SELECT * FROM carts WHERE user_id = ? AND product_id = ?').get(req.user.id, product_id);
  if (existing) {
    db.prepare('UPDATE carts SET quantity = quantity + ? WHERE id = ?').run(quantity, existing.id);
  } else {
    db.prepare('INSERT INTO carts (user_id, product_id, quantity) VALUES (?, ?, ?)').run(req.user.id, product_id, quantity);
  }
  res.status(201).json({ message: 'Added to cart.' });
});

// Update quantity of a cart item
router.put('/:cartId', authRequired, (req, res) => {
  const { quantity } = req.body;
  if (quantity < 1) return res.status(400).json({ message: 'Quantity must be at least 1.' });

  db.prepare('UPDATE carts SET quantity = ? WHERE id = ? AND user_id = ?').run(quantity, req.params.cartId, req.user.id);
  res.json({ message: 'Cart updated.' });
});

// Remove item from cart
router.delete('/:cartId', authRequired, (req, res) => {
  db.prepare('DELETE FROM carts WHERE id = ? AND user_id = ?').run(req.params.cartId, req.user.id);
  res.json({ message: 'Item removed.' });
});

// Clear entire cart
router.delete('/', authRequired, (req, res) => {
  db.prepare('DELETE FROM carts WHERE user_id = ?').run(req.user.id);
  res.json({ message: 'Cart cleared.' });
});

module.exports = router;
