import { Link } from 'react-router-dom';

const ICONS = ['🌾','🥦','🥛','🥤','🍪','🧴','🧼','🍼','🔌','👕','🍳','🧸'];

export default function CategoryStrip({ categories }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
      {categories.map((c, i) => (
        <Link
          key={c.id}
          to={`/products?category=${c.slug}`}
          className="card flex flex-col items-center gap-2 py-4 px-2 hover:shadow-pop hover:-translate-y-0.5 transition-all duration-150"
        >
          <span className="text-3xl" aria-hidden="true">{ICONS[i % ICONS.length]}</span>
          <span className="text-xs font-semibold text-center leading-tight">{c.name}</span>
          <span className="text-[10px] text-ink/40">{c.product_count} items</span>
        </Link>
      ))}
    </div>
  );
}
