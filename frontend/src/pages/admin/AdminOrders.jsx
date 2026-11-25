import { useEffect, useState } from 'react';
import client from '../../api/client';
import { PageLoader } from '../../components/RouteGuards';

const STATUSES = ['placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];

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
  if (!dt) return '—';
  return new Date(dt).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function fmtDate(d) {
  if (!d) return '';
  // yyyy-mm-dd → Date object without timezone shift
  const [y, m, day] = d.split('-');
  return new Date(Number(y), Number(m) - 1, Number(day)).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}

const HISTORY_ICONS = {
  placed:           '📋',
  confirmed:        '✅',
  packed:           '📦',
  shipped:          '🚚',
  out_for_delivery: '🛵',
  delivered:        '🏠',
  cancelled:        '❌',
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');

  // Detail panel state
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Update form
  const [newStatus, setNewStatus] = useState('');
  const [trackingNote, setTrackingNote] = useState('');
  const [newEstDelivery, setNewEstDelivery] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStatus) params.set('status', filterStatus);
    if (search) params.set('search', search);
    client.get(`/orders?${params}`).then((res) => setOrders(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filterStatus]);

  const handleSearch = (e) => {
    e.preventDefault();
    load();
  };

  const openDetail = async (order) => {
    setSelected(order.id);
    setDetail(null);
    setDetailLoading(true);
    setNewStatus(order.status);
    setTrackingNote('');
    setNewEstDelivery(order.estimated_delivery || '');
    try {
      const res = await client.get(`/orders/${order.id}/tracking`);
      setDetail(res.data);
      setNewStatus(res.data.status);
      setNewEstDelivery(res.data.estimated_delivery || '');
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelected(null);
    setDetail(null);
  };

  const updateStatus = async () => {
    if (!detail) return;
    setSaving(true);
    try {
      const res = await client.put(`/orders/${detail.id}/status`, {
        status: newStatus,
        tracking_note: trackingNote || undefined,
      });
      setDetail(res.data);
      setOrders((prev) => prev.map((o) => o.id === detail.id ? { ...o, status: res.data.status } : o));
      setTrackingNote('');
      showToast('Order status updated successfully!');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setSaving(false);
    }
  };

  const updateDelivery = async () => {
    if (!detail || !newEstDelivery) return;
    setSaving(true);
    try {
      const res = await client.put(`/orders/${detail.id}/estimated-delivery`, {
        estimated_delivery: newEstDelivery,
      });
      setDetail((prev) => ({ ...prev, estimated_delivery: res.data.estimated_delivery }));
      setOrders((prev) => prev.map((o) => o.id === detail.id ? { ...o, estimated_delivery: res.data.estimated_delivery } : o));
      showToast('Estimated delivery date updated!');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update delivery date.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="relative">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-brand text-white px-5 py-3 rounded-xl shadow-lg text-sm font-semibold">
          {toast}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <h2 className="text-xl font-bold mr-auto">Orders ({orders.length})</h2>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID or customer…"
            className="input-field w-52 text-sm py-1.5"
          />
          <button type="submit" className="btn-primary text-sm py-1.5 px-4">Search</button>
        </form>

        {/* Status filter */}
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input-field w-auto text-sm py-1.5">
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      <div className={`grid gap-6 ${selected ? 'lg:grid-cols-[1fr_420px]' : ''}`}>
        {/* Orders table */}
        <div className="card overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-black/5 text-left">
              <tr>
                <th className="px-4 py-2">Order</th>
                <th className="px-4 py-2">Customer</th>
                <th className="px-4 py-2">Total</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Est. Delivery</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}
                  className={`border-t border-black/5 cursor-pointer hover:bg-black/[0.02] transition-colors ${selected === o.id ? 'bg-brand/5' : ''}`}
                  onClick={() => selected === o.id ? closeDetail() : openDetail(o)}
                >
                  <td className="px-4 py-2 font-medium">#{o.id}</td>
                  <td className="px-4 py-2">
                    <div>{o.customer_name}</div>
                    <div className="text-xs text-ink/40">{o.customer_email}</div>
                  </td>
                  <td className="px-4 py-2 font-mono">₹{o.total_amount.toFixed(0)}</td>
                  <td className="px-4 py-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[o.status] || 'bg-black/5'}`}>
                      {o.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs text-ink/60">
                    {o.estimated_delivery ? fmtDate(o.estimated_delivery) : '—'}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button className="text-brand text-xs font-semibold hover:underline">
                      {selected === o.id ? 'Close' : 'Manage'}
                    </button>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-ink/40">No orders found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="card p-5 h-fit sticky top-24 flex flex-col gap-5 overflow-y-auto max-h-[80vh]">
            {detailLoading || !detail ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-brand/20 border-t-brand rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-base">Order #{detail.id}</h3>
                    <p className="text-xs text-ink/50 mt-0.5">{fmt(detail.created_at)}</p>
                  </div>
                  <button onClick={closeDetail} className="text-ink/40 hover:text-ink text-xl leading-none">×</button>
                </div>

                {/* Customer */}
                <div className="bg-black/[0.03] rounded-lg p-3 text-sm">
                  <p className="font-semibold">{detail.customer_name}</p>
                  <p className="text-ink/50 text-xs">{detail.customer_email}</p>
                  <p className="text-ink/60 mt-1 text-xs">{detail.shipping_address}</p>
                  {detail.shipping_phone && <p className="text-ink/50 text-xs">📞 {detail.shipping_phone}</p>}
                </div>

                {/* Items */}
                <div>
                  <p className="font-semibold text-sm mb-2">Items</p>
                  <div className="flex flex-col gap-2">
                    {detail.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-2 text-sm">
                        {item.product_image ? (
                          <img src={`/uploads/${item.product_image}`} alt={item.product_name}
                            className="w-9 h-9 rounded object-cover border border-black/5 shrink-0"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-9 h-9 rounded bg-black/5 flex items-center justify-center text-base shrink-0">🛒</div>
                        )}
                        <span className="flex-1 line-clamp-1 text-xs">{item.product_name} × {item.quantity}</span>
                        <span className="font-mono text-xs shrink-0">₹{(item.price * item.quantity).toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                  <p className="font-bold text-sm mt-2 text-right">Total: ₹{detail.total_amount.toFixed(0)}</p>
                </div>

                <div className="border-t border-black/5" />

                {/* Update status */}
                <div>
                  <p className="font-semibold text-sm mb-2">Update Status</p>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="input-field text-sm mb-2"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                  <textarea
                    value={trackingNote}
                    onChange={(e) => setTrackingNote(e.target.value)}
                    placeholder="Add a tracking note for the customer (optional)…"
                    rows={2}
                    className="input-field text-sm"
                  />
                  <button
                    onClick={updateStatus}
                    disabled={saving || newStatus === detail.status}
                    className="btn-primary w-full mt-2 text-sm py-2"
                  >
                    {saving ? 'Saving…' : 'Update Status'}
                  </button>
                </div>

                {/* Estimated delivery */}
                <div>
                  <p className="font-semibold text-sm mb-2">Estimated Delivery Date</p>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={newEstDelivery}
                      onChange={(e) => setNewEstDelivery(e.target.value)}
                      className="input-field text-sm flex-1"
                    />
                    <button
                      onClick={updateDelivery}
                      disabled={saving || !newEstDelivery}
                      className="btn-secondary text-sm py-2 px-4 shrink-0"
                    >
                      Save
                    </button>
                  </div>
                  {detail.estimated_delivery && (
                    <p className="text-xs text-ink/50 mt-1">Current: {fmtDate(detail.estimated_delivery)}</p>
                  )}
                </div>

                {/* Tracking history */}
                {detail.history && detail.history.length > 0 && (
                  <div>
                    <p className="font-semibold text-sm mb-2">Status History</p>
                    <div className="flex flex-col gap-2.5">
                      {detail.history.map((h) => (
                        <div key={h.id} className="flex gap-2.5 items-start text-xs">
                          <span className="text-base shrink-0">{HISTORY_ICONS[h.status] || '🔄'}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`font-semibold px-1.5 py-0.5 rounded capitalize ${STATUS_STYLES[h.status] || 'bg-black/5'}`}>
                                {h.status.replace(/_/g, ' ')}
                              </span>
                              <span className="text-ink/40">{fmt(h.created_at)}</span>
                            </div>
                            {h.tracking_note && (
                              <p className="text-ink/60 italic mt-0.5">"{h.tracking_note}"</p>
                            )}
                            {h.updated_by_name && (
                              <p className="text-ink/40">by {h.updated_by_name}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
