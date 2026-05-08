"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { CheckCircle2 } from "lucide-react"

export function AcceptInviteClient({ token }: { token: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [accepted, setAccepted] = useState(false)

  async function accept() {
    setBusy(true)
    try {
      const res = await fetch("/api/teams/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to accept invite")
      setAccepted(true)
      toast.success("You're in!")
      setTimeout(() => router.push("/team"), 1200)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (accepted) {
    return (
      <div className="rounded-2xl border border-primary/40 bg-primary/5 p-8 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
        <h2 className="mt-4 text-xl font-semibold">Welcome to the team!</h2>
        <p className="mt-2 text-sm text-muted-foreground">Redirecting to your workspace...</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-border/50 bg-card p-8 text-center">
      <h1 className="text-2xl font-semibold">You've been invited</h1>
      <p className="mt-2 text-muted-foreground">
        Accept the invitation to join the team workspace.
      </p>
      <Button onClick={accept} disabled={busy} className="mt-6 w-full" size="lg">
        {busy ? "Joining..." : "Accept Invitation"}
      </Button>
    </div>
  )
}
