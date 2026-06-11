import type { Metadata } from "next"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export const metadata: Metadata = {
  title: "FAQ — AutoVision Pro",
  description: "Frequently asked questions about AutoVision Pro's car customization tools, pricing, AI credits, advertising, and services.",
}

const FAQS: { q: string; a: string }[] = [
  {
    q: "What is AutoVision Pro?",
    a: "AutoVision Pro is an AI-powered car customisation platform. You can virtually wrap your car in any colour or design, remove backgrounds from car photos, detect and label car parts, and generate colour themes — all in a browser-based canvas. We also serve automotive businesses through our advertising platform, creative design service, and website building service.",
  },
  {
    q: "Is there a free plan?",
    a: "Yes. Every new account gets a free plan with a limited number of AI credits. You can explore the canvas tools, try background removal, and see part detection results without paying anything. Upgrade when you need more credits or premium features.",
  },
  {
    q: "What are AI credits?",
    a: "AI credits are consumed each time you use an AI-powered feature. Car part detection costs 3 credits, background removal costs 2 credits, and colour theme generation costs 2 credits. Your monthly allocation resets on your billing date. You can also purchase credit packs (100, 500, or 2000 credits) that never expire.",
  },
  {
    q: "Which payment methods are accepted?",
    a: "For Indian users (INR), we accept all major cards, UPI, net banking, and wallets via Razorpay. For international users (USD), we accept PayPal and all major cards via PayPal Checkout. We do not store your card details — all payment processing is handled by these secure, PCI-compliant providers.",
  },
  {
    q: "Can I cancel my subscription anytime?",
    a: "Yes. You can cancel your subscription at any time from the dashboard under Account → Cancel Subscription. Your access continues until the end of the current billing period — we don't cut you off immediately. See our Refund Policy for information on pro-rated refunds.",
  },
  {
    q: "How does the advertising platform work?",
    a: "Once you create an account, go to Dashboard → Ads. Choose an ad placement type (Banner, Vertical, or Landing Hero), upload your creative and ad details, and pay the one-time placement fee. After admin approval (usually within a few hours), your ad goes live and is shown to our automotive audience. You can track impressions and clicks in real time.",
  },
  {
    q: "What ad sizes and formats are supported?",
    a: "We offer four placement types: Banner (1200×200px, 30 days), Vertical Basic (300×600px, 7 days), Vertical Premium (300×600px, 30 days), and Landing Hero (1200×500px, 30 days — homepage hero position). All formats support JPEG and PNG images; the Landing Hero also supports video.",
  },
  {
    q: "What is the Creative Design Service?",
    a: "If you don't have an ad creative ready, our team will design one for you. Submit your brand brief (shop name, colours, tagline, logo), choose from AI-generated copy ideas, and pay the design fee. We deliver a professional banner within 2–3 business days. One revision is included.",
  },
  {
    q: "What is the Website Building Service?",
    a: "For ₹2,999/month (India) or $99/month (international), we design, build, and maintain a custom website for your automotive business. The service includes hosting, monthly content updates, and basic SEO setup. Fill out the inquiry form on our Website Service page and we'll be in touch within 1 business day.",
  },
  {
    q: "How is my data handled?",
    a: "Car images you upload are processed to deliver the AI service (part detection, background removal, etc.) and stored securely on Cloudinary. We do not use your images to train AI models. Full details are in our Privacy Policy.",
  },
  {
    q: "Can I use AutoVision Pro on mobile?",
    a: "The marketing pages, pricing, and account management work on mobile. The canvas editor (in the dashboard app) is optimised for desktop/tablet due to the precision required for design work. We recommend a screen of at least 1024px wide for the best editing experience.",
  },
  {
    q: "Do unused credits roll over?",
    a: "Subscription credits reset each billing cycle and do not roll over. Purchased credit pack credits never expire and accumulate on top of your monthly allocation.",
  },
  {
    q: "How do I get a refund?",
    a: "Email support@auto-vision-pro.com with your order details. Refund eligibility depends on the product — see our full Refund Policy for details. We aim to respond within 2 business days.",
  },
  {
    q: "Is AutoVision Pro available outside India and the US?",
    a: "Yes — users from any country can sign up. The regional pages (/in/ and /us/) are optimised for those markets with local pricing, but anyone can access the platform at /signup. International payments are handled in USD via PayPal.",
  },
]

export default function FAQPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">

          <div className="mb-12">
            <p className="text-xs font-medium uppercase tracking-widest text-primary mb-3">FAQ</p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Frequently Asked Questions</h1>
            <p className="mt-3 text-lg text-muted-foreground">
              Everything you need to know about AutoVision Pro. Can't find your answer?{" "}
              <Link href="/contact" className="text-primary hover:underline">Contact us</Link>.
            </p>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <details
                key={i}
                className="group rounded-xl border border-border/50 bg-card/60 open:bg-card transition-all"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 font-medium text-sm list-none select-none">
                  <span>{faq.q}</span>
                  <span className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs group-open:rotate-45 transition-transform">
                    +
                  </span>
                </summary>
                <div className="px-5 pb-5 pt-1 text-sm text-muted-foreground leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>

          <div className="mt-16 rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center">
            <h2 className="text-lg font-bold">Still have questions?</h2>
            <p className="mt-2 text-sm text-muted-foreground">Our support team replies within 1 business day.</p>
            <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/contact">
                <Button className="gap-2">
                  Contact support <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="outline">Try AutoVision Pro free</Button>
              </Link>
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  )
}
