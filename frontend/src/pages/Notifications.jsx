import { Link } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import { PageLoader } from '../components/RouteGuards';

const TYPE_ICONS = {
  placed:           '📋',
  confirmed:        '✅',
  packed:           '📦',
  shipped:          '🚚',
  out_for_delivery: '🛵',
  delivered:        '🏠',
  cancelled:        '❌',
  delivery_update:  '📅',
};

function fmt(dt) {
  if (!dt) return '';
  return new Date(dt).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

export default function Notifications() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  if (!notifications) return <PageLoader />;

  return (
    <div className="container-xl py-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-ink/50 mt-0.5">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-sm text-brand font-semibold hover:underline">
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="card p-12 text-center">
          <span className="text-5xl" aria-hidden>🔔</span>
          <h2 className="text-lg font-bold mt-4">No notifications yet</h2>
          <p className="text-ink/50 text-sm mt-1">We'll notify you when your order status changes.</p>
          <Link to="/products" className="btn-primary inline-block mt-6">Start Shopping</Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`card p-4 flex gap-4 items-start cursor-pointer transition-all hover:shadow-pop ${!n.is_read ? 'border-brand/30 bg-brand/5' : ''}`}
              onClick={() => { if (!n.is_read) markRead(n.id); }}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 ${!n.is_read ? 'bg-brand/10' : 'bg-black/5'}`}>
                {TYPE_ICONS[n.type] || '🔔'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-semibold ${!n.is_read ? 'text-brand' : 'text-ink'}`}>{n.title}</p>
                  {!n.is_read && <span className="w-2 h-2 rounded-full bg-brand shrink-0 mt-1.5" />}
                </div>
                <p className="text-sm text-ink/70 mt-0.5 leading-relaxed">{n.message}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-ink/40">{fmt(n.created_at)}</span>
                  {n.order_id && (
                    <Link
                      to={`/orders/${n.order_id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-brand font-semibold hover:underline"
                    >
                      View Order #{n.order_id} →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
