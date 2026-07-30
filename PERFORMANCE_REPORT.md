# Performance Report

**Date:** 2026-07-30  

## Baseline measurements (staging / prod)

| URL | HTTP | TTFB (approx) |
|-----|------|----------------|
| Staging `/` | 200 | 74ms |
| Staging `/shop` | 200 | 55ms |
| Staging `/categories` | 200 | 207ms |
| Staging `/checkout` | 200 | 59ms |
| Staging `/api/storefront/products` | 200 | 71ms |
| Prod `/` | 200 | 60ms |
| Prod `/shop` | 200 | 50ms |

## Freezing / hang causes identified

1. External Moolre status / SMS / Paystack verify fetches with **no timeout** → request could hang until platform kill.
2. Notification path used browser supabase client from server (extra HTTP hop + failure modes).
3. Unbounded admin client queries possible (large order lists) — mitigated by existing DB indexes; UI pagination still recommended.

## Slow-query / DB

- Key indexes already present (`idx_orders_order_number`, status, user, product slug/status).
- No EXPLAIN regressions run; N+1 risk remains in admin analytics client pages.
- Pool: shared `pg` Pool, `PG_POOL_MAX` default 10.

## Rendering / bundle

- ~50 pages are `'use client'` — large client surface (architectural debt).
- Storefront product/category APIs use server cache headers (`s-maxage=900`).
- Images: `unoptimized: true` for Coolify (avoids sharp failures; larger bandwidth tradeoff).

## Fixes applied

| Fix | Effect |
|-----|--------|
| `fetchWithTimeout` for Moolre status | Caps hang at 12s |
| SMS AbortSignal 12s | Caps hang |
| Paystack verify 15s abort | Caps hang |
| Categories → `supabaseAdmin` | Removes RSC→HTTP round trip |
| Notifications → `supabaseAdmin` | In-process PG |

## Before / after

| Metric | Before | After (code) |
|--------|--------|----------------|
| External API hang risk | Unbounded | 12–15s |
| Categories data path | Browser client in RSC | In-process admin |
| REST abuse load risk | Open write/RPC | ACL gated |

## Recommended next infrastructure steps

1. Gradually move shop/product grids to server components or storefront APIs only.
2. Add admin list pagination caps server-side.
3. Consider CDN caching for public product JSON.
4. Re-enable image optimization once Coolify runner supports sharp reliably.
