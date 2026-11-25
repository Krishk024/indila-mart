const express = require('express');
const { db } = require('../config/db');
const { authRequired, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.use(authRequired, adminOnly);

// Dashboard summary stats
router.get('/stats', (req, res) => {
  const totalProducts = db.prepare('SELECT COUNT(*) as c FROM products').get().c;
  const totalOrders = db.prepare('SELECT COUNT(*) as c FROM orders').get().c;
  const totalUsers = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'customer'").get().c;
  const totalRevenue = db.prepare("SELECT COALESCE(SUM(total_amount),0) as s FROM orders WHERE status != 'cancelled'").get().s;
  const pendingOrders = db.prepare("SELECT COUNT(*) as c FROM orders WHERE status = 'placed'").get().c;
  const lowStock = db.prepare('SELECT COUNT(*) as c FROM products WHERE stock < 10').get().c;

  const recentOrders = db.prepare(`
    SELECT o.id, o.total_amount, o.status, o.created_at, u.name as customer_name
    FROM orders o JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC LIMIT 5
  `).all();

  const topProducts = db.prepare(`
    SELECT p.name, SUM(oi.quantity) as total_sold
    FROM order_items oi JOIN products p ON oi.product_id = p.id
    GROUP BY oi.product_id ORDER BY total_sold DESC LIMIT 5
  `).all();

  res.json({
    totalProducts, totalOrders, totalUsers, totalRevenue, pendingOrders, lowStock,
    recentOrders, topProducts
  });
});

// List all customers
router.get('/users', (req, res) => {
  const users = db.prepare("SELECT id, name, email, phone, role, created_at FROM users WHERE role = 'customer' ORDER BY created_at DESC").all();
  res.json(users);
});

module.exports = router;
