# Supabase → PostgreSQL Database Report

| Supabase feature | Previous | PostgreSQL replacement | Status |
|------------------|----------|------------------------|--------|
| Hosted Postgres | Supabase project | fleet-postgres DBs `badawiasimports` / `_staging` | Complete |
| PostgREST | Hosted API | `/rest/v1` + `lib/db/query-builder.ts` | Complete |
| GoTrue | Supabase Auth | `/auth/v1` + `lib/db/auth.ts` + `auth.users` | Complete |
| RLS | Policies in early SQL | `lib/db/rest-acl.ts` + JWT middleware | Complete (app-layer) |
| Service role | `supabaseAdmin` SDK | `dbAdmin` in-process `pg` | Complete |
| Browser client | `@supabase/ssr` | `lib/app-client.ts` | Complete — packages removed |
| Storage | Supabase Storage | Local disk `lib/db/storage.ts` + `/storage/v1` | Complete |
| Realtime | Channels | Not used | N/A |
| Edge functions | Supabase functions | Next.js `app/api/*` | Complete |
| RPC | `supabase.rpc` | `dbAdmin.rpc` / SQL functions | Complete |
| Types | Generated supabase types | `types/supabase.ts` (stale archive; still useful names) | Partial — missing newer tables |

## Remaining references (intentional)

- Env dual-read: `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`
- Cookie names `sb-*-auth-token` (+ `app-access-token`)
- Folder `supabase/migrations/` and `lib/db/supabase-compat.ts` re-export
- Auth CORS header `x-supabase-api-version` for client compatibility

## No hosted dependency

Runtime does not call `*.supabase.co`. Confirmed via package removal and env pointing at app origin.
