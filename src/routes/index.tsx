import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { Minus, Plus, Trash2, ShoppingBag, X, Heart, Menu } from "lucide-react";
import "@fontsource/inter/400.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";

import { PRODUCTS, fmt } from "@/lib/products";
import { cartStore, useCartStore } from "@/lib/cart-store";
import HeroCarousel from "@/components/HeroCarousel";
import Reviews from "@/components/Reviews";
import SocialFloat from "@/components/SocialFloat";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Outfizio — Tailored Essentials for Men" },
      { name: "description", content: "Outfizio: a curated menswear storefront. Browse the collection — cart, wishlist, and instant bill." },
      { property: "og:title", content: "Outfizio — Tailored Essentials for Men" },
      { property: "og:description", content: "Precision-cut menswear. Cart, wishlist, and generate your bill." },
    ],
  }),
  component: Storefront,
});

function playChime() {
  const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return;
  const ctx = new AudioCtx();
  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.15, now + i * 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + i * 0.08);
    osc.stop(now + i * 0.08 + 0.4);
  });
}

function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div className={`fixed top-4 right-4 z-[60] flex items-center gap-3 bg-foreground text-background px-4 py-3 shadow-2xl transition-all duration-300 ease-out pointer-events-none text-[11px] font-bold uppercase tracking-widest ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"}`}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
      {message}
    </div>
  );
}

