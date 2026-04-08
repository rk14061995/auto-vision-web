import type { Metadata } from "next"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { PricingTable } from "@/components/pricing/pricing-table"

export const metadata: Metadata = {
  title: "Pricing - AutoVision Pro",
  description:
    "Choose the perfect plan for your car customization needs. From free trials to enterprise solutions.",
}

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Plans and Pricing
            </h1>
            <p className="mt-4 text-pretty text-lg text-muted-foreground">
              Get started immediately for free. Upgrade for more projects,
              features, and support.
            </p>
          </div>

          {/* Pricing Table */}
          <div className="mt-16">
            <PricingTable />
          </div>

          {/* FAQ Section */}
          <div className="mt-24">
            <h2 className="text-center text-2xl font-bold">
              Frequently Asked Questions
            </h2>
            <div className="mx-auto mt-12 grid max-w-3xl gap-8">
              {[
                {
                  q: "Can I change my plan later?",
                  a: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and you will be charged or credited the prorated amount.",
                },
                {
                  q: "What payment methods do you accept?",
                  a: "We accept all major credit cards for international payments. For India, we also support UPI, net banking, and popular wallets via Razorpay.",
                },
                {
                  q: "Is there a free trial?",
                  a: "Yes! Our Free plan gives you access to basic features with 1 project. No credit card required to get started.",
                },
                {
                  q: "What happens when I reach my project limit?",
                  a: "You will be prompted to upgrade to a higher tier plan. Your existing projects remain accessible, but you cannot create new ones until you upgrade.",
                },
              ].map((faq) => (
                <div key={faq.q}>
                  <h3 className="font-semibold">{faq.q}</h3>
                  <p className="mt-2 text-muted-foreground">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
