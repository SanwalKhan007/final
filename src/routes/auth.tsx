import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign In — Outfizio" },
      { name: "description", content: "Sign in to your Outfizio account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: typeof window !== "undefined" ? window.location.origin : "",
            data: { full_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        setInfo("Account created! Check your email to confirm, then sign in.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/" });
      }
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full bg-transparent border border-border px-4 py-3 text-sm font-mono focus:outline-none focus:border-accent transition-colors";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <nav className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <Link to="/" className="text-xl sm:text-2xl font-extrabold tracking-tighter uppercase">
            Outfizio
          </Link>
          <Link to="/" className="text-[11px] font-bold uppercase tracking-widest hover:text-accent transition-colors">
            ← Back
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10 sm:py-16">
        <div className="w-full max-w-md">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3">
            {mode === "signin" ? "Welcome back" : "Create account"}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tighter mb-2">
            {mode === "signin" ? "Sign In" : "Sign Up"}
          </h1>
          <p className="text-muted-foreground text-sm mb-8">
            {mode === "signin"
              ? "Sign in to purchase and leave verified product reviews."
              : "Create an account to track orders and review products."}
          </p>

          {info && (
            <div className="mb-4 text-[11px] font-mono text-green-700 border border-green-300 bg-green-50 px-3 py-2">
              {info}
            </div>
          )}

          <form onSubmit={submit} className="space-y-3">
            {mode === "signup" && (
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Full Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className={inputCls}
                />
              </div>
            )}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@email.com"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className={inputCls}
              />
            </div>
            {error && (
              <div className="text-[11px] font-mono text-destructive border border-destructive/30 bg-destructive/5 px-3 py-2">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-foreground text-background py-3 sm:py-4 text-[11px] font-bold uppercase tracking-widest hover:bg-accent transition-colors disabled:opacity-60 mt-2"
            >
              {loading ? "Please wait…" : mode === "signin" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); setInfo(null); }}
            className="mt-5 text-xs text-muted-foreground hover:text-accent transition-colors w-full text-center"
          >
            {mode === "signin"
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </main>
    </div>
  );
}