function Storefront() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, wishlist } = useCartStore();
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: "", visible: false });

  const showToast = useCallback((message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2200);
    setTimeout(() => setToast({ message: "", visible: false }), 2500);
  }, []);

  const cartEntries = useMemo(
    () => Object.entries(cart).map(([id, qty]) => ({ product: PRODUCTS.find((p) => p.id === id)!, qty })).filter((e) => e.product),
    [cart],
  );
  const subtotal = cartEntries.reduce((s, e) => s + e.product.price * e.qty, 0);
  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);

  const addToCart = (id: string) => {
    cartStore.addToCart(id);
    playChime();
    const product = PRODUCTS.find((p) => p.id === id);
    if (product) showToast(`${product.name} added to cart`);
    setCartOpen(true);
  };

  const updateQty = (id: string, delta: number) => {
    const current = cart[id] || 0;
    cartStore.setQty(id, current + delta);
  };

  const removeItem = (id: string) => {
    cartStore.removeFromCart(id);
    showToast("Item removed from cart");
  };

  const toggleWishlist = (id: string) => {
    const added = cartStore.toggleWishlist(id);
    if (added) {
      playChime();
      const product = PRODUCTS.find((p) => p.id === id);
      if (product) showToast(`${product.name} saved to wishlist`);
    } else {
      showToast("Removed from wishlist");
    }
  };

  const handleCheckout = () => {
    if (cartEntries.length === 0) return;
    if (!user) {
      showToast("Please sign in to checkout");
      setTimeout(() => navigate({ to: "/auth" }), 800);
      return;
    }
    playChime();
    navigate({ to: "/checkout" });
  };

  const continueShopping = () => {
    setCartOpen(false);
    document.getElementById("storefront")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toast message={toast.message} visible={toast.visible} />

      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className="text-xl sm:text-2xl font-extrabold tracking-tighter uppercase">Outfizio</div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6 text-xs font-medium uppercase tracking-widest">
            <a href="#storefront" className="hover:text-accent transition-colors">Collections</a>
            <a href="#heritage" className="hover:text-accent transition-colors">Heritage</a>
            <div className="flex items-center gap-2">
              <button onClick={() => setCartOpen(true)} className="relative flex items-center gap-2 px-3 py-2 bg-foreground text-background hover:bg-accent transition-colors" aria-label="Open cart">
                <ShoppingBag className="w-4 h-4" />
                <span className="font-mono">Cart ({totalItems})</span>
              </button>
              <button onClick={() => setWishlistOpen(true)} className="flex items-center gap-2 px-3 py-2 border border-border hover:border-accent hover:text-accent transition-colors" aria-label="Open wishlist">
                <Heart className="w-4 h-4" />
                <span className="font-mono">Wishlist ({wishlist.length})</span>
              </button>
              {user ? (
                <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-2 px-3 py-2 border border-border hover:border-accent hover:text-accent transition-colors" title={user.email ?? ""}>
                  <span className="font-mono">Sign Out</span>
                </button>
              ) : (
                <Link to="/auth" className="flex items-center gap-2 px-3 py-2 border border-border hover:border-accent hover:text-accent transition-colors">
                  <span className="font-mono">Sign In</span>
                </Link>
              )}
            </div>
          </div>

          {/* Mobile nav */}
          <div className="md:hidden flex items-center gap-2">
            <button onClick={() => setCartOpen(true)} className="px-2 py-1.5 bg-foreground text-background inline-flex items-center gap-1 text-xs" aria-label="Open cart">
              <ShoppingBag className="w-3.5 h-3.5" /> {totalItems}
            </button>
            <button onClick={() => setWishlistOpen(true)} className="px-2 py-1.5 border border-border inline-flex items-center gap-1 text-xs" aria-label="Open wishlist">
              <Heart className="w-3.5 h-3.5" /> {wishlist.length}
            </button>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-1.5 border border-border" aria-label="Menu">
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background px-4 py-3 space-y-2 text-xs font-bold uppercase tracking-widest">
            <a href="#storefront" onClick={() => setMobileMenuOpen(false)} className="block py-2 hover:text-accent transition-colors">Collections</a>
            <a href="#heritage" onClick={() => setMobileMenuOpen(false)} className="block py-2 hover:text-accent transition-colors">Heritage</a>
            {user ? (
              <button onClick={() => { supabase.auth.signOut(); setMobileMenuOpen(false); }} className="block w-full text-left py-2 hover:text-accent transition-colors">Sign Out</button>
            ) : (
              <Link to="/auth" onClick={() => setMobileMenuOpen(false)} className="block py-2 hover:text-accent transition-colors">Sign In</Link>
            )}
          </div>
        )}
      </nav>

      <HeroCarousel onShop={() => document.getElementById("storefront")?.scrollIntoView({ behavior: "smooth" })} />

      <main id="storefront" className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <header className="mb-10 sm:mb-12 animate-fade-in">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tighter mb-2">Tailored Essentials</h1>
          <p className="text-muted-foreground max-w-[45ch] text-pretty text-sm sm:text-base">
            The foundation of the modern masculine wardrobe. Precision cuts meet premium textiles.
          </p>
          {!user && (
            <p className="mt-3 text-[11px] font-mono text-amber-600 border border-amber-200 bg-amber-50 px-3 py-2 inline-block">
              ⚠ Please <Link to="/auth" className="underline font-bold">sign in</Link> before purchasing.
            </p>
          )}
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {PRODUCTS.map((p, i) => {
            const inWishlist = wishlist.includes(p.id);
            return (
              <div key={p.id} className={`group animate-fade-in stagger-${i + 1}`}>
                <Link to="/product/$id" params={{ id: p.id }} className="block relative overflow-hidden aspect-[3/4] bg-neutral-100 mb-4">
                  <img
                    src={p.image}
                    alt={p.name}
                    width={768}
                    height={1024}
                    loading={i === 0 ? "eager" : "lazy"}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCart(p.id); }}
                    className="absolute bottom-0 left-0 w-full bg-foreground text-background py-3 md:py-4 text-xs font-bold uppercase tracking-widest md:translate-y-full md:group-hover:translate-y-0 transition-transform duration-300"
                  >
                    Add to Cart
                  </button>
                </Link>
                <div className="flex justify-between items-start">
                  <Link to="/product/$id" params={{ id: p.id }}>
                    <h3 className="font-bold uppercase text-sm tracking-tight hover:text-accent transition-colors">{p.name}</h3>
                    <p className="font-mono text-xs mt-1 text-muted-foreground">{p.detail}</p>
                  </Link>
                  <div className="font-mono text-sm">{fmt(p.price)}</div>
                </div>
                {/* NO barcode on product card — only on receipt */}
                <button
                  onClick={() => toggleWishlist(p.id)}
                  className={`mt-3 text-[10px] uppercase tracking-tighter flex items-center gap-2 transition-colors ${inWishlist ? "font-mono text-accent" : "text-muted-foreground hover:text-accent"}`}
                >
                  {inWishlist ? "♥ In Wishlist" : "+ Save to Wishlist"}
                </button>
              </div>
            );
          })}
        </div>
      </main>

      {/* Cart Drawer */}
      <div className={`fixed inset-0 z-[70] transition-opacity duration-300 ${cartOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`} aria-hidden={!cartOpen}>
        <div className="absolute inset-0 bg-black/50" onClick={() => setCartOpen(false)} />
        <aside className={`absolute top-0 right-0 h-full w-full sm:w-[420px] bg-card shadow-2xl flex flex-col transition-transform duration-300 ease-out ${cartOpen ? "translate-x-0" : "translate-x-full"}`} role="dialog" aria-label="Shopping cart">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-5 h-5" />
              <h2 className="text-sm font-bold uppercase tracking-widest">Your Cart ({totalItems})</h2>
            </div>
            <button onClick={() => setCartOpen(false)} className="p-1 hover:bg-muted transition-colors" aria-label="Close cart"><X className="w-5 h-5" /></button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
            {cartEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-12">
                <ShoppingBag className="w-10 h-10 text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">Your cart is empty</p>
                <button onClick={continueShopping} className="mt-4 px-5 py-3 bg-foreground text-background text-[11px] font-bold uppercase tracking-widest hover:bg-accent transition-colors">Start Shopping</button>
              </div>
            ) : (
              cartEntries.map(({ product, qty }) => (
                <div key={product.id} className="flex gap-4">
                  <img src={product.image} alt={product.name} className="w-20 h-24 object-cover bg-neutral-100 flex-shrink-0" />
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex justify-between gap-2">
                      <div className="text-xs font-bold uppercase tracking-tight">{product.name}</div>
                      <div className="text-xs font-mono whitespace-nowrap">{fmt(product.price)}</div>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1">{product.detail}</div>
                    <div className="flex items-center justify-between mt-auto pt-3">
                      <div className="flex items-center border border-border">
                        <button onClick={() => updateQty(product.id, -1)} className="px-2 py-1 hover:bg-muted transition-colors" aria-label="Decrease"><Minus className="w-3 h-3" /></button>
                        <span className="px-3 text-xs font-mono tabular-nums">{qty}</span>
                        <button onClick={() => updateQty(product.id, 1)} className="px-2 py-1 hover:bg-muted transition-colors" aria-label="Increase"><Plus className="w-3 h-3" /></button>
                      </div>
                      <button onClick={() => removeItem(product.id)} className="text-muted-foreground hover:text-accent transition-colors" aria-label="Remove"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          {cartEntries.length > 0 && (
            <div className="border-t border-border px-5 py-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold uppercase tracking-widest">Subtotal</span>
                <span className="text-sm font-mono font-semibold">{fmt(subtotal)}</span>
              </div>
              {!user && <p className="text-[10px] font-mono text-amber-600">Sign in required to checkout</p>}
              <div className="flex flex-col gap-2">
                <button onClick={handleCheckout} className="w-full bg-foreground text-background py-3 text-[11px] font-bold uppercase tracking-widest hover:bg-accent transition-colors">
                  {user ? "Checkout" : "Sign In to Checkout"}
                </button>
                <button onClick={continueShopping} className="w-full border border-border py-3 text-[11px] font-bold uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors">
                  Continue Shopping
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Wishlist Drawer */}
      <div className={`fixed inset-0 z-[70] transition-opacity duration-300 ${wishlistOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`} aria-hidden={!wishlistOpen}>
        <div className="absolute inset-0 bg-black/50" onClick={() => setWishlistOpen(false)} />
        <aside className={`absolute top-0 right-0 h-full w-full sm:w-[420px] bg-card shadow-2xl flex flex-col transition-transform duration-300 ease-out ${wishlistOpen ? "translate-x-0" : "translate-x-full"}`} role="dialog" aria-label="Wishlist">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <Heart className="w-5 h-5" />
              <h2 className="text-sm font-bold uppercase tracking-widest">Wishlist ({wishlist.length})</h2>
            </div>
            <button onClick={() => setWishlistOpen(false)} className="p-1 hover:bg-muted transition-colors" aria-label="Close"><X className="w-5 h-5" /></button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
            {wishlist.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-12">
                <Heart className="w-10 h-10 text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">Your wishlist is empty</p>
                <button onClick={() => { setWishlistOpen(false); document.getElementById("storefront")?.scrollIntoView({ behavior: "smooth" }); }} className="mt-4 px-5 py-3 bg-foreground text-background text-[11px] font-bold uppercase tracking-widest hover:bg-accent transition-colors">Browse Collection</button>
              </div>
            ) : (
              wishlist.map((id) => PRODUCTS.find((p) => p.id === id)).filter((p): p is (typeof PRODUCTS)[number] => !!p).map((product) => (
                <div key={product.id} className="flex gap-4">
                  <img src={product.image} alt={product.name} className="w-20 h-24 object-cover bg-neutral-100 flex-shrink-0" />
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex justify-between gap-2">
                      <div className="text-xs font-bold uppercase tracking-tight">{product.name}</div>
                      <div className="text-xs font-mono whitespace-nowrap">{fmt(product.price)}</div>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1">{product.detail}</div>
                    <div className="flex items-center gap-2 mt-auto pt-3">
                      <button onClick={() => { addToCart(product.id); setWishlistOpen(false); }} className="flex-1 bg-foreground text-background py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-accent transition-colors">Add to Cart</button>
                      <button onClick={() => toggleWishlist(product.id)} className="text-muted-foreground hover:text-accent transition-colors" aria-label="Remove"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>

      <Reviews />
      <SocialFloat />

      {/* Heritage Section */}
      <section id="heritage" className="border-t border-border py-20 sm:py-28 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-4">Our Heritage</div>
              <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tighter mb-6">Crafted with Purpose. Built to Last.</h2>
              <p className="text-muted-foreground leading-relaxed mb-5 text-sm sm:text-base">
                Outfizio was founded on a single belief: that a man's wardrobe should be an investment, not a compromise. Born from the tradition of South Asian tailoring — where every stitch carries meaning — we marry that heritage with the clean lines of modern minimalism.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-5 text-sm sm:text-base">
                Every piece in our collection is sourced from mills that have honed their craft over generations. From the poplin weavers of Faisalabad to the indigo dyers of Multan, we work with artisans who treat fabric as a living material — not a commodity.
              </p>
              <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                We don't chase trends. We build a foundation. Each silhouette is engineered to serve you for a decade, not a season — because true style is measured in years, not weeks.
              </p>
              <div className="mt-8 grid grid-cols-3 gap-6 border-t border-border pt-8">
                <div>
                  <div className="text-2xl font-extrabold tracking-tight">5+</div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-1">Years of Craft</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold tracking-tight">100%</div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-1">Premium Fabric</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold tracking-tight">PKR</div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-1">Local Pricing</div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80" alt="Tailoring craft" className="w-full aspect-[3/4] object-cover" />
              <img src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80" alt="Premium fabric" className="w-full aspect-[3/4] object-cover mt-8" />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-14 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12">
          <div className="col-span-2 md:col-span-1">
            <div className="text-xl font-extrabold tracking-tighter uppercase mb-4">Outfizio</div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Precision-cut menswear for the modern wardrobe. Made with purpose, built to last.
            </p>
          </div>
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest mb-5">Shop</h4>
            <div className="space-y-2 text-xs text-muted-foreground">
              <a href="#storefront" className="block hover:text-accent transition-colors">Collections</a>
              <a href="#heritage" className="block hover:text-accent transition-colors">Heritage</a>
              <Link to="/auth" className="block hover:text-accent transition-colors">Sign In</Link>
            </div>
          </div>
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest mb-5">Contact</h4>
            <a href="mailto:outfizio.official@gmail.com" className="text-xs font-mono hover:text-accent transition-colors block break-all">
              outfizio.official@gmail.com
            </a>
            <div className="mt-3 text-xs text-muted-foreground">
              <div>JazzCash: 0300-0000000</div>
              <div>EasyPaisa: 0345-0000000</div>
            </div>
          </div>
          <div className="col-span-2 md:col-span-1 flex items-end justify-end">
            <div className="text-4xl sm:text-5xl font-extrabold tracking-tighter opacity-10">OUTFIZIO</div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-10 pt-6 border-t border-border flex flex-col sm:flex-row justify-between gap-2 text-[10px] font-mono text-muted-foreground">
          <span>© 2026 Outfizio. All rights reserved.</span>
          <span>Made in Pakistan 🇵🇰</span>
        </div>
      </footer>
    </div>
  );
}
