# Indila Mart

A full-stack grocery e-commerce app in the style of DMart — product catalog,
search & filters, cart, checkout, order tracking, and a full admin console.

## Stack
- **Backend:** Node.js + Express + SQLite (better-sqlite3), JWT auth
- **Frontend:** React + Vite + Tailwind CSS

## Project structure
```
indila-mart/
  backend/     Express API + SQLite database
  frontend/    React storefront + admin console
```

## Setup

### 1. Backend
```bash
cd backend
npm install
node config/seed.js     # creates DB, seeds categories/products, creates admin user
npm start                # runs on http://localhost:5000
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev               # runs on http://localhost:3000, proxies /api to :5000
```

Open **http://localhost:3000** in your browser.

## Demo accounts
- **Admin:** `admin@indilamart.com` / `Admin@123` → visit `/admin` after logging in
- **Customer:** sign up for a new account from the app, or use the demo flow

## Features
- Product catalog with 8 categories and 40+ seeded Indian grocery products
- Search, category filter, price range filter, sorting (price/rating/discount/newest)
- Product detail pages with customer reviews and related products
- Cart, checkout (COD/Card/UPI), order placement with stock deduction
- Order tracking with a visual status stepper (placed → packed → shipped → delivered)
- Order cancellation (before shipping)
- Wishlist
- User profile management
- Full admin console: dashboard stats, product CRUD, category CRUD,
  order status management, customer list

## Notes
- The database is a local SQLite file (`backend/indila_mart.db`), created on first
  run of the seed script. Delete it and re-run `node config/seed.js` to reset data.
- Environment variables are in `backend/.env` (JWT secret, port). Change
  `JWT_SECRET` before any real deployment.
- Product images are represented with emoji placeholders in the UI — swap in real
  images via the `image` field on products/categories (upload endpoint included
  at `POST /api/upload`, admin-only) if you want photos.
