const { db, initDb } = require('./db');
const bcrypt = require('bcryptjs');

initDb();

function slugify(str) {
  return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const categories = [
  { name: 'Grocery & Staples', image: '/images/categories/grocery.jpg', description: 'Rice, atta, dals, oils and daily staples' },
  { name: 'Fruits & Vegetables', image: '/images/categories/fruits-veg.jpg', description: 'Fresh fruits and vegetables' },
  { name: 'Dairy & Bakery', image: '/images/categories/dairy.jpg', description: 'Milk, bread, cheese, paneer' },
  { name: 'Beverages', image: '/images/categories/beverages.jpg', description: 'Juices, soft drinks, tea, coffee' },
  { name: 'Snacks & Branded Foods', image: '/images/categories/snacks.jpg', description: 'Chips, biscuits, namkeen, ready to eat' },
  { name: 'Personal Care', image: '/images/categories/personal-care.jpg', description: 'Soaps, shampoos, oral care, skin care' },
  { name: 'Home Care', image: '/images/categories/home-care.jpg', description: 'Cleaning supplies, detergents' },
  { name: 'Baby Care', image: '/images/categories/baby-care.jpg', description: 'Diapers, baby food, baby wash' },
  { name: 'Electronics & Appliances', image: '/images/categories/electronics.jpg', description: 'Small appliances and gadgets' },
  { name: 'Fashion & Apparel', image: '/images/categories/fashion.jpg', description: 'Clothing for men, women and kids' },
  { name: 'Home & Kitchen', image: '/images/categories/home-kitchen.jpg', description: 'Kitchenware, storage, furnishing' },
  { name: 'Toys & Stationery', image: '/images/categories/toys.jpg', description: 'Toys, games and stationery items' }
];

const insertCategory = db.prepare(`INSERT OR IGNORE INTO categories (name, slug, image, description) VALUES (?, ?, ?, ?)`);
const catIds = {};
for (const c of categories) {
  const info = insertCategory.run(c.name, slugify(c.name), c.image, c.description);
  const row = db.prepare('SELECT id FROM categories WHERE name = ?').get(c.name);
  catIds[c.name] = row.id;
}

const products = [
  // Grocery
  { name: 'Basmati Rice 5kg', category: 'Grocery & Staples', price: 449, mrp: 549, brand: 'India Gate', unit: '5 kg' },
  { name: 'Wheat Atta 10kg', category: 'Grocery & Staples', price: 389, mrp: 429, brand: 'Aashirvaad', unit: '10 kg' },
  { name: 'Toor Dal 1kg', category: 'Grocery & Staples', price: 149, mrp: 179, brand: 'Tata Sampann', unit: '1 kg' },
  { name: 'Sunflower Oil 1L', category: 'Grocery & Staples', price: 139, mrp: 165, brand: 'Fortune', unit: '1 L' },
  { name: 'Sugar 1kg', category: 'Grocery & Staples', price: 46, mrp: 52, brand: 'Local', unit: '1 kg' },
  // Fruits & Veg
  { name: 'Fresh Bananas', category: 'Fruits & Vegetables', price: 45, mrp: 50, brand: 'Farm Fresh', unit: '1 dozen' },
  { name: 'Onion', category: 'Fruits & Vegetables', price: 32, mrp: 38, brand: 'Farm Fresh', unit: '1 kg' },
  { name: 'Potato', category: 'Fruits & Vegetables', price: 28, mrp: 32, brand: 'Farm Fresh', unit: '1 kg' },
  { name: 'Tomato', category: 'Fruits & Vegetables', price: 35, mrp: 40, brand: 'Farm Fresh', unit: '1 kg' },
  { name: 'Apple Shimla', category: 'Fruits & Vegetables', price: 179, mrp: 210, brand: 'Farm Fresh', unit: '1 kg' },
  // Dairy
  { name: 'Toned Milk 1L', category: 'Dairy & Bakery', price: 58, mrp: 60, brand: 'Amul', unit: '1 L' },
  { name: 'Bread', category: 'Dairy & Bakery', price: 42, mrp: 45, brand: 'Britannia', unit: '400 g' },
  { name: 'Paneer 200g', category: 'Dairy & Bakery', price: 89, mrp: 99, brand: 'Amul', unit: '200 g' },
  { name: 'Curd 400g', category: 'Dairy & Bakery', price: 40, mrp: 45, brand: 'Nestle', unit: '400 g' },
  // Beverages
  { name: 'Orange Juice 1L', category: 'Beverages', price: 110, mrp: 130, brand: 'Real', unit: '1 L' },
  { name: 'Cola 750ml', category: 'Beverages', price: 40, mrp: 45, brand: 'Coca-Cola', unit: '750 ml' },
  { name: 'Tea Powder 500g', category: 'Beverages', price: 220, mrp: 250, brand: 'Tata Tea', unit: '500 g' },
  { name: 'Instant Coffee 100g', category: 'Beverages', price: 240, mrp: 280, brand: 'Nescafe', unit: '100 g' },
  // Snacks
  { name: 'Potato Chips', category: 'Snacks & Branded Foods', price: 20, mrp: 20, brand: 'Lays', unit: '52 g' },
  { name: 'Biscuits Pack', category: 'Snacks & Branded Foods', price: 30, mrp: 35, brand: 'Parle-G', unit: '200 g' },
  { name: 'Namkeen Mix 400g', category: 'Snacks & Branded Foods', price: 89, mrp: 99, brand: 'Haldiram', unit: '400 g' },
  { name: 'Instant Noodles', category: 'Snacks & Branded Foods', price: 14, mrp: 15, brand: 'Maggi', unit: '70 g' },
  // Personal Care
  { name: 'Shampoo 340ml', category: 'Personal Care', price: 249, mrp: 299, brand: 'Head & Shoulders', unit: '340 ml' },
  { name: 'Toothpaste 200g', category: 'Personal Care', price: 99, mrp: 115, brand: 'Colgate', unit: '200 g' },
  { name: 'Bathing Soap Pack of 4', category: 'Personal Care', price: 120, mrp: 140, brand: 'Dove', unit: '4x100 g' },
  { name: 'Face Wash 100ml', category: 'Personal Care', price: 145, mrp: 170, brand: 'Himalaya', unit: '100 ml' },
  // Home Care
  { name: 'Detergent Powder 1kg', category: 'Home Care', price: 110, mrp: 130, brand: 'Surf Excel', unit: '1 kg' },
  { name: 'Dishwash Liquid 500ml', category: 'Home Care', price: 99, mrp: 115, brand: 'Vim', unit: '500 ml' },
  { name: 'Floor Cleaner 1L', category: 'Home Care', price: 149, mrp: 175, brand: 'Lizol', unit: '1 L' },
  // Baby Care
  { name: 'Diapers Pack (M)', category: 'Baby Care', price: 499, mrp: 599, brand: 'Pampers', unit: '46 pcs' },
  { name: 'Baby Wipes', category: 'Baby Care', price: 129, mrp: 149, brand: 'Himalaya', unit: '80 pcs' },
  // Electronics
  { name: 'Electric Kettle 1.5L', category: 'Electronics & Appliances', price: 799, mrp: 999, brand: 'Prestige', unit: '1 pc' },
  { name: 'Table Fan', category: 'Electronics & Appliances', price: 1299, mrp: 1599, brand: 'Bajaj', unit: '1 pc' },
  { name: 'LED Bulb 9W (Pack of 2)', category: 'Electronics & Appliances', price: 199, mrp: 249, brand: 'Philips', unit: '2 pcs' },
  // Fashion
  { name: "Men's Cotton T-Shirt", category: 'Fashion & Apparel', price: 399, mrp: 599, brand: 'Indila Basics', unit: '1 pc' },
  { name: "Women's Kurti", category: 'Fashion & Apparel', price: 549, mrp: 799, brand: 'Indila Basics', unit: '1 pc' },
  { name: 'Kids Shorts Set', category: 'Fashion & Apparel', price: 349, mrp: 499, brand: 'Indila Kids', unit: '1 pc' },
  // Home & Kitchen
  { name: 'Non-Stick Frying Pan', category: 'Home & Kitchen', price: 599, mrp: 799, brand: 'Prestige', unit: '1 pc' },
  { name: 'Steel Storage Container Set', category: 'Home & Kitchen', price: 449, mrp: 549, brand: 'Milton', unit: 'Set of 5' },
  { name: 'Cotton Bedsheet Set', category: 'Home & Kitchen', price: 699, mrp: 999, brand: 'Indila Home', unit: '1 set' },
  // Toys
  { name: 'Building Blocks Set', category: 'Toys & Stationery', price: 399, mrp: 549, brand: 'Funskool', unit: '1 set' },
  { name: 'Notebook Pack of 6', category: 'Toys & Stationery', price: 180, mrp: 210, brand: 'Classmate', unit: '6 pcs' }
];

const insertProduct = db.prepare(`
  INSERT INTO products (name, slug, description, price, mrp, discount_percent, stock, unit, brand, image, category_id, rating, is_featured)
  VALUES (@name, @slug, @description, @price, @mrp, @discount_percent, @stock, @unit, @brand, @image, @category_id, @rating, @is_featured)
`);

const insertMany = db.transaction((items) => {
  for (const p of items) {
    const discount = Math.round(((p.mrp - p.price) / p.mrp) * 100);
    insertProduct.run({
      name: p.name,
      slug: slugify(p.name),
      description: `${p.name} - ${p.brand}. Quality product available at Indila Mart.`,
      price: p.price,
      mrp: p.mrp,
      discount_percent: discount,
      stock: Math.floor(Math.random() * 150) + 20,
      unit: p.unit,
      brand: p.brand,
      image: `/images/products/${slugify(p.name)}.jpg`,
      category_id: catIds[p.category],
      rating: (Math.random() * 1.5 + 3.5).toFixed(1),
      is_featured: Math.random() > 0.7 ? 1 : 0
    });
  }
});

// Only seed products if table is empty
const countRow = db.prepare('SELECT COUNT(*) as c FROM products').get();
if (countRow.c === 0) {
  insertMany(products);
  console.log(`Seeded ${products.length} products.`);
} else {
  console.log('Products already seeded, skipping.');
}

// Create default admin user
const adminEmail = 'admin@indilamart.com';
const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
if (!existingAdmin) {
  const hashed = bcrypt.hashSync('Admin@123', 10);
  db.prepare(`INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`)
    .run('Indila Admin', adminEmail, hashed, 'admin');
  console.log('Default admin created -> email: admin@indilamart.com | password: Admin@123');
} else {
  console.log('Admin already exists.');
}

console.log('Seeding complete.');
