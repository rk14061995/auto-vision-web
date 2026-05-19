# AutoVision Pro — Web App (`auto-vision-web`)

Next.js 16 marketing + auth frontend for AutoVision Pro. Handles the public site, pricing, sign-up, authenticated dashboard shell, and all AI/payment API routes. The companion repo `auto-vision-dashboard` is a separate React/Fabric.js canvas app running on port 3001 in development.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5.7 |
| Styling | Tailwind CSS 4 |
| Auth | NextAuth v5 (beta) |
| Database | MongoDB Atlas via native driver |
| Payments (India) | Razorpay |
| Payments (international) | Paddle Billing v2 |
| AI | Anthropic Claude claude-sonnet-4-6 (Vision + text) |
| Background removal | remove.bg API |
| Media | Cloudinary |
| Analytics | GA4 + Vercel Analytics + custom web vitals |
| Forms | react-hook-form + zod + @hookform/resolvers |

---

## Project structure (key areas)

```
app/
  [region]/             ← /in/ and /us/ regional pages (homepage + pricing)
    layout.tsx          ← hreflang, region validation
    page.tsx            ← regional homepage
    pricing/page.tsx    ← regional pricing (skips geo-detection)
  (protected)/          ← authenticated dashboard routes
  admin/                ← admin-only routes
  checkout/[planId]/    ← checkout page — uses PaddleCheckout component
  api/
    leads/route.ts      ← POST — saves price-sensitive leads to MongoDB
    geo/route.ts        ← GET — returns visitor's country (IN or US)
    plans/route.ts      ← GET — returns plan list with paddlePriceId
    paddle/
      webhook/route.ts  ← POST — Paddle Billing v2 webhook handler
    ai/
      detect-parts/route.ts       ← POST — Claude Vision car part detection (3 credits)
      remove-background/route.ts  ← POST — remove.bg background removal (2 credits)
      color-theme/route.ts        ← POST — Claude AI color palette generation (2 credits)
    lemonsqueezy/
      webhook/route.ts  ← 404 stub (original code preserved in block comment)
  layout.tsx            ← root layout: GA4, WebVitals, Vercel Analytics
  robots.ts             ← dynamically generated robots.txt
  sitemap.ts            ← dynamically generated sitemap.xml
  not-found.tsx         ← branded 404 page
  error.tsx             ← global error boundary

components/
  checkout/
    paddle-button.tsx   ← Paddle.js CDN overlay checkout (no npm package)
    paddle-checkout.tsx ← coupon code wrapper around PaddleButton
    lemonsqueezy-button.tsx  ← DISABLED (preserved in block comment)
    lemon-checkout.tsx       ← DISABLED (preserved in block comment)
  analytics/
    GoogleAnalytics.tsx
    RouteChangeTracker
    WebVitals.tsx
  landing/
    hero.tsx, regional-hero.tsx, regional-cta.tsx
    features.tsx, testimonials.tsx
  pricing/
    pricing-table.tsx
    lead-form-modal.tsx
    pricing-tracker.tsx

lib/
  paddle.ts             ← Paddle types, signature verification, price-to-plan mapping
  db.ts                 ← MongoDB connection + all type definitions (User, Plan, AICreditFeature)
  credits.ts            ← debit() — AI credit deduction with idempotency
  credit-packs.ts       ← CREDIT_COSTS map + CreditPack catalog
  plans.ts              ← Plan definitions with paddlePriceId
  products.ts           ← Legacy bridge for plan/tier mapping
  auth.ts               ← NextAuth config
  usage.ts              ← writeUsageEvent() — activity logging
  gtag.ts               ← all GA4 tracking functions
  region.ts             ← Region type, content per region, utilities
  leads.ts              ← MongoDB operations for leads collection
  geo.ts                ← detectCountry() using Vercel headers

middleware.ts           ← geo-redirect + referral cookie
```

---

## Environment variables

Copy `.env.example` to `.env.local`:

```bash
# Public URL of this app
NEXT_PUBLIC_APP_URL=https://auto-vision-pro.com

# Companion dashboard app (React/Fabric.js)
NEXT_PUBLIC_DASHBOARD_URL=https://dashboard.auto-vision-pro.com

# NextAuth — generate with: openssl rand -base64 32
AUTH_SECRET=

# Comma-separated admin emails
ADMIN_EMAILS=

# Razorpay (India)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# Paddle Billing v2 (international)
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=   # from Paddle dashboard → Developer → Authentication
PADDLE_API_KEY=                    # server-side only
PADDLE_WEBHOOK_SECRET=             # from Paddle dashboard → Notifications
PADDLE_PRICE_CREATOR=              # price_xxx ID for Creator plan
PADDLE_PRICE_PRO=                  # price_xxx ID for Pro plan
PADDLE_PRICE_STUDIO=               # price_xxx ID for Studio plan
PADDLE_PRICE_PACK_100=             # price_xxx ID for 100-credit pack
PADDLE_PRICE_PACK_500=             # price_xxx ID for 500-credit pack
PADDLE_PRICE_PACK_2000=            # price_xxx ID for 2000-credit pack

# AI — server-side only, never expose to client
ANTHROPIC_API_KEY=                 # for detect-parts and color-theme routes
REMOVE_BG_API_KEY=                 # for remove-background route

# MongoDB Atlas
MONGODB_URI=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=

# GA4
NEXT_PUBLIC_GA_MEASUREMENT_ID=    # format: G-XXXXXXXXXX
```

