#!/usr/bin/env bash
set -euo pipefail
BASE_STAGING="${1:-https://badawiasimports-staging.169-58-8-203.sslip.io}"
BASE_PROD="${2:-https://www.badawiasimports.com}"

probe() {
  local base="$1" path="$2"
  local code time
  code=$(curl -s -o /tmp/bi-probe.out -w '%{http_code}' --max-time 25 "${base}${path}" || echo ERR)
  time=$(curl -s -o /dev/null -w '%{time_total}' --max-time 25 "${base}${path}" || echo 0)
  echo "$code ${time}s ${base}${path}"
}

echo "=== STAGING ==="
for p in / /shop /categories /cart /checkout /auth/login /account /contact /admin/login /pay/test /order-success /api/storefront/products /api/storefront/categories; do
  probe "$BASE_STAGING" "$p"
done
echo "rest GET products:"
curl -s -o /tmp/bi-rest.json -w '%{http_code}\n' --max-time 25 "${BASE_STAGING}/rest/v1/products?select=id&limit=1"
echo "rpc mark_order_paid:"
curl -s -o /tmp/bi-rpc.json -w '%{http_code}\n' --max-time 25 -X POST "${BASE_STAGING}/rest/v1/rpc/mark_order_paid" \
  -H 'Content-Type: application/json' -d '{"order_ref":"ORD-TEST-SPOOF"}'
head -c 200 /tmp/bi-rpc.json; echo
echo "patch orders:"
curl -s -o /tmp/bi-patch.json -w '%{http_code}\n' --max-time 25 -X PATCH \
  "${BASE_STAGING}/rest/v1/orders?order_number=eq.ORD-TEST" \
  -H 'Content-Type: application/json' -d '{"payment_status":"paid"}'
head -c 200 /tmp/bi-patch.json; echo

echo "=== PROD ==="
for p in / /shop /api/storefront/products; do
  probe "$BASE_PROD" "$p"
done
echo "prod rest GET products:"
curl -s -o /tmp/bi-rest-p.json -w '%{http_code}\n' --max-time 25 "${BASE_PROD}/rest/v1/products?select=id&limit=1"
echo "prod rpc mark_order_paid:"
curl -s -o /tmp/bi-rpc-p.json -w '%{http_code}\n' --max-time 25 -X POST "${BASE_PROD}/rest/v1/rpc/mark_order_paid" \
  -H 'Content-Type: application/json' -d '{"order_ref":"ORD-TEST-SPOOF"}'
head -c 200 /tmp/bi-rpc-p.json; echo

echo "=== DB ==="
sudo docker exec fleet-postgres psql -U badawiasimports -d badawiasimports -c "SELECT (SELECT count(*) FROM products) AS products, (SELECT count(*) FROM orders) AS orders, (SELECT count(*) FROM auth.users) AS users;"
sudo docker exec fleet-postgres psql -U badawiasimports -d badawiasimports -c "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY 1;"
