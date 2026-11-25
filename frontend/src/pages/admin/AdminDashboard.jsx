import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../../api/client';
import { PageLoader } from '../../components/RouteGuards';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    client.get('/admin/stats').then((res) => setStats(res.data));
  }, []);

  if (!stats) return <PageLoader />;

  const cards = [
    { label: 'Total Revenue', value: `₹${stats.totalRevenue.toFixed(0)}`, accent: 'text-brand' },
    { label: 'Total Orders', value: stats.totalOrders, accent: 'text-ink' },
    { label: 'Pending Orders', value: stats.pendingOrders, accent: 'text-marigold-dark' },
    { label: 'Total Products', value: stats.totalProducts, accent: 'text-ink' },
    { label: 'Low Stock Items', value: stats.lowStock, accent: 'text-chili' },
    { label: 'Customers', value: stats.totalUsers, accent: 'text-ink' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-4">
            <p className="text-xs text-ink/50 font-semibold">{c.label}</p>
            <p className={`text-2xl font-bold font-mono mt-1 ${c.accent}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-5">
          <h2 className="font-bold mb-3">Recent Orders</h2>
          <div className="flex flex-col gap-2">
            {stats.recentOrders.map((o) => (
              <Link to={`/orders/${o.id}`} key={o.id} className="flex justify-between text-sm hover:bg-black/5 rounded-lg px-2 py-1.5">
                <span>#{o.id} · {o.customer_name}</span>
                <span className="font-mono">₹{o.total_amount.toFixed(0)}</span>
              </Link>
            ))}
            {stats.recentOrders.length === 0 && <p className="text-ink/40 text-sm">No orders yet.</p>}
          </div>
        </div>
        <div className="card p-5">
          <h2 className="font-bold mb-3">Top Selling Products</h2>
          <div className="flex flex-col gap-2">
            {stats.topProducts.map((p, i) => (
              <div key={i} className="flex justify-between text-sm px-2 py-1.5">
                <span>{p.name}</span>
                <span className="font-mono text-ink/50">{p.total_sold} sold</span>
              </div>
            ))}
            {stats.topProducts.length === 0 && <p className="text-ink/40 text-sm">No sales yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