---

## Payments — Paddle Billing v2

Paddle replaced LemonSqueezy for international (USD) payments. LemonSqueezy code is preserved in block comments in the relevant files for future re-enable.

### Client-side checkout (`components/checkout/paddle-button.tsx`)

Loads `https://cdn.paddle.com/paddle/v2/paddle.js` via `next/script lazyOnload`. On script load: `window.Paddle.Setup({ token: NEXT_PUBLIC_PADDLE_CLIENT_TOKEN })`. On button click: `window.Paddle.Checkout.open({ items, customer, customData })`. No npm package — pure CDN overlay.

### Webhook handler (`app/api/paddle/webhook/route.ts`)

Signature verification uses `lib/paddle.ts → verifyPaddleSignature()`:
```
Paddle-Signature: ts=1234567890;h1=abcdef...
HMAC-SHA256(key=PADDLE_WEBHOOK_SECRET, message="{ts}:{rawBody}")
```

Handled events:
| Event | Action |
|---|---|
| `subscription.created` | Grant plan, store paddleSubscriptionId |
| `subscription.updated` | Upgrade/downgrade plan |
| `subscription.canceled` | Downgrade to free |
| `subscription.past_due` | Mark subscription at-risk |
| `subscription.paused` | Suspend access |
| `subscription.resumed` | Restore access |
| `transaction.completed` | Grant one-time credit packs |
| `transaction.payment_failed` | Log payment failure |

### Plans with Paddle Price IDs (`lib/plans.ts`)

Each plan has `pricing.US.paddlePriceId` (env var). The `GET /api/plans` route returns these IDs to the frontend for the Paddle overlay.

### Price → Email mapping (`lib/paddle.ts → getPaddleUserEmail`)

Extracts user email from webhook payload: `data.custom_data?.email ?? data.customer?.email`.

---

## AI Routes — Dashboard Integration

All three routes accept **either** a NextAuth session cookie OR a `Bearer <email>` token (for the dashboard React app which cannot use NextAuth cookies cross-origin). API keys live server-side only.

### CORS

Every AI route implements `OPTIONS` returning 204 with:
```
Access-Control-Allow-Origin: <request origin>
Access-Control-Allow-Methods: POST,OPTIONS
Access-Control-Allow-Headers: Content-Type,Authorization
Access-Control-Allow-Credentials: true
```

### `POST /api/ai/detect-parts` — 3 credits

Input: `{ imageBase64, carMake?, carModel? }`

Sends image to `claude-sonnet-4-6` Vision. Claude returns a JSON array of bounding boxes:
```json
[{ "name": "Hood", "confidence": 0.95, "x": 0.1, "y": 0.05, "width": 0.4, "height": 0.2, "isSmallPart": false }]
```
All coordinates are fractions (0–1) of image dimensions. Dashboard multiplies by canvas size.

Returns: `{ success: true, parts: [...], creditsUsed: 3 }`

### `POST /api/ai/remove-background` — 2 credits

Input: `{ imageBase64 }`

Converts base64 → binary buffer → posts to `https://api.remove.bg/v1.0/removebg`. Returns `{ success: true, resultBase64: "data:image/png;base64,...", creditsUsed: 2 }`. Returns 503 if `REMOVE_BG_API_KEY` is not set — dashboard falls back to its local edge-detection algorithm.

### `POST /api/ai/color-theme` — 2 credits (Hero Feature)

Input: `{ prompt, carMake?, carModel?, parts?: string[] }`

Calls `claude-sonnet-4-6` with a style prompt and the list of car parts. Claude returns:
```json
{
  "themeName": "Miami Sunset",
  "description": "Vibrant tropical gradient with warm accents",
  "colors": { "Hood": "#FF6B35", "Roof": "#FF4E50", "Door Left": "#FC913A" },
  "accentColor": "#F9D423",
  "mood": "playful"
}
```
Returns: `{ success: true, theme, creditsUsed: 2 }`

---

## AI Credit System

### Types (`lib/db.ts`)

```typescript
type AICreditFeature =
  | "ai_wrap_generate" | "ai_background_remove" | "ai_color_variants"
  | "ai_wheel_suggest" | "ai_enhance"
  | "detect_parts" | "background_remove" | "color_theme"
  | "admin_grant" | "credit_pack" | "monthly_reset" | "signup_bonus"
```

### Credit costs (`lib/credit-packs.ts`)

