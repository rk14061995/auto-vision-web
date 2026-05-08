import type { Metadata } from "next"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs"
import {
  Plus,
  Folder,
  ArrowUpRight,
  Clock,
  AlertTriangle,
  Users,
  Megaphone,
} from "lucide-react"
import { getPlanById, formatPrice } from "@/lib/products"
import {
  FREE_PLAN_VALIDITY_DAYS,
  isSubscriptionAccessExpired,
} from "@/lib/subscription-access"
import { getCarProjectsByEmail } from "@/lib/db"

export const metadata: Metadata = {
  title: "Dashboard - AutoVision Pro",
  description: "Manage your car customization projects",
}

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const { projectLimit, projectsUsed, planType, subscriptionExpiry } = session.user
  const plan = getPlanById(planType)
  const isUnlimited = projectLimit === -1
  const usagePercent = isUnlimited ? 0 : (projectsUsed / projectLimit) * 100
  const isNearLimit = !isUnlimited && usagePercent >= 80
  const isAtLimit = !isUnlimited && projectsUsed >= projectLimit

  const isExpired = isSubscriptionAccessExpired(planType, subscriptionExpiry)

  return (
    <div className="py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {session.user.name}
            </p>
          </div>
          <div className="flex gap-2">
            <Button disabled={isAtLimit || !!isExpired} className="gap-2">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
            <Link href="/dashboard?tab=refer">
              <Button variant="outline" className="gap-2">
                <Users className="h-4 w-4" />
                Refer Now
              </Button>
            </Link>
            <Link href="/dashboard?tab=create-ad">
              <Button variant="outline" className="gap-2">
                <Megaphone className="h-4 w-4" />
                Create Ad
              </Button>
            </Link>
          </div>
        </div>

        {/* Alerts */}
        {isExpired && (
          <div className="mt-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <p className="font-medium text-destructive">
                  Your subscription has expired
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {planType === "free"
                    ? "Your free trial has ended. Upgrade to continue creating new projects."
                    : "Renew your subscription to continue creating new projects."}
                </p>
                <Link href="/pricing">
                  <Button size="sm" variant="destructive" className="mt-3">
                    {planType === "free" ? "View plans" : "Renew Now"}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {isNearLimit && !isExpired && (
          <div className="mt-6 rounded-lg border border-primary/50 bg-primary/10 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">
                  {"You're approaching your project limit"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Upgrade your plan to create more projects.
                </p>
                <Link href="/pricing">
                  <Button size="sm" className="mt-3">
                    Upgrade Plan
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Current Plan */}
          <div className="rounded-xl border border-border/50 bg-card p-6">
            <p className="text-sm text-muted-foreground">Current Plan</p>
            <p className="mt-2 text-2xl font-bold">{plan?.name || "Free"}</p>
            <Link
              href="/pricing"
              className="mt-2 inline-flex items-center text-sm text-primary hover:underline"
            >
              {planType === "free" ? "Upgrade" : "Manage"}
              <ArrowUpRight className="ml-1 h-3 w-3" />
            </Link>
          </div>

          {/* Projects Used */}
          <div className="rounded-xl border border-border/50 bg-card p-6">
            <p className="text-sm text-muted-foreground">Projects</p>
            <p className="mt-2 text-2xl font-bold">
              {projectsUsed} / {isUnlimited ? "Unlimited" : projectLimit}
            </p>
            {!isUnlimited && (
              <Progress value={usagePercent} className="mt-3 h-2" />
            )}
          </div>

          {/* Status */}
          <div className="rounded-xl border border-border/50 bg-card p-6">
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="mt-2 text-2xl font-bold">
              {isExpired ? (
                <span className="text-destructive">Expired</span>
              ) : (
                <span className="text-green-500">Active</span>
              )}
            </p>
            {subscriptionExpiry && !isExpired && (
              <p className="mt-2 text-sm text-muted-foreground">
                {planType === "free"
                  ? `Trial ends ${new Date(subscriptionExpiry).toLocaleDateString()}`
                  : `Renews ${new Date(subscriptionExpiry).toLocaleDateString()}`}
              </p>
            )}
          </div>

          {/* Price */}
          <div className="rounded-xl border border-border/50 bg-card p-6">
            <p className="text-sm text-muted-foreground">Monthly Cost</p>
            <p className="mt-2 text-2xl font-bold">
              {plan ? formatPrice(plan.pricing.US.amount, "USD") : "Free"}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {plan?.pricing.US.amount === 0
                ? `${FREE_PLAN_VALIDITY_DAYS}-day trial access`
                : "Billed monthly"}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <DashboardTabs isAtLimit={isAtLimit} isExpired={isExpired} userEmail={session.user.email} userName={session.user.name || 'User'} country={session.user.country === 'US' ? 'US' : 'IN'} />
      </div>
    </div>
  )
}
