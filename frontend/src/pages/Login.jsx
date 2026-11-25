import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const redirectTo = location.state?.from || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-xl py-14 flex justify-center">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-bold mb-1">Welcome back</h1>
        <p className="text-ink/50 text-sm mb-6">Log in to your Indila Mart account.</p>

        {error && <p className="bg-chili/10 text-chili text-sm rounded-lg px-3 py-2 mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-semibold block mb-1">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="input-field"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="text-sm font-semibold block mb-1">Password</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="input-field"
              placeholder="••••••••"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary mt-2">
            {loading ? 'Logging in…' : 'Log In'}
          </button>
        </form>

        <p className="text-sm text-ink/60 mt-6 text-center">
          New to Indila Mart? <Link to="/signup" className="text-brand font-semibold hover:underline">Create an account</Link>
        </p>

        <div className="mt-6 pt-4 border-t border-black/5 text-xs text-ink/40">
          Admin demo login: <span className="font-mono">admin@indilamart.com</span> / <span className="font-mono">Admin@123</span>
        </div>
      </div>
    </div>
  );
}
