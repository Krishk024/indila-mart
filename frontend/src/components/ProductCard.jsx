import { Link } from 'react-router-dom';
import { useState } from 'react';
import PriceTag from './PriceTag';
import StarRating from './StarRating';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    setAdding(true);
    try {
      await addToCart(product.id, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    } finally {
      setAdding(false);
    }
  };

  return (
    <Link to={`/product/${product.slug}`} className="card group flex flex-col overflow-hidden hover:shadow-pop transition-shadow duration-150">
      <div className="relative bg-brand-50 aspect-square flex items-center justify-center overflow-hidden">
        <div className="absolute top-2 left-2 z-10">
          <PriceTag percent={product.discount_percent} />
        </div>
        <span className="text-5xl select-none" aria-hidden="true">🛒</span>
        {product.stock < 10 && product.stock > 0 && (
          <span className="absolute bottom-2 left-2 bg-marigold text-ink text-[10px] font-bold px-2 py-0.5 rounded-full">
            Only {product.stock} left
          </span>
        )}
        {product.stock === 0 && (
          <span className="absolute inset-0 bg-white/70 flex items-center justify-center text-chili font-bold text-sm">
            Out of stock
          </span>
        )}
      </div>
      <div className="p-3 flex flex-col gap-1 flex-1">
        <span className="text-[11px] uppercase tracking-wide text-ink/50 font-semibold">{product.brand}</span>
        <h3 className="text-sm font-semibold leading-snug line-clamp-2 min-h-[2.5rem]">{product.name}</h3>
        <span className="text-xs text-ink/50">{product.unit}</span>
        <div className="mt-1"><StarRating rating={product.rating} /></div>
        <div className="flex items-baseline gap-2 mt-1 font-mono">
          <span className="font-bold text-ink">₹{product.price}</span>
          {product.mrp > product.price && (
            <span className="text-xs text-ink/40 line-through">₹{product.mrp}</span>
          )}
        </div>
        <button
          onClick={handleAdd}
          disabled={adding || product.stock === 0}
          className={`mt-2 w-full text-sm font-bold py-2 rounded-lg transition-colors ${
            added ? 'bg-brand text-white' : 'bg-marigold hover:bg-marigold-dark text-ink'
          } disabled:opacity-40`}
        >
          {product.stock === 0 ? 'Unavailable' : added ? 'Added ✓' : adding ? 'Adding…' : 'Add to Cart'}
        </button>
      </div>
    </Link>
  );
}
