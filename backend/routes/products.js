const express = require('express');
const { db } = require('../config/db');
const { authRequired, adminOnly } = require('../middleware/auth');

const router = express.Router();

function slugify(str) {
  return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// GET /api/products?search=&category=&minPrice=&maxPrice=&sort=&page=&limit=&featured=
router.get('/', (req, res) => {
  const {
    search, category, minPrice, maxPrice, sort, page = 1, limit = 20, featured, brand
  } = req.query;

  let query = `
    SELECT p.*, c.name as category_name, c.slug as category_slug
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    query += ` AND (p.name LIKE ? OR p.brand LIKE ? OR p.description LIKE ?)`;
    const term = `%${search}%`;
    params.push(term, term, term);
  }
  if (category) {
    query += ` AND c.slug = ?`;
    params.push(category);
  }
  if (brand) {
    query += ` AND p.brand = ?`;
    params.push(brand);
  }
  if (minPrice) {
    query += ` AND p.price >= ?`;
    params.push(Number(minPrice));
  }
  if (maxPrice) {
    query += ` AND p.price <= ?`;
    params.push(Number(maxPrice));
  }
  if (featured === 'true') {
    query += ` AND p.is_featured = 1`;
  }

  // Sorting
  const sortMap = {
    price_asc: 'p.price ASC',
    price_desc: 'p.price DESC',
    rating: 'p.rating DESC',
    newest: 'p.created_at DESC',
    discount: 'p.discount_percent DESC'
  };
  query += ` ORDER BY ${sortMap[sort] || 'p.created_at DESC'}`;

  // Count total for pagination (before limit)
  const countQuery = query.replace(
    'SELECT p.*, c.name as category_name, c.slug as category_slug',
    'SELECT COUNT(*) as total'
  ).replace(/ORDER BY.*$/, '');
  const total = db.prepare(countQuery).get(...params).total;

  const offset = (Number(page) - 1) * Number(limit);
  query += ` LIMIT ? OFFSET ?`;
  params.push(Number(limit), offset);

  const products = db.prepare(query).all(...params);

  res.json({
    products,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    }
  });
});

// GET single product by slug (with reviews)
router.get('/:slug', (req, res) => {
  const product = db.prepare(`
    SELECT p.*, c.name as category_name, c.slug as category_slug
    FROM products p LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.slug = ?
  `).get(req.params.slug);
  if (!product) return res.status(404).json({ message: 'Product not found.' });

  const reviews = db.prepare(`
    SELECT r.*, u.name as user_name FROM reviews r
    JOIN users u ON r.user_id = u.id
    WHERE r.product_id = ? ORDER BY r.created_at DESC
  `).all(product.id);

  // Related products (same category)
  const related = db.prepare(`
    SELECT * FROM products WHERE category_id = ? AND id != ? LIMIT 8
  `).all(product.category_id, product.id);

  res.json({ ...product, reviews, related });
});

// Admin: create product
router.post('/', authRequired, adminOnly, (req, res) => {
  const { name, description, price, mrp, stock, unit, brand, image, category_id, is_featured } = req.body;
  if (!name || !price || !mrp) return res.status(400).json({ message: 'name, price and mrp are required.' });

  const discount = Math.round(((mrp - price) / mrp) * 100);
  const slug = slugify(name);

  const info = db.prepare(`
    INSERT INTO products (name, slug, description, price, mrp, discount_percent, stock, unit, brand, image, category_id, is_featured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, slug, description || '', price, mrp, discount, stock || 0, unit || '1 pc', brand || '', image || '', category_id || null, is_featured ? 1 : 0);

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(product);
});

// Admin: update product
router.put('/:id', authRequired, adminOnly, (req, res) => {
  const { name, description, price, mrp, stock, unit, brand, image, category_id, is_featured } = req.body;
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ message: 'Product not found.' });

  const newName = name ?? existing.name;
  const newDescription = description !== undefined ? description : existing.description;
  const newPrice = price !== undefined ? Number(price) : existing.price;
  const newMrp = mrp !== undefined ? Number(mrp) : existing.mrp;
  const newStock = stock !== undefined ? Number(stock) : existing.stock;
  const newUnit = unit !== undefined ? unit : existing.unit;
  const newBrand = brand !== undefined ? brand : existing.brand;
  const newImage = image !== undefined ? image : existing.image;
  const newCategoryId = category_id !== undefined ? (category_id || null) : existing.category_id;
  const newIsFeatured = is_featured !== undefined ? (is_featured ? 1 : 0) : existing.is_featured;
  const discount = Math.round(((newMrp - newPrice) / newMrp) * 100);
  const slug = slugify(newName);

  db.prepare(`
    UPDATE products SET
      name = ?, slug = ?, description = ?,
      price = ?, mrp = ?, discount_percent = ?, stock = ?,
      unit = ?, brand = ?, image = ?,
      category_id = ?, is_featured = ?
    WHERE id = ?
  `).run(newName, slug, newDescription, newPrice, newMrp, discount, newStock, newUnit, newBrand, newImage, newCategoryId, newIsFeatured, req.params.id);

  const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// Admin: delete product
router.delete('/:id', authRequired, adminOnly, (req, res) => {
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ message: 'Product deleted.' });
});

// Add a review (any logged-in user)
router.post('/:id/reviews', authRequired, (req, res) => {
  const { rating, comment } = req.body;
  if (!rating || rating < 1 || rating > 5) return res.status(400).json({ message: 'Rating must be 1-5.' });

  db.prepare('INSERT INTO reviews (user_id, product_id, rating, comment) VALUES (?, ?, ?, ?)')
    .run(req.user.id, req.params.id, rating, comment || '');

  // Recalculate average rating
  const avg = db.prepare('SELECT AVG(rating) as avg FROM reviews WHERE product_id = ?').get(req.params.id).avg;
  db.prepare('UPDATE products SET rating = ? WHERE id = ?').run(avg, req.params.id);

  res.status(201).json({ message: 'Review added.' });
});

module.exports = router;
