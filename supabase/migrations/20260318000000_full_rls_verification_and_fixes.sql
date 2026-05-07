-- ============================================================================
-- FULL RLS VERIFICATION & SECURITY FIXES
-- Run this in Supabase Dashboard → SQL Editor to ensure all RLS policies
-- are properly applied and security gaps are closed.
--
-- This migration is IDEMPOTENT — safe to run multiple times.
-- ============================================================================

-- ============================================================================
-- 1. ENSURE RLS IS ENABLED ON ALL TABLES
-- ============================================================================
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.review_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.return_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cms_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.navigation_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.navigation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.store_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. ENSURE is_admin_or_staff() HELPER EXISTS
-- ============================================================================
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

-- ============================================================================
-- 3. FIX SECURITY GAP: store_modules update policy was too permissive
--    (allowed anon to update — should be admin/staff only)
-- ============================================================================
DROP POLICY IF EXISTS "Allow authenticated update" ON public.store_modules;
DROP POLICY IF EXISTS "Allow admin staff to update store_modules" ON public.store_modules;

CREATE POLICY "Allow admin staff to update store_modules"
ON public.store_modules FOR UPDATE
USING (public.is_admin_or_staff())
WITH CHECK (public.is_admin_or_staff());

-- Also tighten INSERT on store_modules
DROP POLICY IF EXISTS "Allow admin insert on store_modules" ON public.store_modules;
CREATE POLICY "Allow admin insert on store_modules"
ON public.store_modules FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_or_staff());

-- Also add DELETE policy for store_modules
DROP POLICY IF EXISTS "Allow admin delete on store_modules" ON public.store_modules;
CREATE POLICY "Allow admin delete on store_modules"
ON public.store_modules FOR DELETE
USING (public.is_admin_or_staff());

-- ============================================================================
-- 4. ENSURE ADMIN MANAGEMENT POLICIES FOR PRODUCTS, IMAGES, VARIANTS, CATEGORIES
--    (from 20260315000000_admin_rls_products_categories.sql)
-- ============================================================================
DROP POLICY IF EXISTS "Allow admin staff to manage products" ON public.products;
CREATE POLICY "Allow admin staff to manage products"
ON public.products FOR ALL
USING (public.is_admin_or_staff())
WITH CHECK (public.is_admin_or_staff());

DROP POLICY IF EXISTS "Allow admin staff to manage product images" ON public.product_images;
CREATE POLICY "Allow admin staff to manage product images"
ON public.product_images FOR ALL
USING (public.is_admin_or_staff())
WITH CHECK (public.is_admin_or_staff());

DROP POLICY IF EXISTS "Allow admin staff to manage product variants" ON public.product_variants;
CREATE POLICY "Allow admin staff to manage product variants"
ON public.product_variants FOR ALL
USING (public.is_admin_or_staff())
WITH CHECK (public.is_admin_or_staff());

DROP POLICY IF EXISTS "Allow admin staff to manage categories" ON public.categories;
CREATE POLICY "Allow admin staff to manage categories"
ON public.categories FOR ALL
USING (public.is_admin_or_staff())
WITH CHECK (public.is_admin_or_staff());

-- ============================================================================
-- 5. ENSURE CONTACT SUBMISSIONS POLICIES EXIST
--    (from 20260227000000_contact_submissions.sql)
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'contact_submissions') THEN
    -- Drop and recreate to ensure correct
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can submit contact form" ON public.contact_submissions';
    EXECUTE 'DROP POLICY IF EXISTS "Staff can view contact submissions" ON public.contact_submissions';

    EXECUTE 'CREATE POLICY "Anyone can submit contact form"
      ON public.contact_submissions FOR INSERT
      TO anon, authenticated
      WITH CHECK (true)';

    EXECUTE 'CREATE POLICY "Staff can view contact submissions"
      ON public.contact_submissions FOR SELECT
      USING (public.is_admin_or_staff())';
  END IF;
