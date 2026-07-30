SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('orders','order_items','products','profiles','customers','auth.users')
ORDER BY tablename, indexname;

SELECT conname, conrelid::regclass
FROM pg_constraint
WHERE contype = 'u'
  AND conrelid::regclass::text IN ('orders','products','profiles','customers');
