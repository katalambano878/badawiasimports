# BADAWIA'S IMPORTS — Setup Checklist

## Done ✅
- Brand name: **BADAWIA'S IMPORTS**
- Brand colors: navy `#0D1B45` / red `#CC1414` / cyan `#1ABCDF`
- Phone: **0539781532** (+233539781532)
- Locations: **Tamale & Accra, Ghana**
- Instagram: **@badawias_imports1**
- SMS sender ID: **BADAWIA**
- Supabase project: **cddyzkiosfukthugsyhu** (credentials in `.env.local`)

---

## Still To Do

### 1. Logo Files

Save your logo PNG to:

- `/public/logo.png` ← **most important** (header, footer, admin, PWA)
- `/public/apple-touch-icon.png` (180×180px)
- `/public/icon-192.png` (192×192px)
- `/public/icon-512.png` (512×512px)
- `/public/favicon.ico`

Use https://realfavicongenerator.net to generate all favicon sizes from your logo in one step.

### 2. Domain

Once you have your domain, update `.env.local`:

```
NEXT_PUBLIC_APP_URL=https://youractualdomain.com
```

Also update `EMAIL_FROM` to match:

```
EMAIL_FROM=BADAWIA'S IMPORTS <noreply@youractualdomain.com>
```

### 3. Email (Resend)

- [ ] Create account at https://resend.com
- [ ] Add and verify your domain
- [ ] Set `RESEND_API_KEY` in `.env.local`
- [ ] Set `ADMIN_EMAIL` to your email address

### 4. Payments

Configure whichever payment providers you activate in `.env.local`:

- **Moolre** (Ghana mobile money) — `MOOLRE_API_USER`, `MOOLRE_API_PUBKEY`, `MOOLRE_ACCOUNT_NUMBER`, `MOOLRE_MERCHANT_EMAIL`, `MOOLRE_SMS_API_KEY`, `MOOLRE_CALLBACK_SECRET`
- **Paystack** (card + mobile money) — `PAYSTACK_SECRET_KEY`
- **Stripe** — `STRIPE_SECRET_KEY`, `STRIPE_CURRENCY`

### 5. Admin Panel Setup

```bash
npm run set-admin
```

Run this after setting up Supabase to give your account admin access. Then go to `/admin` and configure:

- Store name, logo URL, contact info (Admin → Settings → General)
- Hero section content (Admin → Settings → Hero)
- Footer content and social links
- Theme colors (already pre-set in code, but can be overridden via Settings)

### 6. Supabase — Run Migrations

```bash
# In Supabase dashboard → SQL Editor
# Run all files in /supabase/migrations/ in order by filename
```

Or use the Supabase CLI:

```bash
npx supabase db push
```

### 7. SEO (Optional)

- [ ] Set `NEXT_PUBLIC_GA_MEASUREMENT_ID` for Google Analytics
- [ ] Set `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` after adding to Google Search Console
- [ ] Set `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` if using reCAPTCHA on forms

### 8. Deploy

```bash
npm run build   # test locally first
```

Then deploy to Vercel:
- Create a **new** Vercel project (don't reuse the old one)
- Set all environment variables in the Vercel dashboard (copy from `.env.local`)
- Connect your custom domain

---

## Brand Reference

| Item | Value |
|------|-------|
| Brand name | BADAWIA'S IMPORTS |
| Phone | 0539781532 |
| WhatsApp | +233539781532 |
| Locations | Tamale & Accra, Ghana |
| Instagram | @badawias_imports1 |
| Primary color | `#0D1B45` |
| Accent color | `#CC1414` |
| Cyan color | `#1ABCDF` |
| SMS sender | BADAWIA |
