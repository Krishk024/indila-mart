import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import ProductCard from '../components/ProductCard';
import { PageLoader } from '../components/RouteGuards';

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/wishlist').then((res) => setItems(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  if (items.length === 0) {
    return (
      <div className="container-xl py-20 text-center">
        <span className="text-6xl" aria-hidden="true">💛</span>
        <h1 className="text-xl font-bold mt-4">Your wishlist is empty</h1>
        <Link to="/products" className="btn-primary inline-block mt-6">Browse Products</Link>
      </div>
    );
  }

  return (
    <div className="container-xl py-8">
      <h1 className="text-2xl font-bold mb-6">My Wishlist</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </div>
  );
}
