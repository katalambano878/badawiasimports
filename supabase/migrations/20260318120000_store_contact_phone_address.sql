-- Canonical store contact (footer, contact page, WhatsApp, maps)
INSERT INTO public.store_settings (key, value, updated_at)
VALUES
  ('contact_phone', to_jsonb('0539781532'::text), now()),
  ('contact_address', to_jsonb('Tamale and Accra'::text), now()),
  ('contact_map_link', to_jsonb('https://www.google.com/maps/search/?api=1&query=Tamale+and+Accra+Ghana'::text), now()),
  ('contact_email', to_jsonb('info@badawiasimports.com'::text), now())
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = now();
