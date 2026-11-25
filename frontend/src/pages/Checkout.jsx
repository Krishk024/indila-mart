import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import client from '../api/client';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Checkout() {
  const { items, summary, refreshCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [address, setAddress] = useState(user?.address || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');

  if (!items.length) return <Navigate to="/cart" replace />;

  const placeOrder = async (e) => {
    e.preventDefault();
    setError('');
    setPlacing(true);
    try {
      const res = await client.post('/orders', {
        shipping_address: address,
        shipping_phone: phone,
        payment_method: paymentMethod
      });
      await refreshCart();
      navigate(`/orders/${res.data.id}`, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not place order.');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="container-xl py-8">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>
      <div className="grid md:grid-cols-[1fr_320px] gap-6">
        <form onSubmit={placeOrder} className="card p-5 flex flex-col gap-4">
          <h2 className="font-bold">Delivery Details</h2>
          {error && <p className="bg-chili/10 text-chili text-sm rounded-lg px-3 py-2">{error}</p>}
          <div>
            <label className="text-sm font-semibold block mb-1">Delivery Address</label>
            <textarea
              required
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="input-field"
              placeholder="House no, street, area, city, pincode"
            />
          </div>
          <div>
            <label className="text-sm font-semibold block mb-1">Contact Phone</label>
            <input
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input-field"
              placeholder="98765 43210"
            />
          </div>

          <h2 className="font-bold mt-2">Payment Method</h2>
          <div className="flex flex-col gap-2">
            {[
              { id: 'cod', label: 'Cash on Delivery' },
              { id: 'card', label: 'Credit / Debit Card' },
              { id: 'upi', label: 'UPI' },
            ].map((opt) => (
              <label key={opt.id} className={`flex items-center gap-3 border rounded-lg px-4 py-3 cursor-pointer ${paymentMethod === opt.id ? 'border-brand bg-brand-50' : 'border-black/10'}`}>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === opt.id}
                  onChange={() => setPaymentMethod(opt.id)}
                />
                <span className="text-sm font-semibold">{opt.label}</span>
              </label>
            ))}
          </div>

          <button type="submit" disabled={placing} className="btn-accent mt-4">
            {placing ? 'Placing order…' : `Place Order · ₹${summary.subtotal.toFixed(0)}`}
          </button>
        </form>

        <div className="card p-5 h-fit">
          <h2 className="font-bold mb-4">Order Summary</h2>
          <div className="flex flex-col gap-3 max-h-64 overflow-auto pr-1">
            {items.map((item) => (
              <div key={item.cart_id} className="flex justify-between text-sm">
                <span className="line-clamp-1">{item.name} × {item.quantity}</span>
                <span className="font-mono shrink-0 ml-2">₹{(item.price * item.quantity).toFixed(0)}</span>
              </div>
            ))}
          </div>
          <div className="dotted-cut border-black/10 my-3" />
          <div className="flex justify-between font-bold"><span>Total</span><span className="font-mono">₹{summary.subtotal.toFixed(0)}</span></div>
          <p className="text-xs text-brand mt-1">You save ₹{summary.savings.toFixed(0)} on this order</p>
        </div>
      </div>
    </div>
  );
}
