import type { Metadata } from "next"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs"
import { DashboardTabsWithCountryToggle } from "@/components/dev/country-toggle"
import {
  Plus, Zap, TrendingUp, CheckCircle2, AlertCircle,
  LayoutGrid, Megaphone, Users, ArrowUpRight, Wallet,
  Clock,
} from "lucide-react"
import { getPlanById, formatPrice } from "@/lib/products"
import { FREE_PLAN_VALIDITY_DAYS, isSubscriptionAccessExpired } from "@/lib/subscription-access"
import { CancelSubscription } from "@/components/dashboard/cancel-subscription"

export const metadata: Metadata = {
  title: "Dashboard — AutoVision Pro",
  description: "Manage your car customization projects",
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { projectLimit, projectsUsed, planType, subscriptionExpiry } = session.user
  const plan = getPlanById(planType)
  const isUnlimited = projectLimit === -1
  const usagePercent = isUnlimited ? 0 : Math.min((projectsUsed / projectLimit) * 100, 100)
  const isNearLimit = !isUnlimited && usagePercent >= 80
  const isAtLimit = !isUnlimited && projectsUsed >= projectLimit
  const isExpired = isSubscriptionAccessExpired(planType, subscriptionExpiry)

  const userCountry: "IN" | "US" = session.user.country === "US" ? "US" : "IN"
  const planPricing = plan?.pricing[userCountry]

  const firstName = session.user.name?.split(" ")[0] ?? "there"
  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Hero banner ──────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden border-b border-gray-200 bg-white">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/6 via-white to-white" />
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-16 left-1/3 h-64 w-64 rounded-full bg-teal-100/40 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-primary/80">{greeting},</p>
              <h1 className="mt-0.5 text-3xl font-bold tracking-tight">{firstName}!</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                {" · "}
                {plan ? (
                  <span className="inline-flex items-center gap-1 text-primary font-medium">
                    <Zap className="h-3 w-3" /> {plan.name} plan
                  </span>
                ) : "Free plan"}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button disabled={isAtLimit || !!isExpired} className="gap-2 shadow-sm" size="sm">
                <Plus className="h-3.5 w-3.5" /> New Project
              </Button>
              <Link href="/dashboard?tab=create-ad">
                <Button variant="outline" size="sm" className="gap-2 bg-card/60 backdrop-blur-sm">
                  <Megaphone className="h-3.5 w-3.5" /> Create Ad
                </Button>
              </Link>
              <Link href="/dashboard?tab=refer">
                <Button variant="outline" size="sm" className="gap-2 bg-card/60 backdrop-blur-sm">
                  <Users className="h-3.5 w-3.5" /> Refer & Earn
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">

        {/* ── Alert banners ────────────────────────────────────────────────── */}
        {isExpired && (
          <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-50 p-4">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-red-700">Subscription expired</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {planType === "free"
                  ? "Your free trial has ended. Upgrade to keep creating projects."
                  : "Renew your subscription to continue."}
              </p>
            </div>
            <Link href="/pricing" className="shrink-0">
              <Button size="sm" variant="destructive">{planType === "free" ? "View Plans" : "Renew"}</Button>
            </Link>
          </div>
        )}

        {isNearLimit && !isExpired && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-50 p-4">
            <TrendingUp className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-amber-700">Approaching project limit</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {projectsUsed} of {projectLimit} projects used. Upgrade for more.
              </p>
            </div>
            <Link href="/pricing" className="shrink-0">
              <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white border-0">Upgrade</Button>
            </Link>
          </div>
        )}

        {/* ── Stat cards ───────────────────────────────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {/* Plan */}
          <div className="group relative overflow-hidden rounded-2xl border border-violet-200 bg-white p-5 transition-all hover:border-violet-300 hover:shadow-md">
            <div className="absolute top-0 right-0 h-24 w-24 -translate-y-8 translate-x-8 rounded-full bg-violet-500/10 blur-2xl" />
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-violet-600">
                <Zap className="h-5 w-5" />
              </div>
              <Link href="/pricing" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-violet-600 transition-colors">
                {planType === "free" ? "Upgrade" : "Manage"} <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
            <p className="mt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">Current Plan</p>
            <p className="mt-1 text-2xl font-bold">{plan?.name ?? "Free"}</p>
            <p className="mt-1 text-xs text-violet-600/80">
              {planType === "free" ? "Limited access" : "Full access enabled"}
            </p>
          </div>

          {/* Projects */}
          <div className="group relative overflow-hidden rounded-2xl border border-sky-200 bg-white p-5 transition-all hover:border-sky-300 hover:shadow-md">
            <div className="absolute top-0 right-0 h-24 w-24 -translate-y-8 translate-x-8 rounded-full bg-sky-500/10 blur-2xl" />
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 text-sky-600">
                <LayoutGrid className="h-5 w-5" />
              </div>
              {!isUnlimited && (
                <span className="text-xs font-medium text-muted-foreground">
                  {Math.round(usagePercent)}% used
                </span>
              )}
            </div>
            <p className="mt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">Projects</p>
            <p className="mt-1 text-2xl font-bold">
              {projectsUsed}
              <span className="text-base font-normal text-muted-foreground"> / {isUnlimited ? "∞" : projectLimit}</span>
            </p>
            {!isUnlimited && (
              <Progress
                value={usagePercent}
                className="mt-3 h-1.5 bg-sky-500/10 [&>div]:bg-sky-500"
              />
            )}
          </div>

          {/* Status */}
          <div className="group relative overflow-hidden rounded-2xl border border-emerald-200 bg-white p-5 transition-all hover:border-emerald-300 hover:shadow-md">
            <div className="absolute top-0 right-0 h-24 w-24 -translate-y-8 translate-x-8 rounded-full bg-emerald-500/10 blur-2xl" />
            <div className="flex items-start justify-between">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-emerald-600 ${isExpired ? "bg-red-500/15 !text-red-600" : "bg-emerald-500/15"}`}>
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</p>
            <p className={`mt-1 text-2xl font-bold ${isExpired ? "text-red-600" : "text-emerald-600"}`}>
              {isExpired ? "Expired" : "Active"}
            </p>
            {subscriptionExpiry && (
              <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {planType === "free" ? "Trial ends " : isExpired ? "Expired " : "Renews "}
                {new Date(subscriptionExpiry).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </p>
            )}
          </div>

          {/* Cost */}
          <div className="group relative overflow-hidden rounded-2xl border border-amber-200 bg-white p-5 transition-all hover:border-amber-300 hover:shadow-md">
            <div className="absolute top-0 right-0 h-24 w-24 -translate-y-8 translate-x-8 rounded-full bg-amber-500/10 blur-2xl" />
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600">
                <Wallet className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">Monthly Cost</p>
            <p className="mt-1 text-2xl font-bold">
              {planPricing && planPricing.amount > 0 ? formatPrice(planPricing.amount, planPricing.currency) : "Free"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {!planPricing || planPricing.amount === 0
                ? `${FREE_PLAN_VALIDITY_DAYS}-day trial`
                : "Billed monthly"}
            </p>
          </div>
        </div>

        {/* ── Cancel subscription (paid active users only) ─────────────────── */}
        {planType !== "free" && !isExpired && (
          <CancelSubscription planName={plan?.name ?? planType} subscriptionExpiry={subscriptionExpiry} />
        )}

        {/* ── Tabs ─────────────────────────────────────────────────────────── */}
        {process.env.NODE_ENV === "development" ? (
          <DashboardTabsWithCountryToggle
            isAtLimit={isAtLimit}
            isExpired={isExpired}
            userEmail={session.user.email}
            userName={session.user.name || "User"}
            defaultCountry={session.user.country === "US" ? "US" : "IN"}
          />
        ) : (
          <DashboardTabs
            isAtLimit={isAtLimit}
            isExpired={isExpired}
            userEmail={session.user.email}
            userName={session.user.name || "User"}
            country={session.user.country === "US" ? "US" : "IN"}
          />
        )}

      </div>
    </div>
  )
}
