import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import client from '../api/client';
import ProductCard from '../components/ProductCard';
import { PageLoader } from '../components/RouteGuards';

export default function ProductListing() {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  const search = params.get('search') || '';
  const category = params.get('category') || '';
  const sort = params.get('sort') || '';
  const featured = params.get('featured') || '';
  const page = Number(params.get('page') || 1);
  const [minPrice, setMinPrice] = useState(params.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(params.get('maxPrice') || '');

  useEffect(() => {
    client.get('/categories').then((res) => setCategories(res.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const query = new URLSearchParams();
    if (search) query.set('search', search);
    if (category) query.set('category', category);
    if (sort) query.set('sort', sort);
    if (featured) query.set('featured', featured);
    if (minPrice) query.set('minPrice', minPrice);
    if (maxPrice) query.set('maxPrice', maxPrice);
    query.set('page', page);
    query.set('limit', 15);

    client.get(`/products?${query.toString()}`)
      .then((res) => {
        setProducts(res.data.products);
        setPagination(res.data.pagination);
      })
      .finally(() => setLoading(false));
  }, [search, category, sort, featured, minPrice, maxPrice, page]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    next.delete('page');
    setParams(next);
  };

  const applyPriceFilter = (e) => {
    e.preventDefault();
    const next = new URLSearchParams(params);
    if (minPrice) next.set('minPrice', minPrice); else next.delete('minPrice');
    if (maxPrice) next.set('maxPrice', maxPrice); else next.delete('maxPrice');
    next.delete('page');
    setParams(next);
  };

  const goToPage = (p) => {
    const next = new URLSearchParams(params);
    next.set('page', p);
    setParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeCategory = categories.find((c) => c.slug === category);

  return (
    <div className="container-xl py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {search ? `Search results for "${search}"` : activeCategory ? activeCategory.name : 'All Products'}
        </h1>
        <p className="text-ink/50 text-sm mt-1">{pagination.total} products found</p>
      </div>

      <div className="grid md:grid-cols-[220px_1fr] gap-6">
        {/* Filters sidebar */}
        <aside className="card p-4 h-fit md:sticky md:top-24">
          <h3 className="font-bold mb-3">Categories</h3>
          <ul className="space-y-1 text-sm mb-6">
            <li>
              <button
                onClick={() => updateParam('category', '')}
                className={`w-full text-left px-2 py-1.5 rounded-md ${!category ? 'bg-brand-50 text-brand font-semibold' : 'hover:bg-black/5'}`}
              >
                All Categories
              </button>
            </li>
            {categories.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => updateParam('category', c.slug)}
                  className={`w-full text-left px-2 py-1.5 rounded-md ${category === c.slug ? 'bg-brand-50 text-brand font-semibold' : 'hover:bg-black/5'}`}
                >
                  {c.name} <span className="text-ink/40">({c.product_count})</span>
                </button>
              </li>
            ))}
          </ul>

          <h3 className="font-bold mb-3">Price Range (₹)</h3>
          <form onSubmit={applyPriceFilter} className="flex flex-col gap-2 mb-6">
            <div className="flex gap-2">
              <input type="number" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="input-field text-sm" />
              <input type="number" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="input-field text-sm" />
            </div>
            <button type="submit" className="btn-secondary text-sm py-1.5">Apply</button>
          </form>

          <h3 className="font-bold mb-3">Sort By</h3>
          <select value={sort} onChange={(e) => updateParam('sort', e.target.value)} className="input-field text-sm">
            <option value="">Relevance</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Top Rated</option>
            <option value="discount">Highest Discount</option>
            <option value="newest">Newest</option>
          </select>
        </aside>

        {/* Product grid */}
        <div>
          {loading ? (
            <PageLoader />
          ) : products.length === 0 ? (
            <div className="card p-10 text-center text-ink/50">
              No products match your filters. Try widening your search.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>

              {pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => goToPage(p)}
                      className={`w-9 h-9 rounded-lg font-semibold text-sm ${p === pagination.page ? 'bg-brand text-white' : 'bg-white border border-black/10 hover:bg-black/5'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
