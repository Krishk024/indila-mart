import { NavLink, Outlet } from 'react-router-dom';

const LINKS = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/categories', label: 'Categories' },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/users', label: 'Customers' },
];

export default function AdminLayout() {
  return (
    <div className="container-xl py-8">
      <h1 className="text-2xl font-bold mb-6">Admin Console</h1>
      <div className="grid md:grid-cols-[200px_1fr] gap-6">
        <aside className="card p-3 h-fit md:sticky md:top-24">
          <nav className="flex md:flex-col gap-1 overflow-auto">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap ${isActive ? 'bg-brand text-white' : 'hover:bg-black/5'}`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
