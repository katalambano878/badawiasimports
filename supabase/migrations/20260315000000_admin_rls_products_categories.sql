-- Allow admin/staff to manage products, product_images, product_variants, and categories.
-- Use this if you applied only the minimal RLS policies from SECURITY_RLS_SETUP.md
-- and need the admin dashboard to create/update/delete products and categories.

-- Helper: admin/staff check (idempotent — safe if already exists)
CREATE OR REPLACE FUNCTION public.is_admin_or_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND role IN ('admin', 'staff')
  );
$$;

-- Products: allow admin/staff full access (INSERT, UPDATE, DELETE)
DROP POLICY IF EXISTS "Allow admin staff to manage products" ON public.products;
CREATE POLICY "Allow admin staff to manage products"
ON public.products FOR ALL
USING (public.is_admin_or_staff())
WITH CHECK (public.is_admin_or_staff());

-- Product images: allow admin/staff full access
DROP POLICY IF EXISTS "Allow admin staff to manage product images" ON public.product_images;
CREATE POLICY "Allow admin staff to manage product images"
ON public.product_images FOR ALL
USING (public.is_admin_or_staff())
WITH CHECK (public.is_admin_or_staff());

-- Product variants: allow admin/staff full access (required when deleting products)
DROP POLICY IF EXISTS "Allow admin staff to manage product variants" ON public.product_variants;
CREATE POLICY "Allow admin staff to manage product variants"
ON public.product_variants FOR ALL
USING (public.is_admin_or_staff())
WITH CHECK (public.is_admin_or_staff());

-- Categories: allow admin/staff full access
DROP POLICY IF EXISTS "Allow admin staff to manage categories" ON public.categories;
CREATE POLICY "Allow admin staff to manage categories"
ON public.categories FOR ALL
USING (public.is_admin_or_staff())
WITH CHECK (public.is_admin_or_staff());
