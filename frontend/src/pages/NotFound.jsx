import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container-xl py-24 text-center">
      <span className="price-tag text-lg">404</span>
      <h1 className="text-2xl font-bold mt-4">Page not found</h1>
      <p className="text-ink/50 mt-1">The aisle you're looking for doesn't exist.</p>
      <Link to="/" className="btn-primary inline-block mt-6">Back to Home</Link>
    </div>
  );
}
