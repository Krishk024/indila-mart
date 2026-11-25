const express = require('express');
const { db } = require('../config/db');
const { authRequired, adminOnly } = require('../middleware/auth');

const router = express.Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VALID_STATUSES = ['placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];

const STATUS_LABELS = {
  placed:           'Order Placed',
  confirmed:        'Order Confirmed',
  packed:           'Processing / Packed',
  shipped:          'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered:        'Delivered',
  cancelled:        'Cancelled',
};

const NOTIFICATION_MESSAGES = {
  confirmed:        { title: 'Order Confirmed!', message: 'Your order #{id} has been confirmed and is being prepared.' },
  packed:           { title: 'Order Packed!',    message: 'Your order #{id} has been packed and will be shipped soon.' },
  shipped:          { title: 'Order Shipped!',   message: 'Your order #{id} is on its way to you.' },
  out_for_delivery: { title: 'Out for Delivery!',message: 'Your order #{id} is out for delivery. Expect it today!' },
  delivered:        { title: 'Order Delivered!', message: 'Your order #{id} has been delivered. Enjoy your groceries!' },
  cancelled:        { title: 'Order Cancelled',  message: 'Your order #{id} has been cancelled.' },
};

/** Compute estimated delivery: 3 business days from now */
function defaultEstimatedDelivery() {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  return d.toISOString().split('T')[0];
}

/** Add a tracking entry and create a notification for the customer. */
function recordTracking(orderId, status, note, adminId) {
  db.prepare(
    `INSERT INTO order_tracking (order_id, status, tracking_note, updated_by) VALUES (?, ?, ?, ?)`
  ).run(orderId, status, note || null, adminId || null);

  const tpl = NOTIFICATION_MESSAGES[status];
  if (tpl) {
    const order = db.prepare('SELECT user_id FROM orders WHERE id = ?').get(orderId);
    if (order) {
      db.prepare(
        `INSERT INTO notifications (user_id, order_id, type, title, message) VALUES (?, ?, ?, ?, ?)`
      ).run(
        order.user_id,
        orderId,
        status,
        tpl.title,
        tpl.message.replace('{id}', orderId)
      );
    }
  }
}

// ─── Customer routes ───────────────────────────────────────────────────────────

// POST /api/orders — place an order
router.post('/', authRequired, (req, res) => {
  const { shipping_address, shipping_phone, payment_method = 'cod' } = req.body;
  if (!shipping_address) return res.status(400).json({ message: 'Shipping address is required.' });

  const cartItems = db.prepare(`
    SELECT ca.quantity, p.id as product_id, p.name, p.price, p.stock, p.image
    FROM carts ca JOIN products p ON ca.product_id = p.id
    WHERE ca.user_id = ?
  `).all(req.user.id);

  if (cartItems.length === 0) return res.status(400).json({ message: 'Cart is empty.' });

  for (const item of cartItems) {
    if (item.stock < item.quantity) {
      return res.status(400).json({ message: `Insufficient stock for ${item.name}.` });
    }
  }

  const total = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const estimatedDelivery = defaultEstimatedDelivery();

  const createOrder = db.transaction(() => {
    const orderInfo = db.prepare(`
      INSERT INTO orders (user_id, total_amount, shipping_address, shipping_phone, payment_method, status, payment_status, estimated_delivery)
      VALUES (?, ?, ?, ?, ?, 'placed', ?, ?)
    `).run(
      req.user.id, total, shipping_address, shipping_phone || null,
      payment_method, payment_method === 'cod' ? 'pending' : 'paid',
      estimatedDelivery
    );

    const orderId = orderInfo.lastInsertRowid;

    for (const item of cartItems) {
      db.prepare(`
        INSERT INTO order_items (order_id, product_id, product_name, price, quantity, product_image)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(orderId, item.product_id, item.name, item.price, item.quantity, item.image || null);
      db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(item.quantity, item.product_id);
    }

    db.prepare('DELETE FROM carts WHERE user_id = ?').run(req.user.id);

    // Record initial tracking entry
    db.prepare(
      `INSERT INTO order_tracking (order_id, status, tracking_note, updated_by) VALUES (?, 'placed', 'Order placed successfully.', ?)`
    ).run(orderId, req.user.id);

    // Notification: order placed
    db.prepare(
      `INSERT INTO notifications (user_id, order_id, type, title, message) VALUES (?, ?, 'placed', 'Order Placed!', ?)`
    ).run(req.user.id, orderId, `Your order #${orderId} has been placed successfully. Estimated delivery: ${estimatedDelivery}.`);

    return orderId;
  });

  const orderId = createOrder();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);
  res.status(201).json({ ...order, items });
});

// GET /api/orders/my-orders
router.get('/my-orders', authRequired, (req, res) => {
  const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  const withItems = orders.map(order => ({
    ...order,
    items: db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id)
  }));
  res.json(withItems);
});

// GET /api/orders/:id/tracking — full tracking timeline for one order
router.get('/:id/tracking', authRequired, (req, res) => {
  const order = db.prepare(`
    SELECT o.*, u.name as customer_name, u.email as customer_email
    FROM orders o JOIN users u ON o.user_id = u.id
    WHERE o.id = ?
  `).get(req.params.id);

  if (!order) return res.status(404).json({ message: 'Order not found.' });
  if (order.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized to view this order.' });
  }

  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  const history = db.prepare(`
    SELECT ot.*, u.name as updated_by_name
    FROM order_tracking ot
    LEFT JOIN users u ON ot.updated_by = u.id
    WHERE ot.order_id = ?
    ORDER BY ot.created_at ASC
  `).all(order.id);

  res.json({ ...order, items, history });
});

// GET /api/orders/:id — single order detail (owner or admin)
router.get('/:id', authRequired, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found.' });
  if (order.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized to view this order.' });
  }
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  const history = db.prepare(`
    SELECT ot.*, u.name as updated_by_name
    FROM order_tracking ot
    LEFT JOIN users u ON ot.updated_by = u.id
    WHERE ot.order_id = ?
    ORDER BY ot.created_at ASC
  `).all(order.id);
  res.json({ ...order, items, history });
});

