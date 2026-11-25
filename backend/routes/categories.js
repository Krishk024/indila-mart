const express = require('express');
const { db } = require('../config/db');
const { authRequired, adminOnly } = require('../middleware/auth');

const router = express.Router();

function slugify(str) {
  return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// Get all categories (with product counts)
router.get('/', (req, res) => {
  const categories = db.prepare(`
    SELECT c.*, COUNT(p.id) as product_count
    FROM categories c
    LEFT JOIN products p ON p.category_id = c.id
    GROUP BY c.id
    ORDER BY c.name
  `).all();
  res.json(categories);
});

// Get single category by slug
router.get('/:slug', (req, res) => {
  const category = db.prepare('SELECT * FROM categories WHERE slug = ?').get(req.params.slug);
  if (!category) return res.status(404).json({ message: 'Category not found.' });
  res.json(category);
});

// Admin: create category
router.post('/', authRequired, adminOnly, (req, res) => {
  const { name, image, description } = req.body;
  if (!name) return res.status(400).json({ message: 'Name is required.' });
  const slug = slugify(name);
  try {
    const info = db.prepare('INSERT INTO categories (name, slug, image, description) VALUES (?, ?, ?, ?)')
      .run(name, slug, image || null, description || null);
    res.status(201).json({ id: info.lastInsertRowid, name, slug, image, description });
  } catch (e) {
    res.status(409).json({ message: 'Category already exists.' });
  }
});

// Admin: update category
router.put('/:id', authRequired, adminOnly, (req, res) => {
  const { name, image, description } = req.body;
  const slug = name ? slugify(name) : undefined;
  db.prepare(`
    UPDATE categories SET
      name = COALESCE(?, name),
      slug = COALESCE(?, slug),
      image = COALESCE(?, image),
      description = COALESCE(?, description)
    WHERE id = ?
  `).run(name, slug, image, description, req.params.id);
  const updated = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// Admin: delete category
router.delete('/:id', authRequired, adminOnly, (req, res) => {
  db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  res.json({ message: 'Category deleted.' });
});

module.exports = router;
