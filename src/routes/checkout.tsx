import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PRODUCTS, fmt } from "@/lib/products";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import Barcode from "@/components/Barcode";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Outfizio" },
      { name: "description", content: "Review your order and generate your official Outfizio receipt." },
    ],
  }),
  component: CheckoutPage,
});

type Payment = "cod" | "jazzcash" | "easypaisa";

type Customer = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  payment: Payment;
  paymentScreenshot?: string; // base64
};

function CheckoutPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [cartMap, setCartMap] = useState<Record<string, number>>({});
  const [customer, setCustomer] = useState<Customer>({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    payment: "cod",
  });
  const [submitting, setSubmitting] = useState(false);
  const [bill, setBill] = useState<null | {
    id: string;
    date: string;
    time: string;
    customer: Customer;
    items: { product: (typeof PRODUCTS)[number]; qty: number }[];
    subtotal: number;
    tax: number;
    total: number;
  }>(null);

  useEffect(() => {
    setMounted(true);
    const raw = sessionStorage.getItem("outfizio_cart");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const map: Record<string, number> = {};
          parsed.forEach((id: string) => { map[id] = (map[id] || 0) + 1; });
          setCartMap(map);
        } else {
          setCartMap(parsed);
        }
      } catch { setCartMap({}); }
    }
  }, []);

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/auth" });
    }
  }, [user, authLoading, navigate]);

  // Pre-fill email from logged-in user
  useEffect(() => {
    if (user?.email) {
      setCustomer((c) => ({ ...c, email: user.email ?? "" }));
    }
  }, [user]);

  const entries = useMemo(
    () =>
      Object.entries(cartMap)
        .map(([id, qty]) => ({ product: PRODUCTS.find((p) => p.id === id)!, qty }))
        .filter((e) => e.product),
    [cartMap],
  );
  const subtotal = entries.reduce((s, e) => s + e.product.price * e.qty, 0);
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + tax;

  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^\d\s+\-()]/g, "");
    setCustomer({ ...customer, phone: val });
  };

  const handleScreenshot = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const ext = file.name.split(".").pop();
    const path = `payment-screenshots/${user.id}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("payments").upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from("payments").getPublicUrl(path);
      setCustomer((c) => ({ ...c, paymentScreenshot: data.publicUrl }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (entries.length === 0 || !user) return;
    setSubmitting(true);
    const now = new Date();

    try {
      await supabase.from("orders").insert(
        entries.map((entry) => ({
          user_id: user.id,
          product_id: entry.product.id,
          quantity: entry.qty,
          status: "completed",
          customer_name: customer.name,
          customer_email: customer.email,
          customer_phone: customer.phone,
          customer_address: customer.address,
          customer_city: customer.city,
          payment_method: customer.payment,
          total_amount: total,
          payment_screenshot: customer.paymentScreenshot ?? null,
        })),
      );
    } catch (err) {
      console.error("Failed to record order", err);
    }

    sessionStorage.removeItem("outfizio_cart");

    setBill({
      id: `OUT-${Math.floor(1000 + Math.random() * 9000)}`,
      date: now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
        .replace(/ /g, ".").toUpperCase(),
      time: now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      customer,
      items: entries,
      subtotal,
      tax,
      total,
    });
    setSubmitting(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const newOrder = () => navigate({ to: "/" });

  const labelCls = "block text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2";
  const inputCls = "w-full bg-transparent border border-border px-4 py-3 text-sm font-mono focus:outline-none focus:border-accent transition-colors";

  if (authLoading || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-mono text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!user) return null;

  const paymentMethods: { v: Payment; l: string; sub: string }[] = [
    { v: "cod", l: "Cash on Delivery", sub: "Pay when you receive" },
    { v: "jazzcash", l: "JazzCash", sub: "0300-0000000" },
    { v: "easypaisa", l: "EasyPaisa", sub: "0345-0000000" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <Link to="/" className="text-xl sm:text-2xl font-extrabold tracking-tighter uppercase">Outfizio</Link>
          <Link to="/" className="text-[11px] font-bold uppercase tracking-widest hover:text-accent transition-colors">
            ← Back to Storefront
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <header className="mb-8 sm:mb-12">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3">
            Step 02 / Checkout
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tighter">
            {bill ? "Order Confirmed" : "Customer Details"}
          </h1>
          <p className="text-muted-foreground mt-3 max-w-[55ch] text-sm">
            {bill
              ? "Your official Outfizio receipt is below. Keep it for your records."
              : "Provide your shipping and contact details to generate your official bill."}
          </p>
        </header>

        {entries.length === 0 && !bill ? (
          <div className="border border-dashed border-border p-12 text-center">
            <p className="font-mono text-sm text-muted-foreground mb-6">Your cart is empty.</p>
            <Link to="/" className="inline-block bg-foreground text-background px-6 py-3 text-[11px] font-bold uppercase tracking-widest hover:bg-accent transition-colors">
              Return to Storefront
            </Link>
          </div>
        ) : bill ? (
          /* ── RECEIPT ── */
          <div className="grid lg:grid-cols-[1fr_280px] gap-8 sm:gap-10 items-start">
            <div className="receipt-stage">
              <div className="receipt-slot" aria-hidden />
              <div className="receipt-paper">
                <h2 className="text-center text-3xl font-black tracking-tight text-black mb-1">OUTFIZIO</h2>
                <p className="text-center text-[10px] tracking-[0.2em] text-neutral-500 mb-1">Official Receipt</p>
                <div className="text-center text-[10px] tracking-[0.2em] text-neutral-600">
                  {bill.id} · {bill.date} · {bill.time}
                </div>

                <hr className="receipt-divider" />

                <div className="text-[11px] space-y-1 text-neutral-800">
                  <div className="flex justify-between"><span className="text-neutral-500">Customer</span><span className="font-semibold">{bill.customer.name}</span></div>
                  <div className="flex justify-between"><span className="text-neutral-500">Phone</span><span>{bill.customer.phone}</span></div>
                  <div className="flex justify-between"><span className="text-neutral-500">City</span><span>{bill.customer.city}</span></div>
                </div>

                <hr className="receipt-divider" />

                <div className="text-[11px] leading-relaxed space-y-2">
                  {bill.items.map((e, i) => (
                    <div key={i} className="flex justify-between py-[3px]">
                      <span className="truncate pr-2">{e.qty}x {e.product.name}</span>
                      <span className="tabular-nums whitespace-nowrap">Rs. {(e.product.price * e.qty).toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                </div>

                <hr className="receipt-divider" />

                <div className="flex justify-between text-[11px]">
                  <span>SUBTOTAL</span>
                  <span className="tabular-nums">Rs. {bill.subtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-[11px] text-neutral-600">
                  <span>VAT (5%)</span>
                  <span className="tabular-nums">Rs. {bill.tax.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between mt-3 pt-2 border-t border-black/30">
                  <span className="text-sm font-black tracking-tight">TOTAL AMOUNT</span>
                  <span className="text-sm font-black tabular-nums">Rs.{bill.total.toLocaleString("en-IN")}</span>
                </div>

                <div className="flex justify-between text-[11px] mt-3 text-neutral-700">
                  <span>PAYMENT</span>
                  <span className="uppercase">
                    {bill.customer.payment === "cod" ? "Cash on Delivery"
                      : bill.customer.payment === "jazzcash" ? "JazzCash"
                      : "EasyPaisa"}
                  </span>
                </div>

                <h3 className="text-center text-2xl font-black tracking-tight mt-8 mb-4">THANK YOU</h3>

                {/* QR only on receipt */}
                <div className="flex justify-center bg-white py-2">
                  <Barcode value={bill.id.replace(/\W/g, "")} height={50} width={1.6} fontSize={11} />
                </div>

                <p className="text-center text-[9px] text-neutral-400 mt-3">outfizio.official@gmail.com</p>
              </div>
            </div>

            <aside className="border border-border bg-card p-5 lg:sticky lg:top-28">
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1">Order</div>
              <div className="text-xl font-extrabold tracking-tight mb-4">{bill.id}</div>
              <div className="space-y-1 text-[11px] font-mono mb-4">
                <div className="flex justify-between"><span className="text-muted-foreground">Items</span><span>{bill.items.reduce((a, e) => a + e.qty, 0)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Customer</span><span className="truncate max-w-[140px]">{bill.customer.name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">City</span><span>{bill.customer.city}</span></div>
                <div className="flex justify-between pt-2 mt-2 border-t border-border">
                  <span className="font-bold uppercase tracking-wider">Total</span>
                  <span className="font-bold">{fmt(bill.total)}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={() => window.print()} className="bg-foreground text-background py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-accent transition-colors">
                  Print Receipt
                </button>
                <button onClick={newOrder} className="border border-border py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors">
                  New Order
                </button>
              </div>
            </aside>
          </div>
        ) : (
          /* ── CHECKOUT FORM ── */
          <div className="grid lg:grid-cols-[1fr_360px] gap-8 sm:gap-12">
            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className={labelCls}>Full Name</label>
                  <input
                    required
                    value={customer.name}
                    onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                    className={inputCls}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className={labelCls}>Phone Number</label>
                  <input
                    required
                    type="tel"
                    inputMode="numeric"
                    pattern="[\d\s\+\-\(\)]{7,15}"
                    value={customer.phone}
                    onChange={handlePhoneInput}
                    className={inputCls}
                    placeholder="+92 300 0000000"
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Email</label>
                <input
                  required
                  type="email"
                  value={customer.email}
                  onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                  className={inputCls}
                  placeholder="john@email.com"
                />
              </div>

              <div>
                <label className={labelCls}>Shipping Address</label>
                <textarea
                  required
                  rows={3}
                  value={customer.address}
                  onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                  className={inputCls}
                  placeholder="House #, Street, Area"
                />
              </div>

              <div>
                <label className={labelCls}>City</label>
                <input
                  required
                  value={customer.city}
                  onChange={(e) => setCustomer({ ...customer, city: e.target.value })}
                  className={inputCls}
                  placeholder="Karachi"
                />
              </div>

              <div>
                <label className={labelCls}>Payment Method</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {paymentMethods.map((opt) => (
                    <button
                      type="button"
                      key={opt.v}
                      onClick={() => setCustomer({ ...customer, payment: opt.v })}
                      className={`border py-3 px-3 text-left transition-colors ${
                        customer.payment === opt.v
                          ? "bg-foreground text-background border-foreground"
                          : "border-border hover:border-foreground"
                      }`}
                    >
                      <div className="text-[11px] font-bold uppercase tracking-widest">{opt.l}</div>
                      <div className={`text-[10px] mt-0.5 ${customer.payment === opt.v ? "text-background/70" : "text-muted-foreground"}`}>{opt.sub}</div>
                    </button>
                  ))}
                </div>
                {customer.payment === "jazzcash" && (
                  <div className="mt-3 space-y-3">
                    <p className="text-[11px] font-mono text-muted-foreground border-l-2 border-accent pl-3">
                      Send payment to JazzCash: <strong>0300-0000000</strong> (Outfizio) and mention your order ID in the description.
                    </p>
                    <div className="border border-dashed border-border p-4">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                        Upload Payment Screenshot
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleScreenshot}
                        className="text-xs font-mono text-muted-foreground file:mr-3 file:py-2 file:px-3 file:border file:border-border file:text-[10px] file:font-bold file:uppercase file:tracking-widest file:bg-foreground file:text-background hover:file:bg-accent file:transition-colors cursor-pointer"
                      />
                      {customer.paymentScreenshot && (
                        <div className="mt-3 flex items-center gap-2 text-[11px] font-mono text-emerald-700">
                          ✓ Screenshot uploaded successfully
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {customer.payment === "easypaisa" && (
                  <div className="mt-3 space-y-3">
                    <p className="text-[11px] font-mono text-muted-foreground border-l-2 border-accent pl-3">
                      Send payment to EasyPaisa: <strong>0345-0000000</strong> (Outfizio) and mention your order ID in the description.
                    </p>
                    <div className="border border-dashed border-border p-4">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                        Upload Payment Screenshot
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleScreenshot}
                        className="text-xs font-mono text-muted-foreground file:mr-3 file:py-2 file:px-3 file:border file:border-border file:text-[10px] file:font-bold file:uppercase file:tracking-widest file:bg-foreground file:text-background hover:file:bg-accent file:transition-colors cursor-pointer"
                      />
                      {customer.paymentScreenshot && (
                        <div className="mt-3 flex items-center gap-2 text-[11px] font-mono text-emerald-700">
                          ✓ Screenshot uploaded successfully
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-foreground text-background py-4 sm:py-5 text-[11px] font-bold uppercase tracking-widest hover:bg-accent transition-colors disabled:opacity-60 mt-2"
              >
                {submitting ? "Processing…" : "Confirm & Generate Bill"}
              </button>
            </form>

            <aside className="border border-border bg-card p-5 sm:p-6 h-fit">
              <h2 className="text-xs font-extrabold uppercase tracking-[0.2em] mb-6">Order Summary</h2>
              <ul className="space-y-4 mb-6">
                {entries.map((e) => (
                  <li key={e.product.id} className="flex gap-3">
                    <img src={e.product.image} alt={e.product.name} className="w-14 h-16 object-cover" />
                    <div className="flex-1">
                      <div className="text-[11px] font-bold uppercase">{e.product.name}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">{e.product.sku}</div>
                      <div className="text-[11px] font-mono mt-1">{fmt(e.product.price)} x {e.qty}</div>
                    </div>
                    <div className="text-[11px] font-mono self-center">{fmt(e.product.price * e.qty)}</div>
                  </li>
                ))}
              </ul>
              <div className="border-t border-dashed border-border pt-4 space-y-2 font-mono text-[11px] uppercase">
                <div className="flex justify-between"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>VAT (5%)</span><span>{fmt(tax)}</span></div>
                <div className="flex justify-between text-sm font-extrabold tracking-tight pt-3 mt-2 border-t border-border">
                  <span>Total</span><span>{fmt(total)}</span>
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
