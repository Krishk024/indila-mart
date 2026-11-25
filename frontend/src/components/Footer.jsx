export default function Footer() {
  return (
    <footer className="bg-ink text-cream/80 mt-16">
      <div className="container-xl py-10 grid sm:grid-cols-2 md:grid-cols-4 gap-8 text-sm">
        <div>
          <div className="font-display font-extrabold text-xl text-white mb-2">
            Indila<span className="text-marigold">Mart</span>
          </div>
          <p className="text-cream/60">Everyday groceries and essentials, priced fair and delivered fresh.</p>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-3">Shop</h4>
          <ul className="space-y-2 text-cream/60">
            <li>All Products</li>
            <li>Today's Deals</li>
            <li>New Arrivals</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-3">Account</h4>
          <ul className="space-y-2 text-cream/60">
            <li>My Orders</li>
            <li>My Profile</li>
            <li>Wishlist</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-3">Store info</h4>
          <ul className="space-y-2 text-cream/60">
            <li>Pune, Maharashtra, India</li>
            <li>support@indilamart.com</li>
            <li>Mon–Sun, 8am – 10pm</li>
          </ul>
        </div>
      </div>
      <div className="dotted-cut border-white/10">
        <p className="container-xl py-4 text-xs text-cream/40">© {new Date().getFullYear()} Indila Mart. Built as a demo storefront.</p>
      </div>
    </footer>
  );
}
