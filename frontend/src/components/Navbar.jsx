import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNotifications } from '../context/NotificationContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { summary } = useCart();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get('search') || '');
  const [menuOpen, setMenuOpen] = useState(false);

  const submitSearch = (e) => {
    e.preventDefault();
    navigate(q ? `/products?search=${encodeURIComponent(q)}` : '/products');
  };

  return (
    <header className="sticky top-0 z-40 bg-brand text-white shadow-md">
      <div className="container-xl flex items-center gap-4 py-3">
        <Link to="/" className="font-display font-extrabold text-2xl tracking-tight flex items-center gap-1 shrink-0">
          <span className="bg-marigold text-ink rounded-lg w-9 h-9 flex items-center justify-center text-lg">IM</span>
          <span>Indila<span className="text-marigold">Mart</span></span>
        </Link>

        <form onSubmit={submitSearch} className="flex-1 hidden sm:flex">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search for atta, rice, oil, milk…"
            className="w-full rounded-l-lg px-4 py-2 text-ink outline-none focus:ring-2 focus:ring-marigold"
            aria-label="Search products"
          />
          <button type="submit" className="bg-marigold hover:bg-marigold-dark text-ink px-4 rounded-r-lg font-bold">
            Search
          </button>
        </form>

        <nav className="hidden md:flex items-center gap-4 text-sm font-semibold shrink-0">
          <Link to="/products" className="hover:text-marigold transition-colors">All Products</Link>
          {user?.role === 'admin' && (
            <Link to="/admin" className="hover:text-marigold transition-colors">Admin</Link>
          )}
          {user ? (
            <>
              <Link to="/orders" className="hover:text-marigold transition-colors">My Orders</Link>

              {/* Notification Bell */}
              <Link to="/notifications" className="relative hover:text-marigold transition-colors" aria-label="Notifications">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-chili text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              <div className="relative group">
                <button className="hover:text-marigold transition-colors">Hi, {user.name.split(' ')[0]}</button>
                <div className="absolute right-0 top-full pt-2 hidden group-hover:block">
                  <div className="bg-white text-ink rounded-lg shadow-pop py-1 w-40">
                    <Link to="/profile" className="block px-4 py-2 text-sm hover:bg-brand-50">Profile</Link>
                    <button onClick={() => { logout(); navigate('/'); }} className="w-full text-left px-4 py-2 text-sm hover:bg-brand-50 text-chili">Logout</button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <Link to="/login" className="hover:text-marigold transition-colors">Login / Sign up</Link>
          )}
          <Link to="/cart" className="relative bg-brand-dark hover:bg-marigold hover:text-ink px-3 py-2 rounded-lg transition-colors">
            Cart
            {summary.itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-chili text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {summary.itemCount}
              </span>
            )}
          </Link>
        </nav>

        <button className="md:hidden ml-auto" onClick={() => setMenuOpen((v) => !v)} aria-label="Toggle menu">
          <span className="text-2xl">☰</span>
        </button>
      </div>

      <form onSubmit={submitSearch} className="sm:hidden container-xl pb-3 flex">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search products…"
          className="w-full rounded-l-lg px-4 py-2 text-ink outline-none"
        />
        <button type="submit" className="bg-marigold text-ink px-4 rounded-r-lg font-bold">Go</button>
      </form>

      {menuOpen && (
        <div className="md:hidden bg-brand-dark">
          <div className="container-xl py-3 flex flex-col gap-3 text-sm font-semibold">
            <Link to="/products" onClick={() => setMenuOpen(false)}>All Products</Link>
            <Link to="/cart" onClick={() => setMenuOpen(false)}>Cart ({summary.itemCount})</Link>
            {user?.role === 'admin' && <Link to="/admin" onClick={() => setMenuOpen(false)}>Admin</Link>}
            {user ? (
              <>
                <Link to="/orders" onClick={() => setMenuOpen(false)}>My Orders</Link>
                <Link to="/notifications" onClick={() => setMenuOpen(false)} className="flex items-center gap-2">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="bg-chili text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
                <Link to="/profile" onClick={() => setMenuOpen(false)}>Profile</Link>
                <button className="text-left text-marigold" onClick={() => { logout(); setMenuOpen(false); navigate('/'); }}>Logout</button>
              </>
            ) : (
              <Link to="/login" onClick={() => setMenuOpen(false)}>Login / Sign up</Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
