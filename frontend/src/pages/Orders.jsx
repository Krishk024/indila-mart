import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { PageLoader } from '../components/RouteGuards';

const STATUS_STYLES = {
  placed: 'bg-marigold/20 text-marigold-dark',
  packed: 'bg-brand-50 text-brand',
  shipped: 'bg-brand-50 text-brand',
  delivered: 'bg-brand text-white',
  cancelled: 'bg-chili/10 text-chili',
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/orders/my-orders').then((res) => setOrders(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  if (orders.length === 0) {
    return (
      <div className="container-xl py-20 text-center">
        <span className="text-6xl" aria-hidden="true">📦</span>
        <h1 className="text-xl font-bold mt-4">No orders yet</h1>
        <p className="text-ink/50 mt-1">Your order history will show up here.</p>
        <Link to="/products" className="btn-primary inline-block mt-6">Start Shopping</Link>
      </div>
    );
  }

  return (
    <div className="container-xl py-8">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>
      <div className="flex flex-col gap-3">
        {orders.map((o) => (
          <Link to={`/orders/${o.id}`} key={o.id} className="card p-4 flex items-center justify-between hover:shadow-pop transition-shadow">
            <div>
              <p className="font-semibold text-sm">Order #{o.id}</p>
              <p className="text-xs text-ink/50 mt-0.5">
                {new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                {' · '}{o.items.reduce((s, i) => s + i.quantity, 0)} item(s)
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-mono font-bold">₹{o.total_amount.toFixed(0)}</span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[o.status] || 'bg-black/5'}`}>
                {o.status}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
