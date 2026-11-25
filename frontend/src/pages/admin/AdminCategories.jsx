import { useEffect, useState } from 'react';
import client from '../../api/client';
import { PageLoader } from '../../components/RouteGuards';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    client.get('/categories').then((res) => setCategories(res.data)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await client.post('/categories', { name, description });
      setName(''); setDescription('');
      load();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this category? Products in it will be uncategorized.')) return;
    await client.delete(`/categories/${id}`);
    load();
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Categories ({categories.length})</h2>

      <form onSubmit={create} className="card p-5 mb-6 flex flex-col sm:flex-row gap-3">
        <input required placeholder="Category name" value={name} onChange={(e) => setName(e.target.value)} className="input-field flex-1" />
        <input placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} className="input-field flex-1" />
        <button type="submit" disabled={saving} className="btn-primary shrink-0">{saving ? 'Adding…' : '+ Add Category'}</button>
      </form>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
        {categories.map((c) => (
          <div key={c.id} className="card p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold">{c.name}</p>
              <p className="text-xs text-ink/50">{c.product_count} products</p>
            </div>
            <button onClick={() => remove(c.id)} className="text-chili text-xs font-semibold hover:underline">Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}
