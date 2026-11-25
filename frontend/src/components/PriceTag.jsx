export default function PriceTag({ percent }) {
  if (!percent || percent <= 0) return null;
  return <span className="price-tag">{Math.round(percent)}% OFF</span>;
}
