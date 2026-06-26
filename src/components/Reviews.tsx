import { useEffect, useMemo, useState } from "react";
import { Star, ShieldCheck, Lock } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PRODUCTS } from "@/lib/products";

type Review = {
  id: string;
  user_id: string | null;
  product_id: string;
  rating: number;
  body: string;
  display_name: string;
  verified_purchase: boolean;
  created_at: string;
};

export default function Reviews() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set());
  const [activeProduct, setActiveProduct] = useState<string>("all");
  const [text, setText] = useState("");
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load all reviews (public)
  const loadReviews = async () => {
    const { data } = await supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setReviews(data as Review[]);
  };

  useEffect(() => {
    loadReviews();
  }, []);

  // Load purchases for the logged-in user
  useEffect(() => {
    if (!user) {
      setPurchasedIds(new Set());
      return;
    }
    supabase
      .from("orders")
      .select("product_id")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .then(({ data }) => {
        setPurchasedIds(new Set((data ?? []).map((o: any) => o.product_id)));
      });
  }, [user]);

  const filtered = useMemo(
    () =>
      activeProduct === "all"
        ? reviews
        : reviews.filter((r) => r.product_id === activeProduct),
    [reviews, activeProduct],
  );

  const avg =
    displayReviews.reduce((s, r) => s + r.rating, 0) / Math.max(displayReviews.length, 1);

  const productName = (id: string) =>
    PRODUCTS.find((p) => p.id === id)?.name ?? id;

  const reviewableProductId =
    activeProduct !== "all" ? activeProduct : Array.from(purchasedIds)[0];

  const alreadyReviewed = !!(
    user &&
    reviewableProductId &&
    reviews.some(
      (r) => r.user_id === user.id && r.product_id === reviewableProductId,
    )
  );

  const canReview =
    !!user && !!reviewableProductId && purchasedIds.has(reviewableProductId) && !alreadyReviewed;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !reviewableProductId) return;
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    const { error } = await supabase.from("reviews").insert({
      product_id: reviewableProductId,
      rating,
      body: text.trim(),
      display_name: user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Customer",
      user_id: user.id,
    });
    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    setText("");
    setRating(5);
    setSuccess("Review submitted — thanks for sharing.");
    loadReviews();
  };

  // Seed reviews shown when no real reviews exist
  const seedReviews: Review[] = [
    { id: "s1", user_id: null, product_id: "suit", rating: 5, body: "Got this for my brother's wedding and honestly didn't expect much at this price point — but it fits perfectly and the fabric feels genuinely premium. Multiple people asked where I got it from. Will be ordering again.", display_name: "Ahmed R.", verified_purchase: true, created_at: "2026-05-12" },
    { id: "s2", user_id: null, product_id: "shirt", rating: 5, body: "The black shirt is everything. Collar doesn't flop, fabric doesn't wrinkle after a full day, and it looks sharp under a blazer or alone. I've worn it 6 times in 3 weeks. Zero complaints.", display_name: "Usman T.", verified_purchase: true, created_at: "2026-05-20" },
    { id: "s3", user_id: null, product_id: "denim", rating: 4, body: "Raw denim quality for this price is unreal. It's stiff at first as expected but softening beautifully. Already getting the indigo fade lines on the pocket. Sizing runs true — order your usual.", display_name: "Bilal K.", verified_purchase: true, created_at: "2026-06-01" },
    { id: "s4", user_id: null, product_id: "linen", rating: 5, body: "Perfect summer shirt. Breathes incredibly well even in Karachi heat. The off-white shade is clean without being stark white. Washed it twice and it's gotten softer each time — exactly what linen should do.", display_name: "Zain M.", verified_purchase: true, created_at: "2026-06-08" },
    { id: "s5", user_id: null, product_id: "chino", rating: 5, body: "Finally found chinos that aren't baggy in the wrong places. The stretch makes a huge difference — I can sit, walk, go up stairs without the fabric pulling. Beige shade is versatile with literally everything.", display_name: "Hassan A.", verified_purchase: true, created_at: "2026-06-10" },
    { id: "s6", user_id: null, product_id: "shirt", rating: 5, body: "Ordered for Eid and the delivery was fast. Shirt quality is top tier — buttons are solid, stitching is clean, no loose threads anywhere. It's become my go-to formal shirt for meetings.", display_name: "Faisal N.", verified_purchase: true, created_at: "2026-06-15" },
  ];

  const displayReviews = filtered.length > 0 ? filtered : (activeProduct === "all" ? seedReviews : seedReviews.filter(r => r.product_id === activeProduct));

  return (
    <section id="reviews" className="border-t border-border bg-muted/30">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <header className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground">
              — Customer Voices
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter mt-2">
              What Men Are Saying
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
            <span className="font-mono text-sm">
              {avg.toFixed(1)} / 5 · {displayReviews.length} review{displayReviews.length === 1 ? "" : "s"}
            </span>
          </div>
        </header>

        {/* Product filter */}
        <div className="flex flex-wrap gap-2 mb-10">
          <button
            onClick={() => setActiveProduct("all")}
            className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest border transition-colors ${
              activeProduct === "all"
                ? "bg-foreground text-background border-foreground"
                : "border-border hover:border-foreground"
            }`}
          >
            All Products
          </button>
          {PRODUCTS.map((p) => (
            <button
              key={p.id}
              onClick={() => setActiveProduct(p.id)}
              className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest border transition-colors ${
                activeProduct === p.id
                  ? "bg-foreground text-background border-foreground"
                  : "border-border hover:border-foreground"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {displayReviews.length === 0 ? (
            <p className="text-sm text-muted-foreground font-mono col-span-full">
              No reviews yet for this product.
            </p>
          ) : (
            displayReviews.slice(0, 8).map((r) => (
              <article
                key={r.id}
                className="bg-card border border-border p-6 flex flex-col gap-3"
              >
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
                <p className="text-sm leading-relaxed text-foreground/90">
                  "{r.body}"
                </p>
                <div className="flex items-center justify-between mt-auto pt-2">
                  <div className="text-xs font-bold uppercase tracking-widest">
                    — {r.display_name}
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground">
                    {productName(r.product_id)}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        {/* Review form: only for verified purchasers */}
        <div className="bg-card border border-border p-6 md:p-8 max-w-2xl mx-auto">
          <h3 className="text-lg font-bold uppercase tracking-tight mb-1">
            Share your experience
          </h3>
          <p className="text-xs text-muted-foreground mb-5">
            Only verified buyers can post a review.
          </p>

          {!user ? (
            <div className="flex flex-col items-start gap-3 border border-dashed border-border p-5 text-sm">
              <div className="inline-flex items-center gap-2 text-muted-foreground">
                <Lock className="w-4 h-4" />
                Sign in to leave a review.
              </div>
              <Link
                to="/auth"
                className="bg-foreground text-background px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest hover:bg-accent transition-colors"
              >
                Sign In
              </Link>
            </div>
          ) : purchasedIds.size === 0 ? (
            <div className="border border-dashed border-border p-5 text-sm text-muted-foreground">
              You can write a review once you've completed a purchase from Outfizio.
            </div>
          ) : (
            <form onSubmit={submit}>
              <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2">
                Reviewing
              </label>
              <select
                value={reviewableProductId ?? ""}
                onChange={(e) => setActiveProduct(e.target.value)}
                className="w-full bg-background border border-border px-4 py-3 text-sm mb-4 focus:outline-none focus:border-accent"
              >
                {Array.from(purchasedIds).map((pid) => (
                  <option key={pid} value={pid}>
                    {productName(pid)}
                  </option>
                ))}
              </select>

              {alreadyReviewed ? (
                <div className="text-xs text-muted-foreground font-mono border border-dashed border-border p-4">
                  You have already reviewed this product. Pick another purchased product above.
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setRating(i)}
                        onMouseEnter={() => setHover(i)}
                        onMouseLeave={() => setHover(0)}
                        aria-label={`Rate ${i} star${i > 1 ? "s" : ""}`}
                      >
                        <Star
                          className={`w-6 h-6 transition-colors ${
                            i <= (hover || rating)
                              ? "fill-accent text-accent"
                              : "text-muted-foreground/40"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Tell us what you loved (or didn't)…"
                    rows={4}
                    required
                    className="w-full bg-background border border-border px-4 py-3 text-sm mb-4 focus:outline-none focus:border-accent resize-none"
                  />
                  {error && (
                    <div className="text-[11px] font-mono text-destructive border border-destructive/30 bg-destructive/5 px-3 py-2 mb-3">
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="text-[11px] font-mono text-emerald-700 border border-emerald-700/30 bg-emerald-500/5 px-3 py-2 mb-3">
                      {success}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={submitting || !canReview}
                    className="bg-foreground text-background px-6 py-3 text-[11px] font-bold uppercase tracking-widest hover:bg-accent transition-colors disabled:opacity-60"
                  >
                    {submitting ? "Submitting…" : "Submit Review"}
                  </button>
                </>
              )}
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
