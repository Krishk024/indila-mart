import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import CategoryStrip from '../components/CategoryStrip';
import ProductCard from '../components/ProductCard';
import { PageLoader } from '../components/RouteGuards';

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      client.get('/categories'),
      client.get('/products?featured=true&limit=10'),
      client.get('/products?sort=discount&limit=10')
    ]).then(([catRes, featRes, dealRes]) => {
      setCategories(catRes.data);
      setFeatured(featRes.data.products);
      setDeals(dealRes.data.products);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand to-brand-dark text-white">
        <div className="container-xl py-14 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <span className="price-tag mb-4">EVERYDAY LOW PRICES</span>
            <h1 className="font-display text-4xl md:text-5xl font-extrabold leading-tight mt-4">
              Fresh groceries.<br /> Fair prices.<br /><span className="text-marigold">Every single day.</span>
            </h1>
            <p className="mt-4 text-white/80 max-w-md">
              Indila Mart brings staples, fresh produce, and household essentials to your door —
              at the value pricing a mart is supposed to have.
            </p>
            <div className="mt-6 flex gap-3">
              <Link to="/products" className="btn-accent">Start Shopping</Link>
              <Link to="/products?sort=discount" className="bg-white/10 hover:bg-white/20 text-white font-semibold px-5 py-2.5 rounded-lg border border-white/30 transition-colors">
                Today's Deals
              </Link>
            </div>
          </div>
          <div className="hidden md:flex justify-center">
            <div className="grid grid-cols-2 gap-4">
              {['🍚','🥛','🧴','🥦'].map((e, i) => (
                <div key={i} className="w-28 h-28 bg-white/10 rounded-2xl flex items-center justify-center text-5xl backdrop-blur-sm border border-white/20">
                  {e}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="container-xl py-10 space-y-12">
        {/* Categories */}
        <section>
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-xl font-bold">Shop by Category</h2>
          </div>
          <CategoryStrip categories={categories} />
        </section>

        {/* Deals */}
        {deals.length > 0 && (
          <section>
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-xl font-bold">Today's Best Deals</h2>
              <Link to="/products?sort=discount" className="text-brand text-sm font-semibold hover:underline">View all →</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {deals.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}

        {/* Featured */}
        {featured.length > 0 && (
          <section>
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-xl font-bold">Featured Products</h2>
              <Link to="/products?featured=true" className="text-brand text-sm font-semibold hover:underline">View all →</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {featured.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
