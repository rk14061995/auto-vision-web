import type { Metadata } from "next"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { getPlanById, formatPrice } from "@/lib/products"
import { type Country } from "@/lib/geo"
import { LemonCheckout } from "@/components/checkout/lemon-checkout"
import { RazorpayCheckout } from "@/components/checkout/razorpay-checkout"
import { Button } from "@/components/ui/button"
import { Car, ArrowLeft, Check, Shield } from "lucide-react"

interface CheckoutPageProps {
  params: Promise<{ planId: string }>
  searchParams: Promise<{ country?: string }>
}

export async function generateMetadata({
  params,
}: CheckoutPageProps): Promise<Metadata> {
  const { planId } = await params
  const plan = getPlanById(planId)

  return {
    title: plan ? `Checkout - ${plan.name} Plan` : "Checkout",
    description: "Complete your purchase",
  }
}

export default async function CheckoutPage({
  params,
  searchParams,
}: CheckoutPageProps) {
  const session = await auth()
  const { planId } = await params
  const { country: countryParam } = await searchParams

  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect(`/login?redirect=/checkout/${planId}`)
  }

  const plan = getPlanById(planId)

  if (!plan || plan.pricing.US.amount === -1) {
    notFound()
  }

  // Determine country - from query param, session, or default to India
  const country: Country =
    (countryParam as Country) || session.user.country || "IN"

  const isIndianCheckout = country === "IN"
  const pricing = plan.pricing[country]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Car className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">AutoVision Pro</span>
          </Link>
          <Link href="/pricing">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Pricing
            </Button>
          </Link>
        </div>
      </header>

      <main className="py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            {/* Order Summary */}
            <div>
              <h1 className="text-2xl font-bold">Checkout</h1>
              <p className="mt-2 text-muted-foreground">
                Complete your subscription to {plan.name}
              </p>

              {/* Plan Card */}
              <div className="mt-8 rounded-xl border border-border/50 bg-card p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">{plan.name} Plan</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {plan.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      {formatPrice(pricing.amount, pricing.currency)}
                    </p>
                    <p className="text-sm text-muted-foreground">/month</p>
                  </div>
                </div>

                <div className="mt-6 border-t border-border pt-6">
                  <p className="text-sm font-medium">What&apos;s included:</p>
                  <ul className="mt-4 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span className="text-sm text-muted-foreground">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Trust badges */}
              <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>Secure payment. Cancel anytime.</span>
              </div>
            </div>
            </div>

            {/* Payment Form */}
            <div className="rounded-xl border border-border/50 bg-card p-6">
              <h2 className="text-lg font-semibold">Payment Details</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Pay securely with Razorpay
              </p>

              <div className="mt-6">
                <RazorpayCheckout
                  plan={plan}
                  userEmail={session.user.email}
                  userName={session.user.name}
                  currency={pricing.currency}
                />

                {/* Alternative: Lemon Squeezy option */}
                <div className="mt-6">
                  <details className="group">
                    <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                      + Or pay with Lemon Squeezy (International)
                    </summary>
                    <div className="mt-4 space-y-4">
                      <div className="rounded-lg border border-border/50 bg-secondary/30 p-4">
                        <p className="text-sm text-muted-foreground">
                          You will be redirected to Lemon Squeezy&apos;s secure
                          checkout to complete your purchase.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between rounded-lg bg-secondary/30 p-3">
                          <span className="text-sm">Email</span>
                          <span className="font-medium">{session.user.email}</span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg bg-secondary/30 p-3">
                          <span className="text-sm">Plan</span>
                          <span className="font-medium">{plan.name}</span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg bg-secondary/30 p-3">
                          <span className="text-sm">Amount</span>
                          <span className="font-medium">
                            {formatPrice(pricing.amount, pricing.currency)}/month
                          </span>
                        </div>
                      </div>

                      <LemonCheckout
                        variantId={plan.pricing.US.lemonSqueezyVariantId}
                        email={session.user.email}
                        planName={plan.name}
                      />
                    </div>
                  </details>
                </div>

                <p className="mt-6 text-center text-xs text-muted-foreground">
                  By subscribing, you agree to our Terms of Service and
                  Privacy Policy.
                </p>
              </div>
          </div>
        </div>
      </main>
    </div>
  )
}
