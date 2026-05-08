AutoVision Pro — Project Summary
What it is: A SaaS car customization platform. Users upload car images and virtually add accessories (spoilers, stickers, graphics, etc.) using a Fabric.js canvas editor. The platform is split into two repos:

auto-vision-web — Next.js 16 (App Router) marketing site + full app frontend
auto-vision-dashboard — React 18 + Fabric.js canvas editor ("RideCraft")
Tech Stack (auto-vision-web):

Next.js 16.2, React 19, TypeScript 5.7, Tailwind CSS v4
shadcn/ui (Radix UI) component library
MongoDB (direct driver, no ORM)
NextAuth v5 (beta) for authentication
Cloudinary for image uploads/storage
LemonSqueezy for international payments, Razorpay for India
Geo-aware pricing (IN vs US), React Hook Form + Zod, Vercel Analytics + GA4
Key Routes:

/ landing, /login, /signup, /pricing, /checkout
/(protected)/dashboard, /(protected)/profile
/api/ — admin, auth, checkout, geo, lemonsqueezy, razorpay, plans, projects, referrals
Business Model — Subscription tiers:

Plan	Projects	Price (IN/US)
Free	1	7-day trial
Starter	1	₹499 / $9/mo
Pro	5	₹1999 / $29/mo
Team	50	₹9999 / ~$x/mo
Project-limit gating enforced server-side
Referral coupon system via cookie (ref param)
Dashboard (auto-vision-dashboard):

React 18, Fabric.js 5.3
Upload car image → canvas editor with accessories sidebar
Drag/drop, resize, rotate, delete; layer management; PNG export



//

i will create 3d models for cars and accessories. so i want a admin type module from where i can map for which car i created 3d model and what accessores i have created for. so when user creates any project from app-vision-web and selects car. so all the mapped accessories to that car and and 3d car of that model will be shown in app-vision-dashboard. and in 2d view, same i need a section where i can map png images of that that particluar car and those images will be shown in left side accessores in 2d view. also image view in 2d view is not coming in central.