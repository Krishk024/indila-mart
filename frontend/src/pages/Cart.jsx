import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { PageLoader } from '../components/RouteGuards';

export default function Cart() {
  const { items, summary, loading, updateQuantity, removeItem } = useCart();
  const navigate = useNavigate();

  if (loading) return <PageLoader />;

  if (items.length === 0) {
    return (
      <div className="container-xl py-20 text-center">
        <span className="text-6xl" aria-hidden="true">🛒</span>
        <h1 className="text-xl font-bold mt-4">Your cart is empty</h1>
        <p className="text-ink/50 mt-1">Add some groceries to get started.</p>
        <Link to="/products" className="btn-primary inline-block mt-6">Browse Products</Link>
      </div>
    );
  }

  return (
    <div className="container-xl py-8">
      <h1 className="text-2xl font-bold mb-6">Your Cart</h1>
      <div className="grid md:grid-cols-[1fr_320px] gap-6">
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <div key={item.cart_id} className="card p-4 flex items-center gap-4">
              <div className="w-16 h-16 bg-brand-50 rounded-lg flex items-center justify-center text-3xl shrink-0">🛒</div>
              <div className="flex-1 min-w-0">
                <Link to={`/product/${item.slug}`} className="font-semibold text-sm hover:underline line-clamp-1">{item.name}</Link>
                <p className="text-xs text-ink/50">{item.unit} · {item.brand}</p>
                <p className="font-mono font-bold mt-1">₹{item.price} <span className="text-ink/40 text-xs">× {item.quantity}</span></p>
              </div>
              <div className="flex items-center border border-black/10 rounded-lg">
                <button
                  onClick={() => item.quantity > 1 ? updateQuantity(item.cart_id, item.quantity - 1) : removeItem(item.cart_id)}
                  className="px-3 py-1.5 font-bold"
                  aria-label="Decrease quantity"
                >−</button>
                <span className="px-3 font-mono font-bold text-sm">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.cart_id, Math.min(item.stock, item.quantity + 1))}
                  className="px-3 py-1.5 font-bold"
                  aria-label="Increase quantity"
                >+</button>
              </div>
              <button onClick={() => removeItem(item.cart_id)} className="text-chili text-xs font-semibold hover:underline shrink-0">
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="card p-5 h-fit md:sticky md:top-24">
          <h2 className="font-bold mb-4">Order Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-ink/60">MRP Total</span><span className="font-mono">₹{summary.totalMrp.toFixed(0)}</span></div>
            <div className="flex justify-between text-brand"><span>You Save</span><span className="font-mono">−₹{summary.savings.toFixed(0)}</span></div>
            <div className="flex justify-between"><span className="text-ink/60">Delivery</span><span className="text-brand font-semibold">FREE</span></div>
            <div className="dotted-cut border-black/10 my-2" />
            <div className="flex justify-between font-bold text-base"><span>Total</span><span className="font-mono">₹{summary.subtotal.toFixed(0)}</span></div>
          </div>
          <button onClick={() => navigate('/checkout')} className="btn-accent w-full mt-5">Proceed to Checkout</button>
        </div>
      </div>
    </div>
  );
}
