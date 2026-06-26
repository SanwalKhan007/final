import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Heart,
  Minus,
  Plus,
  Ruler,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
  RotateCcw,
} from "lucide-react";

import { PRODUCTS, fmt } from "@/lib/products";
import { cartStore, useCartStore } from "@/lib/cart-store";
import { supabase } from "@/integrations/supabase/client";
import Barcode from "@/components/Barcode";

export const Route = createFileRoute("/product/$id")({
  head: ({ params }) => {
    const product = PRODUCTS.find((p) => p.id === params.id);
    return {
      meta: [
        { title: product ? `${product.name} — Outfizio` : "Product — Outfizio" },
        {
          name: "description",
          content: product?.description.slice(0, 155) ?? "Outfizio product",
        },
        { property: "og:title", content: product?.name ?? "Outfizio" },
        { property: "og:description", content: product?.description ?? "" },
        ...(product?.image ? [{ property: "og:image", content: product.image } as const] : []),
      ],
    };
  },
  loader: ({ params }) => {
    const product = PRODUCTS.find((p) => p.id === params.id);
    if (!product) throw notFound();
    return { product } as { product: (typeof PRODUCTS)[number] };
  },
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center p-6 text-sm">
      {error.message}
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-3xl font-extrabold tracking-tighter">Product not found</h1>
      <Link to="/" className="text-xs uppercase tracking-widest underline">
        Back to storefront
      </Link>
    </div>
  ),
  component: ProductPage,
});

type Review = {
  id: string;
  product_id: string;
  rating: number;
  body: string;
  display_name: string;
  verified_purchase: boolean;
  created_at: string;
};