END
$$;

-- ============================================================================
-- 6. ENSURE NOTIFICATIONS HAVE INSERT POLICY FOR SYSTEM/SERVICE ROLE
--    (allows the system to create notifications for users)
-- ============================================================================
DROP POLICY IF EXISTS "Service can insert notifications" ON public.notifications;
CREATE POLICY "Service can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (
  public.is_admin_or_staff()
  OR auth.uid() = user_id
);

-- ============================================================================
-- 7. ENSURE ORDERS ALLOW UPDATE BY STAFF (for status changes)
-- ============================================================================
DROP POLICY IF EXISTS "Staff manage all orders" ON public.orders;
CREATE POLICY "Staff manage all orders"
ON public.orders FOR ALL
USING (public.is_admin_or_staff())
WITH CHECK (public.is_admin_or_staff());

-- ============================================================================
-- 8. ENSURE REVIEWS ADMIN MANAGEMENT
-- ============================================================================
DROP POLICY IF EXISTS "Staff manage reviews" ON public.reviews;
CREATE POLICY "Staff manage reviews"
ON public.reviews FOR ALL
USING (public.is_admin_or_staff())
WITH CHECK (public.is_admin_or_staff());

-- ============================================================================
-- 9. ENSURE BLOG POSTS ADMIN MANAGEMENT
-- ============================================================================
DROP POLICY IF EXISTS "Staff manage blog" ON public.blog_posts;
CREATE POLICY "Staff manage blog"
ON public.blog_posts FOR ALL
USING (public.is_admin_or_staff())
WITH CHECK (public.is_admin_or_staff());

-- ============================================================================
-- 10. ENSURE COUPONS DELETE POLICY EXISTS
-- ============================================================================
DROP POLICY IF EXISTS "Allow admin delete on coupons" ON public.coupons;
CREATE POLICY "Allow admin delete on coupons"
ON public.coupons FOR DELETE
TO authenticated
USING (public.is_admin_or_staff());

-- ============================================================================
-- 11. ENSURE BANNERS ADMIN MANAGEMENT
-- ============================================================================
DROP POLICY IF EXISTS "Allow admin all on banners" ON public.banners;
CREATE POLICY "Allow admin all on banners"
ON public.banners FOR ALL
USING (public.is_admin_or_staff())
WITH CHECK (public.is_admin_or_staff());

-- ============================================================================
-- 12. ENSURE CMS CONTENT ADMIN MANAGEMENT
-- ============================================================================
DROP POLICY IF EXISTS "Allow admin all on cms_content" ON public.cms_content;
CREATE POLICY "Allow admin all on cms_content"
ON public.cms_content FOR ALL
USING (public.is_admin_or_staff())
WITH CHECK (public.is_admin_or_staff());

-- ============================================================================
-- 13. ENSURE CUSTOMERS TABLE IS LOCKED DOWN
-- ============================================================================
DROP POLICY IF EXISTS "Staff can view all customers" ON public.customers;
CREATE POLICY "Staff can view all customers"
ON public.customers FOR SELECT
USING (public.is_admin_or_staff());

DROP POLICY IF EXISTS "Staff can manage customers" ON public.customers;
CREATE POLICY "Staff can manage customers"
ON public.customers FOR ALL
USING (public.is_admin_or_staff())
WITH CHECK (public.is_admin_or_staff());

DROP POLICY IF EXISTS "Service role full access to customers" ON public.customers;
CREATE POLICY "Service role full access to customers"
ON public.customers FOR ALL
USING (auth.role() = 'service_role');

-- ============================================================================
-- VERIFICATION QUERY — Run this after the migration to confirm RLS status.
-- Copy/paste into the SQL Editor after the main script completes.
-- ============================================================================
-- SELECT schemaname, tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY tablename;
--
-- Expected: ALL rows should show rowsecurity = true
-- ============================================================================
