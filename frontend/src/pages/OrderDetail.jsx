import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import client from '../api/client';
import { PageLoader } from '../components/RouteGuards';

const STAGES = [
  { key: 'placed',           label: 'Order Placed',       icon: '📋' },
  { key: 'confirmed',        label: 'Confirmed',           icon: '✅' },
  { key: 'packed',           label: 'Packed',              icon: '📦' },
  { key: 'shipped',          label: 'Shipped',             icon: '🚚' },
  { key: 'out_for_delivery', label: 'Out for Delivery',    icon: '🛵' },
  { key: 'delivered',        label: 'Delivered',           icon: '🏠' },
];

const STATUS_STYLES = {
  placed:           'bg-amber-100 text-amber-700',
  confirmed:        'bg-blue-100 text-blue-700',
  packed:           'bg-purple-100 text-purple-700',
  shipped:          'bg-cyan-100 text-cyan-700',
  out_for_delivery: 'bg-orange-100 text-orange-700',
  delivered:        'bg-green-100 text-green-700',
  cancelled:        'bg-red-100 text-red-700',
};

function fmt(dt) {
  if (!dt) return '';
  return new Date(dt).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [toast, setToast] = useState('');

  const load = () => {
    setLoading(true);
    client.get(`/orders/${id}/tracking`)
      .then((res) => setOrder(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const cancelOrder = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(true);
    try {
      await client.put(`/orders/${id}/cancel`);
      showToast('Order cancelled successfully.');
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not cancel order.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!order) return <div className="container-xl py-16 text-center">Order not found.</div>;

  const cancelled = order.status === 'cancelled';
  const delivered = order.status === 'delivered';

  // Find current stage index
  const currentIdx = STAGES.findIndex((s) => s.key === order.status);
  // Map history by status for timestamps
  const historyByStatus = {};
  (order.history || []).forEach((h) => {
    if (!historyByStatus[h.status]) historyByStatus[h.status] = h;
  });

  const canCancel = !cancelled && !['shipped', 'out_for_delivery', 'delivered'].includes(order.status);

  return (
    <div className="container-xl py-8 max-w-3xl">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-brand text-white px-5 py-3 rounded-xl shadow-lg text-sm font-semibold animate-fade-in">
          {toast}
        </div>
      )}

      <Link to="/orders" className="text-sm text-brand hover:underline">← Back to orders</Link>

      {/* Header */}
      <div className="flex flex-wrap items-baseline justify-between gap-2 mt-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Order #{order.id}</h1>
          <p className="text-sm text-ink/50 mt-0.5">Placed on {fmt(order.created_at)}</p>
        </div>
        <div className="text-right">
          <p className="font-mono font-bold text-xl">₹{order.total_amount.toFixed(0)}</p>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[order.status] || 'bg-black/5'}`}>
            {order.status.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      {/* Tracking Timeline */}
      <div className="card p-6 mb-6">
        <h2 className="font-bold mb-5">Order Tracking</h2>

        {cancelled ? (
          <div className="flex flex-col items-center py-4 gap-2">
            <span className="text-5xl">❌</span>
            <p className="font-bold text-red-600 text-lg">This order was cancelled</p>
            {historyByStatus['cancelled'] && (
              <p className="text-sm text-ink/50">{fmt(historyByStatus['cancelled'].created_at)}</p>
            )}
            {historyByStatus['cancelled']?.tracking_note && (
              <p className="text-sm text-ink/60 italic">"{historyByStatus['cancelled'].tracking_note}"</p>
            )}
          </div>
        ) : (
          <div className="relative">
            {STAGES.map((stage, i) => {
              const done = i <= currentIdx;
              const active = i === currentIdx;
              const entry = historyByStatus[stage.key];
              const isLast = i === STAGES.length - 1;

              return (
                <div key={stage.key} className="flex gap-4">
                  {/* Line + circle */}
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 border-2 transition-all
                      ${done ? 'bg-brand border-brand text-white' : 'bg-white border-black/15 text-ink/30'}
                      ${active ? 'ring-4 ring-brand/20 scale-110' : ''}`}>
                      {stage.icon}
                    </div>
                    {!isLast && (
                      <div className={`w-0.5 flex-1 my-1 min-h-[2rem] ${i < currentIdx ? 'bg-brand' : 'bg-black/10'}`} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="pb-6 flex-1 min-w-0">
                    <p className={`font-semibold text-sm ${done ? 'text-brand' : 'text-ink/40'} ${active ? 'text-brand font-bold' : ''}`}>
                      {stage.label}
                      {active && <span className="ml-2 text-xs bg-brand text-white rounded-full px-2 py-0.5">Current</span>}
                    </p>
                    {entry ? (
                      <div className="mt-1 space-y-0.5">
                        <p className="text-xs text-ink/50">{fmt(entry.created_at)}</p>
                        {entry.tracking_note && (
                          <p className="text-xs text-ink/60 italic">"{entry.tracking_note}"</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-ink/30 mt-1">Pending</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Estimated delivery */}
        {!cancelled && !delivered && order.estimated_delivery && (
          <div className="mt-2 pt-4 border-t border-black/5 flex items-center gap-2 text-sm">
            <span className="text-lg">📅</span>
            <span className="text-ink/60">Estimated Delivery:</span>
            <span className="font-bold text-brand">{fmtDate(order.estimated_delivery)}</span>
          </div>
        )}
        {delivered && (
          <div className="mt-2 pt-4 border-t border-black/5 flex items-center gap-2 text-sm">
            <span className="text-lg">🎉</span>
            <span className="font-semibold text-green-600">Your order has been delivered!</span>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="card p-5 mb-6">
        <h2 className="font-bold mb-3">Items Ordered</h2>
        <div className="flex flex-col gap-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              {item.product_image ? (
                <img src={`/uploads/${item.product_image}`} alt={item.product_name}
                  className="w-12 h-12 rounded-lg object-cover border border-black/5 shrink-0"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-black/5 flex items-center justify-center text-xl shrink-0">🛒</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-1">{item.product_name}</p>
                <p className="text-xs text-ink/50">Qty: {item.quantity} × ₹{item.price.toFixed(0)}</p>
              </div>
              <span className="font-mono text-sm font-semibold shrink-0">₹{(item.price * item.quantity).toFixed(0)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-black/5 mt-4 pt-3 flex justify-between font-bold">
          <span>Total</span>
          <span className="font-mono">₹{order.total_amount.toFixed(0)}</span>
        </div>
      </div>

      {/* Delivery info */}
      <div className="card p-5 mb-6 grid sm:grid-cols-2 gap-4 text-sm">
        <div>
          <h3 className="font-bold mb-2">Delivery Address</h3>
          <p className="text-ink/70 leading-relaxed">{order.shipping_address}</p>
          {order.shipping_phone && <p className="text-ink/60 mt-1">📞 {order.shipping_phone}</p>}
        </div>
        <div>
          <h3 className="font-bold mb-2">Payment</h3>
          <p className="text-ink/70 capitalize">{order.payment_method?.replace('_', ' ')}</p>
          <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
            order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {order.payment_status}
          </span>
        </div>
      </div>

      {/* Full status history */}
      {order.history && order.history.length > 0 && (
        <div className="card p-5 mb-6">
          <h2 className="font-bold mb-3">Status History</h2>
          <div className="flex flex-col gap-2">
            {order.history.map((h) => (
              <div key={h.id} className="flex gap-3 text-sm">
                <span className="text-ink/40 shrink-0 w-36">{fmt(h.created_at)}</span>
                <div>
                  <span className={`font-semibold capitalize px-1.5 py-0.5 rounded text-xs ${STATUS_STYLES[h.status] || 'bg-black/5'}`}>
                    {h.status.replace(/_/g, ' ')}
                  </span>
                  {h.tracking_note && <p className="text-ink/60 mt-0.5 italic">"{h.tracking_note}"</p>}
                  {h.updated_by_name && <p className="text-ink/40 text-xs">by {h.updated_by_name}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {canCancel && (
        <button onClick={cancelOrder} disabled={cancelling}
          className="btn-secondary text-red-600 border-red-300 hover:bg-red-50">
          {cancelling ? 'Cancelling…' : 'Cancel Order'}
        </button>
      )}
    </div>
  );
}
