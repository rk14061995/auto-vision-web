"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Loader2, XCircle, CheckCircle2 } from "lucide-react"

interface CancelSubscriptionProps {
  planName: string
  subscriptionExpiry: Date | null
}

export function CancelSubscription({ planName, subscriptionExpiry }: CancelSubscriptionProps) {
  const [loading, setLoading] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const [cancelDate, setCancelDate] = useState<string | null>(null)

  const expiryLabel = subscriptionExpiry
    ? new Date(subscriptionExpiry).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "the end of your billing period"

  async function handleCancel() {
    setLoading(true)
    try {
      const res = await fetch("/api/billing/cancel", { method: "POST" })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Cancellation failed")
      const at = json.pendingDowngradeAt
        ? new Date(json.pendingDowngradeAt).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : expiryLabel
      setCancelDate(at)
      setCancelled(true)
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  if (cancelled) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-green-500/30 bg-green-500/10 p-4">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
        <div>
          <p className="font-medium text-green-700 dark:text-green-400">Subscription cancelled</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            You&apos;ll keep {planName} access until{" "}
            <span className="font-medium">{cancelDate}</span>. After that your
            account reverts to the Free plan.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-border/50 bg-card/50 p-4">
      <div>
        <p className="font-medium">Cancel subscription</p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          You&apos;ll keep {planName} access until{" "}
          <span className="font-medium">{expiryLabel}</span>, then revert to Free.
        </p>
      </div>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm" className="shrink-0 border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground">
            <XCircle className="mr-1.5 h-4 w-4" />
            Cancel plan
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel your subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              You&apos;ll keep full <strong>{planName}</strong> access until{" "}
              <strong>{expiryLabel}</strong>. After that your account moves to the
              Free plan and you&apos;ll lose access to paid features. This can be
              reversed by subscribing again before the expiry date.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep my plan</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleCancel}
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Yes, cancel subscription
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
