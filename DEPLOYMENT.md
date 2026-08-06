# Deployment Guide

## 1. Environment variables

| Variable | Where it's used | How to get it |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser + server Supabase clients | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser + server Supabase clients | Supabase → Project Settings → API → `anon public` (or `publishable`) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Stripe webhook only (`lib/supabase/admin.ts`) — bypasses RLS | Supabase → Project Settings → API → `service_role` (or `secret`) key. **Server-only. Never prefix with `NEXT_PUBLIC_`, never expose to the browser.** |
| `NEXT_PUBLIC_SITE_URL` | Auth redirects, Stripe success/cancel URLs | Your deployed URL, e.g. `https://gatoguarumo.com` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Reserved for future client-side Stripe.js use | Stripe → Developers → API keys |
| `STRIPE_SECRET_KEY` | Checkout Session + Connect account creation, Transfers | Stripe → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | Verifies webhook signatures | Stripe → Developers → Webhooks → your endpoint → Signing secret |

Set these in your hosting provider's dashboard (see Vercel section below) — `.env.local` is for local dev only and is gitignored on purpose.

## 2. Stripe Connect setup

This app uses **Express accounts** — vendors onboard through a Stripe-hosted flow, no separate OAuth client ID needed.

1. **Enable Connect**: Stripe Dashboard → Connect → Get started. Set your platform name and branding (shown to vendors during onboarding).
2. **Get your API keys**: Developers → API keys. Use test keys first (`sk_test_...`) — switch to live keys (`sk_live_...`) only once you're ready to accept real payments.
3. **Register the webhook endpoint**: Developers → Webhooks → Add endpoint
   - URL: `https://<your-domain>/api/stripe/webhook`
   - Events to send: `checkout.session.completed`, `account.updated`
   - Copy the **Signing secret** into `STRIPE_WEBHOOK_SECRET`
4. **How vendor onboarding works in the app**: a vendor clicks "Connect Stripe to get paid" on `/vendor/dashboard` → `POST /api/vendor/stripe-onboarding` creates an Express account (first time only) and a Stripe-hosted Account Link → vendor completes identity/bank details on Stripe's site → redirected back to the dashboard. Stripe sends `account.updated` to the webhook, which flips `vendors.stripe_onboarding_complete` to `true` once `details_submitted && charges_enabled`.
5. **How payouts work**: on `checkout.session.completed`, the webhook creates the order records, then calls `stripe.transfers.create()` to move each vendor's cut (subtotal minus the platform commission) to their connected account. If a vendor hasn't finished onboarding yet, the transfer is skipped (logged, not thrown) and the order stays recorded with `order_vendors.status = 'pending'` for manual follow-up.
6. **Testing**: use Stripe's [test card numbers](https://stripe.com/docs/testing) (e.g. `4242 4242 4242 4242`) and the [Stripe CLI](https://stripe.com/docs/stripe-cli) to forward webhooks to your local dev server: `stripe listen --forward-to localhost:3000/api/stripe/webhook`.

## 3. Supabase production checklist

- **Redirect URLs**: Authentication → URL Configuration → add your production domain (`https://<your-domain>/**`) alongside `localhost` so email confirmation links work in production.
- **Site URL**: set to your production domain once deployed.
- Migrations already applied if you followed Steps 1–4 (`001_initial_schema.sql`, `002_grants_and_rls_fixes.sql`) — no further action needed unless you add new ones.

## 4. Deploy to Vercel

1. Push this repo to GitHub (already done).
2. [vercel.com/new](https://vercel.com/new) → import `gatoguarumo_website`. Vercel auto-detects Next.js — no config file needed.
3. Add all the environment variables from the table above in the Vercel project's **Settings → Environment Variables** (Production + Preview as needed).
4. Deploy. Vercel gives you a `https://<project>.vercel.app` URL — set that (or your custom domain) as `NEXT_PUBLIC_SITE_URL` and redeploy so redirect URLs are correct.
5. Point your Stripe webhook and Supabase redirect URLs at the final production domain (steps 2–3 above).

## 5. Post-deploy smoke test

- Register a new account, confirm the email link works against the production URL
- Browse `/shop`, confirm products load
- Add to cart → checkout → complete a Stripe test payment → confirm the order appears in `/account` and the matching `/vendor/dashboard`
- Connect Stripe as a vendor, confirm `account.updated` flips onboarding status
