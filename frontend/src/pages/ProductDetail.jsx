import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import client from '../api/client';
import PriceTag from '../components/PriceTag';
import StarRating from '../components/StarRating';
import ProductCard from '../components/ProductCard';
import { PageLoader } from '../components/RouteGuards';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  const load = () => {
    setLoading(true);
    client.get(`/products/${slug}`)
      .then((res) => setProduct(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); window.scrollTo(0, 0); }, [slug]);

  const handleAdd = async () => {
    if (!user) { navigate('/login'); return; }
    setAdding(true);
    try {
      await addToCart(product.id, qty);
      navigate('/cart');
    } finally {
      setAdding(false);
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    setSubmittingReview(true);
    try {
      await client.post(`/products/${product.id}/reviews`, reviewForm);
      setReviewForm({ rating: 5, comment: '' });
      load();
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!product) return <div className="container-xl py-16 text-center">Product not found.</div>;

  return (
    <div className="container-xl py-8">
      <div className="text-xs text-ink/50 mb-4">
        <Link to="/products" className="hover:underline">All Products</Link>
        {product.category_name && (
          <> / <Link to={`/products?category=${product.category_slug}`} className="hover:underline">{product.category_name}</Link></>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-10">
        <div className="card aspect-square flex items-center justify-center relative bg-brand-50">
          <div className="absolute top-3 left-3"><PriceTag percent={product.discount_percent} /></div>
          <span className="text-8xl" aria-hidden="true">🛒</span>
        </div>

        <div>
          <span className="text-xs uppercase tracking-wide font-semibold text-ink/50">{product.brand}</span>
          <h1 className="text-2xl font-bold mt-1">{product.name}</h1>
          <div className="mt-2"><StarRating rating={product.rating} size="text-sm" /> <span className="text-ink/50 text-sm ml-1">({product.reviews.length} reviews)</span></div>

          <div className="flex items-baseline gap-3 mt-4 font-mono">
            <span className="text-3xl font-bold">₹{product.price}</span>
            {product.mrp > product.price && <span className="text-lg text-ink/40 line-through">₹{product.mrp}</span>}
            {product.discount_percent > 0 && <span className="text-chili font-bold">Save ₹{(product.mrp - product.price).toFixed(0)}</span>}
          </div>
          <p className="text-sm text-ink/50 mt-1">Unit: {product.unit} · Inclusive of all taxes</p>

          <p className="mt-4 text-ink/70 leading-relaxed">{product.description}</p>

          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center border border-black/10 rounded-lg">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-2 font-bold" aria-label="Decrease quantity">−</button>
              <span className="px-4 font-mono font-bold">{qty}</span>
              <button onClick={() => setQty((q) => Math.min(product.stock, q + 1))} className="px-3 py-2 font-bold" aria-label="Increase quantity">+</button>
            </div>
            <button onClick={handleAdd} disabled={adding || product.stock === 0} className="btn-accent flex-1">
              {product.stock === 0 ? 'Out of Stock' : adding ? 'Adding…' : 'Add to Cart'}
            </button>
          </div>
          {product.stock > 0 && product.stock < 10 && (
            <p className="text-chili text-xs font-semibold mt-2">Hurry! Only {product.stock} left in stock.</p>
          )}
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-14 max-w-2xl">
        <h2 className="text-xl font-bold mb-4">Customer Reviews</h2>
        <form onSubmit={submitReview} className="card p-4 mb-6 flex flex-col gap-3">
          <label className="text-sm font-semibold">Your rating</label>
          <select value={reviewForm.rating} onChange={(e) => setReviewForm((f) => ({ ...f, rating: Number(e.target.value) }))} className="input-field w-32">
            {[5,4,3,2,1].map((r) => <option key={r} value={r}>{r} star{r > 1 ? 's' : ''}</option>)}
          </select>
          <textarea
            value={reviewForm.comment}
            onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
            placeholder="Share what you thought about this product…"
            className="input-field"
            rows={3}
          />
          <button type="submit" disabled={submittingReview} className="btn-primary self-start">
            {submittingReview ? 'Posting…' : 'Post Review'}
          </button>
        </form>

        <div className="space-y-4">
          {product.reviews.length === 0 && <p className="text-ink/50 text-sm">No reviews yet — be the first to review this product.</p>}
          {product.reviews.map((r) => (
            <div key={r.id} className="card p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">{r.user_name}</span>
                <StarRating rating={r.rating} />
              </div>
              {r.comment && <p className="text-sm text-ink/70 mt-2">{r.comment}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* Related products */}
      {product.related.length > 0 && (
        <section className="mt-14">
          <h2 className="text-xl font-bold mb-4">You may also like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {product.related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