function ProductPage() {
  const { product } = Route.useLoaderData() as { product: (typeof PRODUCTS)[number] };
  const navigate = useNavigate();
  const { cart, wishlist } = useCartStore();

  const [activeImage, setActiveImage] = useState(0);
  const [size, setSize] = useState<string>(product.sizes[2] ?? product.sizes[0]);
  const [qty, setQty] = useState(1);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);

  // Reset state when navigating between products
  useEffect(() => {
    setActiveImage(0);
    setQty(1);
    setSize(product.sizes[2] ?? product.sizes[0]);
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [product.id]);

  useEffect(() => {
    supabase
      .from("reviews")
      .select("*")
      .eq("product_id", product.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setReviews((data as Review[]) ?? []));
  }, [product.id]);

  const inWishlist = wishlist.includes(product.id);
  const inCartQty = cart[product.id] ?? 0;

  const avg = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 5;
  const ratingCount = reviews.length;

  const related = useMemo(
    () => PRODUCTS.filter((p) => p.id !== product.id),
    [product.id],
  );

  const handleAddToCart = () => {
    cartStore.addToCart(product.id, qty);
  };

  const handleBuyNow = () => {
    cartStore.addToCart(product.id, qty);
    navigate({ to: "/checkout" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <nav className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:text-accent transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Outfizio</span>
          </Link>
          <Link
            to="/checkout"
            className="relative inline-flex items-center gap-2 px-3 py-1.5 bg-foreground text-background text-xs font-bold uppercase tracking-widest hover:bg-accent transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            Cart ({Object.values(cart).reduce((a, b) => a + b, 0)})
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-10 pb-28 md:pb-10">
        {/* Breadcrumb */}
        <nav className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14">
          {/* Gallery */}
          <section>
            <div className="relative aspect-[3/4] bg-neutral-100 overflow-hidden mb-3">
              <img
                src={product.images[activeImage] ?? product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => cartStore.toggleWishlist(product.id)}
                aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
                className="absolute top-4 right-4 w-11 h-11 rounded-full bg-background/90 backdrop-blur flex items-center justify-center shadow-md hover:scale-105 transition-transform"
              >
                <Heart
                  className={`w-5 h-5 ${
                    inWishlist ? "fill-accent text-accent" : "text-foreground"
                  }`}
                />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`aspect-square overflow-hidden border-2 transition-colors ${
                    i === activeImage ? "border-foreground" : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                  aria-label={`View image ${i + 1}`}
                >
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </section>

          {/* Info */}
          <section className="flex flex-col">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tighter">
              {product.name}
            </h1>
            <p className="font-mono text-xs text-muted-foreground mt-1">
              Product ID: {product.sku}
            </p>
            <div className="mt-3 inline-block bg-white border border-border rounded-sm px-3 py-2">
              <Barcode value={product.sku} height={36} fontSize={10} />
            </div>

            <div className="mt-4 text-3xl font-mono font-bold">{fmt(product.price)}</div>

            <div className="flex items-center gap-2 mt-3">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i <= Math.round(avg)
                        ? "fill-accent text-accent"
                        : "text-muted-foreground/40"
                    }`}
                  />
                ))}
              </div>
              <a
                href="#reviews"
                className="text-xs font-mono text-muted-foreground hover:text-foreground underline underline-offset-2"
              >
                {avg.toFixed(1)} · {ratingCount} review{ratingCount === 1 ? "" : "s"}
              </a>
            </div>

            {/* Color / fabric */}
            <div className="mt-5 flex items-center gap-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-foreground" />
              <span className="font-medium">{product.color}</span>
              <span className="text-muted-foreground">·</span>
              <span className="font-mono text-muted-foreground">{product.fabric}</span>
            </div>

            {/* Size */}
            <div className="mt-7">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-widest">
                  Select Size
                </span>
                <button
                  onClick={() => setShowSizeGuide((s) => !s)}
                  className="text-[11px] font-bold uppercase tracking-widest inline-flex items-center gap-1.5 underline underline-offset-4 hover:text-accent"
                >
                  <Ruler className="w-3.5 h-3.5" /> Size Guide
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {product.sizes.map((s) => {
                  const active = s === size;
                  return (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      className={`py-3 text-sm font-bold border transition-colors ${
                        active
                          ? "bg-foreground text-background border-foreground"
                          : "border-border hover:border-foreground"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
              {showSizeGuide && (
                <div className="mt-3 border border-border bg-muted/40 p-4 text-xs font-mono space-y-1">
                  <div className="flex justify-between"><span>S</span><span>Chest 36–38" · Waist 30"</span></div>
                  <div className="flex justify-between"><span>M</span><span>Chest 38–40" · Waist 32"</span></div>
                  <div className="flex justify-between"><span>L</span><span>Chest 40–42" · Waist 34"</span></div>
                  <div className="flex justify-between"><span>XL</span><span>Chest 42–44" · Waist 36"</span></div>
                </div>
              )}
            </div>

            {/* Quantity */}
            <div className="mt-6">
              <span className="text-[11px] font-bold uppercase tracking-widest block mb-3">
                Quantity
              </span>
              <div className="inline-flex items-center border border-border">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="px-4 py-3 hover:bg-muted transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-6 text-sm font-mono tabular-nums w-12 text-center">
                  {qty}
                </span>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="px-4 py-3 hover:bg-muted transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {inCartQty > 0 && (
                <p className="text-[10px] font-mono text-muted-foreground mt-2 uppercase tracking-widest">
                  {inCartQty} already in cart
                </p>
              )}
            </div>

            {/* CTAs */}
            <div className="mt-7 flex flex-col gap-3">
              <button
                onClick={handleAddToCart}
                className="w-full bg-foreground text-background py-4 text-xs font-bold uppercase tracking-widest hover:bg-accent transition-colors inline-flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" /> Add to Cart
              </button>
              <button
                onClick={handleBuyNow}
                className="w-full border-2 border-foreground py-4 text-xs font-bold uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors"
              >
                Buy Now
              </button>
              <button
                onClick={() => cartStore.toggleWishlist(product.id)}
                className={`w-full py-3 text-[11px] font-bold uppercase tracking-widest inline-flex items-center justify-center gap-2 transition-colors ${
                  inWishlist ? "text-accent" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Heart className={`w-4 h-4 ${inWishlist ? "fill-accent" : ""}`} />
                {inWishlist ? "Saved to Wishlist" : "Add to Wishlist"}
              </button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3 mt-8 pt-6 border-t border-border text-center">
              <div className="flex flex-col items-center gap-1">
                <Truck className="w-5 h-5" />
                <span className="text-[9px] font-bold uppercase tracking-widest">Free Shipping</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <RotateCcw className="w-5 h-5" />
                <span className="text-[9px] font-bold uppercase tracking-widest">7-Day Returns</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <ShieldCheck className="w-5 h-5" />
                <span className="text-[9px] font-bold uppercase tracking-widest">Authentic</span>
              </div>
            </div>
          </section>
        </div>

        {/* Description */}
        <section className="mt-16 border-t border-border pt-10">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
            Description
          </h2>
          <p className="max-w-3xl text-base leading-relaxed text-foreground/90">
            {product.description}
          </p>
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 text-sm">
            <div>
              <dt className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Fabric</dt>
              <dd className="mt-1 font-medium">{product.fabric}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Color</dt>
              <dd className="mt-1 font-medium">{product.color}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">SKU</dt>
              <dd className="mt-1 font-mono">{product.sku}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Care</dt>
              <dd className="mt-1 font-medium">Dry clean recommended</dd>
            </div>
          </dl>
        </section>

        {/* Reviews */}
        <section id="reviews" className="mt-16 border-t border-border pt-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-8">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
                — Customer Reviews
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tighter mt-2">
                {avg.toFixed(1)} out of 5
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i <= Math.round(avg)
                        ? "fill-accent text-accent"
                        : "text-muted-foreground/40"
                    }`}
                  />
                ))}
              </div>
              <span className="font-mono text-sm text-muted-foreground">
                {ratingCount} review{ratingCount === 1 ? "" : "s"}
              </span>
            </div>
          </div>

          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground font-mono">
              No reviews yet for this product. Be the first verified buyer to share your thoughts.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {reviews.slice(0, 6).map((r) => (
                <article key={r.id} className="bg-card border border-border p-6 flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i <= r.rating
                              ? "fill-accent text-accent"
                              : "text-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                      {r.created_at.slice(0, 10)}
                    </span>
                  </div>
                  {r.verified_purchase && (
                    <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Verified Purchase
                    </div>
                  )}
                  <p className="text-sm leading-relaxed text-foreground/90">"{r.body}"</p>
                  <div className="text-xs font-bold uppercase tracking-widest mt-auto pt-2">
                    — {r.display_name}
                  </div>
                </article>
              ))}
            </div>
          )}

          <p className="mt-6 text-xs text-muted-foreground">
            Only customers with a completed order for this product can post a review.{" "}
            <Link to="/" className="underline underline-offset-2 hover:text-foreground">
              Browse the storefront
            </Link>{" "}
            or sign in from the home page to share yours.
          </p>
        </section>

        {/* Related */}
        <section className="mt-16 border-t border-border pt-10">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tighter mb-6">
            You may also like
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {related.map((p) => (
              <Link
                key={p.id}
                to="/product/$id"
                params={{ id: p.id }}
                className="group block"
              >
                <div className="aspect-[3/4] overflow-hidden bg-neutral-100 mb-3">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <h3 className="text-xs md:text-sm font-bold uppercase tracking-tight group-hover:text-accent transition-colors">
                  {p.name}
                </h3>
                <p className="text-xs font-mono mt-1">{fmt(p.price)}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>

      {/* Sticky mobile CTA bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur-md px-3 py-2.5 flex gap-2 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
        <button
          onClick={handleAddToCart}
          className="flex-1 bg-foreground text-background py-3 text-[11px] font-bold uppercase tracking-widest inline-flex items-center justify-center gap-2"
        >
          <ShoppingBag className="w-4 h-4" /> Add to Cart
        </button>
        <button
          onClick={handleBuyNow}
          className="flex-1 border-2 border-foreground py-3 text-[11px] font-bold uppercase tracking-widest"
        >
          Buy Now
        </button>
      </div>
    </div>
  );
}
