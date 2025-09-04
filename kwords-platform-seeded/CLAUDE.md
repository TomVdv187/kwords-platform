# CLAUDE.md — Deploying the Keyword Sponsorship Ad Platform (MVP)

This guide lets you **clone, configure, and deploy** a production-grade MVP of a *k‑words.io–style* platform on **Vercel**, with a **PostgreSQL** database (Neon), optional **Redis** (Upstash), and **OpenRTB 2.5 connectors** for major DSPs/SSPs. It includes a **publisher SDK** that scans pages for sponsored keywords and runs a lightweight auction across your **first‑party sponsors** and **external DSPs**.

> Scope: This is an MVP with clean, extensible code. It avoids any proprietary assets or trade secrets and is built around open standards (OpenRTB 2.5, IAB TCF v2.2).

---

## 1) What you get

- **apps/web** — Next.js 14 (App Router) app with API routes (Vercel serverless compatible)
  - `/api/auction` — Keyword auction endpoint (local DB + external DSP connectors)
  - `/api/events` — Impression/click tracking + budget pacing
  - `/.well-known/ads.txt` and `/.well-known/sellers.json` — Programmatic transparency
  - Minimal **dashboard** with instructions
- **packages/sdk-publisher** — Tiny JS snippet to *scan DOM* and request sponsored keyword creatives
- **packages/openrtb-connectors** — Pluggable OpenRTB 2.5 client for external DSP/SSP endpoints
- **Prisma** ORM + **PostgreSQL** schema for publishers, keywords, campaigns, creatives, budgets, events

---

## 2) Prereqs

- **Node 18+**, **pnpm**
- **Vercel** account
- **Neon** (or any hosted PostgreSQL): DB URL
- (Optional) **Upstash Redis**: for rate limits/pacing
- (Recommended) A domain (to serve `ads.txt` + `sellers.json` publicly)

---

## 3) Quick start (local)

```bash
pnpm i
cd apps/web
cp .env.example .env
# Fill DB URL etc.
pnpm prisma migrate dev
pnpm dev
```
Open http://localhost:3000

Seed first data quickly via the dashboard hint or Prisma Studio:
```bash
pnpm prisma studio
```

---

## 4) Environment variables

Create **apps/web/.env** based on **.env.example**:

```
# Database
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DBNAME?pgbouncer=true&connection_limit=1"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"  # set to your prod URL on Vercel
APP_SECRET="change-me-strong-random"

# Optional Redis (Upstash)
REDIS_URL=""
REDIS_TOKEN=""

# Compliance (IAB TCF v2.2)
NEXT_PUBLIC_TCF_REQUIRED="false"

# OpenRTB DSP/SSP endpoints (comma-separated)
OPENRTB_ENDPOINTS="https://example-dsp-a.com/bid,https://example-dsp-b.com/openrtb2"
OPENRTB_AUTH_HEADERS='{"https://example-dsp-a.com/bid":{"Authorization":"Bearer X"},"https://example-dsp-b.com/openrtb2":{"x-api-key":"Y"}}'

# Seller transparency
SELLER_SEAT_ID="kwords-mvp-seat-1"
SELLER_NAME="Your Company BV"
SELLER_DOMAIN="your-domain.tld"
```

---

## 5) Database schema (Prisma)

Key tables:
- **User, Org, PublisherSite**
- **Keyword, Campaign, Creative**
- **Sponsorship** (joins Campaign↔Keyword with bid + budgets)
- **Event** (impression/click/conv) for reporting
- **Deal** (optional fixed-price deals, PMP)
- **AdSystem** (for ads.txt/sellers.json export)

Run:
```bash
pnpm prisma migrate deploy
```

---

## 6) Publisher integration

1. Add this snippet near the end of `<body>` on the publisher site:
```html
<script async src="https://YOUR_APP/.well-known/sdk-publisher.js" data-site="SITE_KEY"></script>
```
2. The SDK scans text nodes, resolves matched keywords, and requests `/api/auction` with `{ url, siteKey, kw, tcfConsent }`.
3. The endpoint returns a creative payload; the SDK wraps the word with an anchor + hover card and logs an impression.

> The SDK respects `NEXT_PUBLIC_TCF_REQUIRED`; if true and no consent, it restricts to **contextual** only.

---

## 7) DSP/SSP connectivity (OpenRTB 2.5)

- Configure endpoints in `OPENRTB_ENDPOINTS` (comma-separated).
- Optionally provide per-endpoint headers via `OPENRTB_AUTH_HEADERS` (JSON object).
- The platform builds a **BidRequest** with `site`, `user`, `regulations` (GDPR), `bcat/badv`, and an `imp` of type `banner`/`native` (text). Highest net bid wins vs. your first‑party sponsors (by eCPM).

> For large partners (TTD, Yahoo, Xandr, DV360 via Authorized Buyers), you’ll negotiate credentials and a seat/test endpoint. The connector is generic OpenRTB and easy to adapt.

---

## 8) Compliance & transparency

- `/.well-known/ads.txt` — Generated from DB/ENV, serves your exchange/seller IDs
- `/.well-known/sellers.json` — Declares your seller type, domain, and seat
- **TCF v2.2** detection — The SDK reads a CMP if present (`__tcfapi`). If consent is missing and required, it limits data.

> This MVP stores only contextual signals by default and avoids user tracking.

---

## 9) Deploy to Vercel

1. Push to GitHub
2. Import the repo into **Vercel**
3. Set the **Environment Variables** from section 4
4. Add **Neon** DB URL
5. After first deploy, run migrations in a one-off shell or via GitHub Action (see Prisma docs)

> Vercel will host the API routes, dashboard, and `.well-known/*` endpoints.

---

## 10) Roadmap & extension points

- **Auction adapters**: add new scoring strategies in `lib/auction.ts`
- **More formats**: tooltip/native cards, sidebar modules, affiliate links
- **Billing**: integrate Stripe for prepay/postpay
- **Reporting**: pipe events to ClickHouse/BigQuery
- **Admin auth**: replace basic token with NextAuth/OAuth

---

## 11) Smoke tests

- Visit `/` for a quick guide
- `/.well-known/ads.txt` returns text with your seller lines
- `/.well-known/sellers.json` returns JSON with your seat/domain
- Insert a test **Keyword** + **Campaign** + **Sponsorship**, open a test page with the SDK — you should see highlighted words

---

## 12) Support notes

- DV360/Authorized Buyers: you’ll need to adapt to Google’s specific protocol (similar to OpenRTB). Use `packages/openrtb-connectors` as a template.
- Prebid.js: you can expose an **exchange endpoint** and add a custom Prebid bidder if you want header bidding. This MVP focuses on direct SDK + server auctions.


---

## 0) One-click seed (demo)

After deploy, open:

```
https://YOUR-APP/api/admin/seed?token=APP_SECRET
```

Replace `YOUR-APP` with your Vercel URL and `APP_SECRET` with your secret. Then visit:

```
https://YOUR-APP/demo
```

You should see the word **Platform** become a sponsored link.
