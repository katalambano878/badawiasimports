-- Align products with admin/storefront fields that expect sale_price.
-- Selling price remains `price`; optional discount price is `sale_price`.
-- compare_at_price stays as the strikethrough / "was" price.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS sale_price numeric;

COMMENT ON COLUMN products.sale_price IS 'Optional discounted selling price; when set and lower than price, storefront may show it as the active price.';
