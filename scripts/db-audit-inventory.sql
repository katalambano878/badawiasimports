-- Staging DB inventory (safe read-only)
SELECT version() AS pg_version;
SELECT current_database() AS db_name;

SELECT nspname AS schema_name
FROM pg_namespace
WHERE nspname NOT IN ('pg_catalog','information_schema','pg_toast')
ORDER BY 1;

SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname IN ('public','auth')
ORDER BY 1,2;

SELECT
  c.relname AS table_name,
  a.attname AS column_name,
  pg_catalog.format_type(a.atttypid, a.atttypmod) AS data_type,
  a.attnotnull AS not_null,
  pg_get_expr(ad.adbin, ad.adrelid) AS default_expr
FROM pg_attribute a
JOIN pg_class c ON a.attrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
LEFT JOIN pg_attrdef ad ON a.attrelid = ad.adrelid AND a.attnum = ad.adnum
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND a.attnum > 0
  AND NOT a.attisdropped
ORDER BY c.relname, a.attnum;

SELECT conrelid::regclass AS table_name, conname, pg_get_constraintdef(oid) AS def
FROM pg_constraint
WHERE connamespace = 'public'::regnamespace
ORDER BY 1,2;

SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

SELECT c.relname AS table_name, s.n_live_tup AS approx_rows
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_stat_user_tables s ON s.relid = c.oid
WHERE n.nspname = 'public' AND c.relkind = 'r'
ORDER BY s.n_live_tup DESC;

SELECT proname
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
ORDER BY 1;

SELECT t.typname
FROM pg_type t
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public' AND t.typtype = 'e'
ORDER BY 1;
