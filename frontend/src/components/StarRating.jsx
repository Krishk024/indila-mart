export default function StarRating({ rating = 0, size = 'text-xs' }) {
  const rounded = Math.round(rating * 2) / 2;
  return (
    <span className={`inline-flex items-center gap-1 ${size}`}>
      <span className="bg-brand text-white rounded px-1.5 py-0.5 font-mono font-bold">
        {rating ? rating.toFixed(1) : 'New'}
      </span>
      {rating > 0 && <span aria-hidden="true">★</span>}
    </span>
  );
}