```typescript
const CREDIT_COSTS = {
  ai_wrap_generate: 5,
  ai_background_remove: 2,
  ai_color_variants: 3,
  ai_wheel_suggest: 2,
  ai_enhance: 4,
  detect_parts: 3,
  background_remove: 2,
  color_theme: 2,
}
```

### Debit pattern (all AI routes follow this)

```typescript
const debitResult = await debit(email, {
  feature: "detect_parts",        // AICreditFeature string
  cost: AI_COST,                  // number of credits
  idempotencyKey: `detect_parts:${email}:${Date.now()}`,
})
if (!debitResult.ok) {
  return NextResponse.json({ error: "Insufficient AI credits", creditsNeeded: AI_COST }, { status: 402 })
}
```

---

## Regional routing

The site serves separate pages for India (`/in/`) and the US (`/us/`).

1. **Middleware** (`middleware.ts`) reads `x-vercel-ip-country` (Vercel edge header). Visitors to `/` redirect to `/in/` or `/us/`; `/pricing` → `/in/pricing` or `/us/pricing`.
2. **`app/[region]/`** validates the segment — any value other than `"in"` or `"us"` triggers `notFound()`.
3. **`PricingTable`** accepts `initialCountry` prop — skips `/api/geo` fetch when provided.
4. **Content** — region-specific copy lives entirely in `lib/region.ts → REGION_CONTENT`.

### URL map

| URL | Audience | Notes |
|---|---|---|
| `/in/` | India | ₹ pricing |
| `/us/` | USA | $ pricing |
| `/in/pricing` | India | PricingTable INR, lead form |
| `/us/pricing` | USA | PricingTable USD, lead form |
| `/marketplace`, `/templates` | Global | Unchanged |
| `/signup`, `/login` | Global | Unchanged |
| `/checkout/[planId]` | Global | PaddleCheckout |

---

## Analytics

### GA4 (`lib/gtag.ts`)

Key event groups: **Auth** (`trackLogin`, `trackSignUp`), **E-commerce** (`trackViewItem`, `trackBeginCheckout`, `trackPurchase`), **Checkout lifecycle** (`trackPaymentInitiated`, `trackPaymentFailed`), **Pricing engagement** (`trackPricingView`, `trackBillingCycleSwitch`, `trackScrollDepth`, `trackExitIntent`), **Lead form** (`trackLeadFormOpen`, `trackLeadFormSubmit`, `trackLeadFormDismiss`), **AI** (`trackAiCall`), **Web vitals** (`trackWebVital`).

### Web Vitals

Measured via `PerformanceObserver`: LCP (< 2.5s), CLS (< 0.1), FCP (< 1.8s), TTFB (< 800ms), INP (< 200ms). Each event includes `metric_rating: 'good' | 'needs-improvement' | 'poor'`.

---

## Lead capture

Triggered by exit intent (mouse leaves viewport top, y ≤ 20px), scroll depth (65%), or timer (60s on pricing page). Deduplicates by email. Stored in MongoDB `leads` collection via `lib/leads.ts`.

---

## SEO & production setup

Security headers in `next.config.mjs`: HSTS (2yr, preload), `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`.

Sitemap (`/sitemap.xml`) and robots.txt (`/robots.txt`) are dynamically generated. Robots blocks `/admin/`, `/api/`, `/checkout/`, `/(protected)/`.

---

## Pre-launch checklist

- [ ] Create `/public/og-image.png` — 1200 × 630 px
- [ ] Set `NEXT_PUBLIC_APP_URL=https://auto-vision-pro.com` in production env
- [ ] Set real `NEXT_PUBLIC_GA_MEASUREMENT_ID` (replace placeholder `G-XXXXXXXXXX`)
- [ ] Set all `PADDLE_PRICE_*` env vars from Paddle dashboard
- [ ] Register webhook endpoint in Paddle dashboard → Notifications → `https://auto-vision-pro.com/api/paddle/webhook`
- [ ] Set `ANTHROPIC_API_KEY` and `REMOVE_BG_API_KEY` in production env
- [ ] Add `export const metadata` to `app/page.tsx`
- [ ] Remove `generator: 'v0.app'` from `app/layout.tsx` if present
- [ ] Mark `generate_lead` as a GA4 conversion event
- [ ] Confirm `ADMIN_EMAILS` is set before deploying
- [ ] Rotate Razorpay and Cloudinary secrets if ever committed

---

## Conventions

- All GA4 events go through `lib/gtag.ts` — never call `window.gtag` directly.
- Region-specific copy lives in `lib/region.ts → REGION_CONTENT` — not scattered in components.
- `lib/leads.ts` and `lib/db.ts` are `server-only` — never import in client components.
- All AI routes debit credits before calling external APIs — never after.
- No `ignoreBuildErrors`, no `console.log` in committed code, no hardcoded secrets.
- LemonSqueezy code is preserved in block comments — do not delete, do not uncomment without testing.
