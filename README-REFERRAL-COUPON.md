# Referral & Coupon Implementation Summary

## What’s Implemented

### Referral & Earn
- **Unique referral code** generated per user at signup (`referralCode` in users collection)
- **Referral link**: `https://<app>/signup?ref=<CODE>`; middleware stores `ref` cookie for attribution
- **Reward model**: Only after successful first paid order:
  - Referrer gets ₹200 (INR) or $5 (USD) credits
  - Referred user gets 10% off on their first purchase (via referral discount in quote)
- **Dashboard UI**: Refer & Earn tab shows code, link, referred count, rewards count, credit balances
- **Server enforcement**: Razorpay and Lemon Squeezy webhooks credit the referrer and clear `referredByCode` to prevent duplicate rewards

### Coupons (Razorpay – fully dynamic; Lemon Squeezy – native discount codes)
- **Coupon model**: `%` or `flat` discounts, currency (`INR|USD|ANY`), min amount, max uses, per‑user limit, expiry
- **APIs**:
  - `POST /api/checkout/quote` validates coupons, referral eligibility, and credit usage; returns breakdown
  - Razorpay order creation uses quote to compute final amount and persists discount metadata
  - Lemon Squeezy checkout URL can pass `discount_code` for native coupons
- **UI**: Coupon input on Razorpay checkout; Lemon checkout accepts coupon to pass to hosted checkout
- **Admin APIs**: `/api/admin/coupons` (GET/POST) and `/api/admin/coupons/[code]` (PATCH/DELETE) for CRUD

### Credits
- **User balances**: `creditBalanceINR` and `creditBalanceUSD` fields
- **Transactions**: `credit_transactions` collection records `referral_reward` and `credit_spent`
- **Usage**: Credits can be applied at checkout (checkbox) and are deducted on successful payment

## How to Test

### 1. Seed sample coupons
```bash
cd /var/www/html/learning/auto-vision-web
npx tsx scripts/seed-coupons.ts
```

### 2. Referral flow
- Sign up as User A → note referral code from Dashboard → Refer & Earn tab
- Open a new browser/incognito window → sign up using User A’s referral link
- User B completes a paid plan purchase (use Razorpay for full flow)
- Verify:
  - User B got 10% referral discount on checkout
  - User A received ₹200 credits in Dashboard → Refer & Earn
  - User B’s `referredByCode` is cleared after payment

### 3. Coupon flow
- Use seeded coupons (e.g., `WELCOME10`, `FLAT200`, `FIRSTUSER`)
- On Razorpay checkout, apply coupon and verify discount breakdown
- On Lemon checkout, coupon is passed to hosted checkout; verify discount applied there

### 4. Credits usage
- As User A (with credits), enable “Use referral credits” on a new plan purchase
- Verify credit deduction and `credit_spent` transaction

## Environment Variables Required
- `MONGODB_URI`: for storing users, coupons, orders, transactions
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`: for Razorpay orders
- `LEMONSQUEEZY_STORE_ID`, `LEMONSQUEEZY_WEBHOOK_SECRET`: for Lemon Squeezy integration
- `NEXT_PUBLIC_APP_URL`: for generating referral links
- `ADMIN_EMAILS` (comma-separated): for admin coupon CRUD APIs

## Important Notes
- Referral rewards are granted **only after the first successful paid order** to prevent abuse
- Lemon Squeezy coupons are native; Razorpay coupons are fully dynamic
- Credits are currency-specific; INR credits cannot be used for USD purchases and vice versa
- Coupon validation is server-side; frontend only displays UI
- Referral attribution persists in a 30‑day cookie (`ref`) for signups

## Next Steps (Optional)
- Add admin UI to manage coupons without direct API calls
- Add referral analytics dashboard
- Add email notifications for rewards
- Integrate with Lemon Squeezy API checkout for dynamic coupon application (Phase‑2)
