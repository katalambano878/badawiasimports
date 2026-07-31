-- Allow deleting catalog products without destroying order history.
-- Order line items keep product_name/price snapshots; product_id/variant_id become null.

ALTER TABLE public.order_items
  DROP CONSTRAINT IF EXISTS order_items_product_id_fkey,
  DROP CONSTRAINT IF EXISTS order_items_variant_id_fkey;

ALTER TABLE public.order_items
  ADD CONSTRAINT order_items_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL,
  ADD CONSTRAINT order_items_variant_id_fkey
    FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) ON DELETE SET NULL;

-- Owned / ephemeral refs can cascade with the product.
ALTER TABLE public.product_images
  DROP CONSTRAINT IF EXISTS product_images_product_id_fkey;
ALTER TABLE public.product_images
  ADD CONSTRAINT product_images_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

ALTER TABLE public.product_variants
  DROP CONSTRAINT IF EXISTS product_variants_product_id_fkey;
ALTER TABLE public.product_variants
  ADD CONSTRAINT product_variants_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

ALTER TABLE public.cart_items
  DROP CONSTRAINT IF EXISTS cart_items_product_id_fkey;
ALTER TABLE public.cart_items
  ADD CONSTRAINT cart_items_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

ALTER TABLE public.wishlist_items
  DROP CONSTRAINT IF EXISTS wishlist_items_product_id_fkey;
ALTER TABLE public.wishlist_items
  ADD CONSTRAINT wishlist_items_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

ALTER TABLE public.reviews
  DROP CONSTRAINT IF EXISTS reviews_product_id_fkey;
ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
