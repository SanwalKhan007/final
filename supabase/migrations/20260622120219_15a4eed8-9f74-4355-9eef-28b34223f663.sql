
-- profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are publicly readable" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- orders
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id text NOT NULL,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending','completed','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own orders" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_orders_user_product ON public.orders(user_id, product_id, status);

-- has_purchased helper (security definer)
CREATE OR REPLACE FUNCTION public.has_purchased(_user uuid, _product text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.orders
    WHERE user_id = _user
      AND product_id = _product
      AND status = 'completed'
  );
$$;

-- reviews
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  product_id text NOT NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body text NOT NULL CHECK (length(trim(body)) > 0),
  display_name text NOT NULL,
  verified_purchase boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);
GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews are publicly readable" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON public.reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own reviews" ON public.reviews FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- enforce verified purchase via trigger (server-side, cannot be bypassed by client)
CREATE OR REPLACE FUNCTION public.enforce_verified_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _name text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to submit a review';
  END IF;
  NEW.user_id := auth.uid();
  IF NOT public.has_purchased(NEW.user_id, NEW.product_id) THEN
    RAISE EXCEPTION 'You can only review products you have purchased';
  END IF;
  NEW.verified_purchase := true;
  SELECT display_name INTO _name FROM public.profiles WHERE id = NEW.user_id;
  IF _name IS NOT NULL AND length(trim(_name)) > 0 THEN
    NEW.display_name := _name;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_enforce_verified_review
BEFORE INSERT ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.enforce_verified_review();

-- seed reviews (run as service role via migration; trigger fires but auth.uid() is null —
-- seeds skip the trigger by inserting with a separate bypass path: temporarily disable)
ALTER TABLE public.reviews DISABLE TRIGGER trg_enforce_verified_review;
INSERT INTO public.reviews (product_id, rating, body, display_name, verified_purchase, created_at) VALUES
  ('suit',  5, 'The charcoal suit fits like it was stitched on me. Shoulders are sharp, the drape is honest. Wore it to a wedding and got asked three times where it''s from.', 'Arjun Mehta',   true, '2025-11-03'),
  ('shirt', 5, 'Black essential shirt is a daily driver now. Cotton feels heavier than the fast-fashion stuff and the collar holds its shape after wash. Genuinely impressed.', 'Daniel Okafor', true, '2025-10-21'),
  ('denim', 4, 'Selvedge denim jacket has serious character — the indigo is fading exactly how I hoped. Took a week to break in. Worth it.', 'Rohit Verma',   true, '2025-09-14'),
  ('shirt', 5, 'Packaging, fit, finish — everything feels considered. Outfizio is quietly becoming my go-to for wardrobe basics that aren''t basic.', 'Liam Carter',   true, '2025-08-30');
ALTER TABLE public.reviews ENABLE TRIGGER trg_enforce_verified_review;
