import { useEffect, useState } from 'react';
import client from '../../api/client';
import { PageLoader } from '../../components/RouteGuards';

const EMPTY_FORM = { id: null, name: '', description: '', price: '', mrp: '', stock: '', unit: '1 pc', brand: '', category_id: '', is_featured: false };

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      client.get('/products?limit=200'),
      client.get('/categories')
    ]).then(([p, c]) => {
      setProducts(p.data.products);
      setCategories(c.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(EMPTY_FORM); setShowForm(true); };
  const openEdit = (p) => {
    setForm({
      id: p.id, name: p.name, description: p.description || '', price: p.price, mrp: p.mrp,
      stock: p.stock, unit: p.unit, brand: p.brand || '', category_id: p.category_id || '', is_featured: !!p.is_featured
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, price: Number(form.price), mrp: Number(form.mrp), stock: Number(form.stock), category_id: form.category_id || null };
      if (form.id) {
        await client.put(`/products/${form.id}`, payload);
      } else {
        await client.post('/products', payload);
      }
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this product?')) return;
    await client.delete(`/products/${id}`);
    load();
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Products ({products.length})</h2>
        <button onClick={openNew} className="btn-primary text-sm py-2">+ Add Product</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-5 mb-6 grid sm:grid-cols-2 gap-3">
          <input required placeholder="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input-field sm:col-span-2" />
          <textarea placeholder="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="input-field sm:col-span-2" rows={2} />
          <input required type="number" step="0.01" placeholder="Price (₹)" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} className="input-field" />
          <input required type="number" step="0.01" placeholder="MRP (₹)" value={form.mrp} onChange={(e) => setForm((f) => ({ ...f, mrp: e.target.value }))} className="input-field" />
          <input required type="number" placeholder="Stock" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} className="input-field" />
          <input placeholder="Unit (e.g. 1 kg)" value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} className="input-field" />
          <input placeholder="Brand" value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} className="input-field" />
          <select value={form.category_id} onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))} className="input-field">
            <option value="">Select category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))} />
            Featured product
          </label>
          <div className="sm:col-span-2 flex gap-2">
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : form.id ? 'Update Product' : 'Create Product'}</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      <div className="card overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-black/5 text-left">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">Price</th>
              <th className="px-4 py-2">Stock</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-black/5">
                <td className="px-4 py-2 font-medium">{p.name}</td>
                <td className="px-4 py-2 text-ink/60">{p.category_name || '—'}</td>
                <td className="px-4 py-2 font-mono">₹{p.price}</td>
                <td className="px-4 py-2">
                  <span className={p.stock < 10 ? 'text-chili font-semibold' : ''}>{p.stock}</span>
                </td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  <button onClick={() => openEdit(p)} className="text-brand font-semibold hover:underline mr-3">Edit</button>
                  <button onClick={() => remove(p.id)} className="text-chili font-semibold hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
