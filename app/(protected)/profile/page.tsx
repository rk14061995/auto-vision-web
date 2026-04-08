import type { Metadata } from "next"
import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import {
  User,
  Mail,
  MapPin,
  CreditCard,
  ArrowUpRight,
  Shield,
} from "lucide-react"
import { getPlanById, formatPrice } from "@/lib/products"
import { getCountryName } from "@/lib/geo"

export const metadata: Metadata = {
  title: "Profile - AutoVision Pro",
  description: "Manage your account settings",
}

export default async function ProfilePage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const plan = getPlanById(session.user.planType)
  const { country, subscriptionExpiry, planType } = session.user

  return (
    <div className="py-10">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="border-b border-border pb-6">
          <h1 className="text-2xl font-bold">Profile</h1>
          <p className="text-muted-foreground">
            Manage your account settings and subscription
          </p>
        </div>

        {/* Profile Info */}
        <div className="mt-8 space-y-8">
          {/* Personal Information */}
          <div className="rounded-xl border border-border/50 bg-card p-6">
            <h2 className="flex items-center gap-2 font-semibold">
              <User className="h-5 w-5 text-primary" />
              Personal Information
            </h2>
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{session.user.name}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{session.user.email}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Region</p>
                    <p className="font-medium">
                      {country ? getCountryName(country) : "Not set"}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Change
                </Button>
              </div>
            </div>
          </div>

          {/* Subscription */}
          <div className="rounded-xl border border-border/50 bg-card p-6">
            <h2 className="flex items-center gap-2 font-semibold">
              <CreditCard className="h-5 w-5 text-primary" />
              Subscription
            </h2>
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-4">
                <div>
                  <p className="font-semibold">{plan?.name || "Free"} Plan</p>
                  <p className="text-sm text-muted-foreground">
                    {plan
                      ? formatPrice(plan.pricing.US.amount, "USD") + "/month"
                      : "No cost"}
                  </p>
                </div>
                <Link href="/pricing">
                  <Button className="gap-2">
                    {planType === "free" ? "Upgrade" : "Change Plan"}
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>

              {subscriptionExpiry && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Next billing date
                    </p>
                    <p className="font-medium">
                      {new Date(subscriptionExpiry).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Manage Billing
                  </Button>
                </div>
              )}

              <div className="border-t border-border pt-4">
                <p className="text-sm text-muted-foreground">Plan Features</p>
                <ul className="mt-2 space-y-1">
                  {plan?.features.slice(0, 5).map((feature) => (
                    <li key={feature} className="text-sm">
                      • {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="rounded-xl border border-border/50 bg-card p-6">
            <h2 className="flex items-center gap-2 font-semibold">
              <Shield className="h-5 w-5 text-primary" />
              Security
            </h2>
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Password</p>
                  <p className="text-sm text-muted-foreground">
                    Last changed: Never
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Change Password
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Enable
                </Button>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="rounded-xl border border-destructive/50 bg-destructive/5 p-6">
            <h2 className="font-semibold text-destructive">Danger Zone</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Once you delete your account, there is no going back. Please be
              certain.
            </p>
            <Button variant="destructive" size="sm" className="mt-4">
              Delete Account
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
