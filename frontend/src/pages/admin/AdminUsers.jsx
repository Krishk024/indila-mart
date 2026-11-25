import { useEffect, useState } from 'react';
import client from '../../api/client';
import { PageLoader } from '../../components/RouteGuards';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/admin/users').then((res) => setUsers(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Customers ({users.length})</h2>
      <div className="card overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-black/5 text-left">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Phone</th>
              <th className="px-4 py-2">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-black/5">
                <td className="px-4 py-2 font-medium">{u.name}</td>
                <td className="px-4 py-2 text-ink/60">{u.email}</td>
                <td className="px-4 py-2 text-ink/60">{u.phone || '—'}</td>
                <td className="px-4 py-2 text-ink/60">{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-ink/40">No customers yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