// PUT /api/orders/:id/cancel — customer cancels own order
router.put('/:id/cancel', authRequired, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found.' });
  if (order.user_id !== req.user.id) return res.status(403).json({ message: 'Not authorized.' });
  if (['shipped', 'out_for_delivery', 'delivered'].includes(order.status)) {
    return res.status(400).json({ message: 'Order cannot be cancelled after it has been shipped.' });
  }
  if (order.status === 'cancelled') {
    return res.status(400).json({ message: 'Order is already cancelled.' });
  }

  const doCancel = db.transaction(() => {
    db.prepare("UPDATE orders SET status = 'cancelled' WHERE id = ?").run(order.id);
    recordTracking(order.id, 'cancelled', 'Order cancelled by customer.', req.user.id);
  });
  doCancel();

  res.json({ message: 'Order cancelled.' });
});

// ─── Admin routes ──────────────────────────────────────────────────────────────

// GET /api/orders — all orders with optional search/filter
router.get('/', authRequired, adminOnly, (req, res) => {
  const { status, search } = req.query;
  let query = `
    SELECT o.*, u.name as customer_name, u.email as customer_email
    FROM orders o JOIN users u ON o.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    query += ' AND o.status = ?';
    params.push(status);
  }
  if (search) {
    const term = `%${search}%`;
    query += ' AND (u.name LIKE ? OR u.email LIKE ? OR CAST(o.id AS TEXT) LIKE ?)';
    params.push(term, term, term);
  }

  query += ' ORDER BY o.created_at DESC';
  const orders = db.prepare(query).all(...params);
  res.json(orders);
});

// PUT /api/orders/:id/status — admin updates order status
router.put('/:id/status', authRequired, adminOnly, (req, res) => {
  const { status, tracking_note } = req.body;

  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ message: `Invalid status. Valid values: ${VALID_STATUSES.join(', ')}.` });
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found.' });

  // Business rule guards
  if (order.status === 'delivered' && status === 'cancelled') {
    return res.status(400).json({ message: 'A delivered order cannot be cancelled.' });
  }
  if (order.status === 'cancelled' && status === 'delivered') {
    return res.status(400).json({ message: 'A cancelled order cannot be marked as delivered.' });
  }
  if (order.status === 'cancelled' && status !== 'cancelled') {
    return res.status(400).json({ message: 'A cancelled order cannot be reactivated.' });
  }

  const doUpdate = db.transaction(() => {
    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, order.id);
    recordTracking(order.id, status, tracking_note || null, req.user.id);
  });
  doUpdate();

  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(order.id);
  const history = db.prepare(`
    SELECT ot.*, u.name as updated_by_name
    FROM order_tracking ot LEFT JOIN users u ON ot.updated_by = u.id
    WHERE ot.order_id = ? ORDER BY ot.created_at ASC
  `).all(order.id);

  res.json({ ...updated, history });
});

// PUT /api/orders/:id/estimated-delivery — admin sets estimated delivery date
router.put('/:id/estimated-delivery', authRequired, adminOnly, (req, res) => {
  const { estimated_delivery } = req.body;
  if (!estimated_delivery) return res.status(400).json({ message: 'estimated_delivery date is required.' });

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found.' });

  db.prepare('UPDATE orders SET estimated_delivery = ? WHERE id = ?').run(estimated_delivery, order.id);

  // Notify customer
  db.prepare(
    `INSERT INTO notifications (user_id, order_id, type, title, message) VALUES (?, ?, 'delivery_update', 'Delivery Date Updated', ?)`
  ).run(order.user_id, order.id, `The estimated delivery date for order #${order.id} has been updated to ${estimated_delivery}.`);

  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(order.id);
  res.json(updated);
});

module.exports = router;
