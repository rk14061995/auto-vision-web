"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Download, Clock, CheckCircle2, Loader2, AlertCircle } from "lucide-react"

interface DesignRequest {
  _id: string
  adType: string
  shopName: string
  tagline: string
  paymentAmount: number
  paymentCurrency: string
  status: "pending_payment" | "paid" | "in_progress" | "completed"
  resultImageUrl?: string
  createdAt: string
}

const STATUS_CONFIG = {
  pending_payment: { label: "Pending Payment", icon: AlertCircle, color: "text-amber-500" },
  paid: { label: "Submitted", icon: Clock, color: "text-blue-500" },
  in_progress: { label: "In Progress", icon: Loader2, color: "text-primary" },
  completed: { label: "Completed", icon: CheckCircle2, color: "text-green-500" },
}

export function DesignRequestList() {
  const [requests, setRequests] = useState<DesignRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/ads/design-request")
      .then((r) => r.json())
      .then(setRequests)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-sm text-muted-foreground">Loading requests...</p>
  if (requests.length === 0) {
    return <p className="text-sm text-muted-foreground">No design requests yet. Fill out the form above to get started.</p>
  }

  return (
    <div className="space-y-3">
      {requests.map((req) => {
        const cfg = STATUS_CONFIG[req.status]
        const Icon = cfg.icon
        return (
          <Card key={req._id}>
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <Icon className={`h-5 w-5 shrink-0 ${cfg.color} ${req.status === "in_progress" ? "animate-spin" : ""}`} />
                <div className="min-w-0">
                  <p className="font-medium truncate">{req.shopName}</p>
                  <p className="text-xs text-muted-foreground">
                    {req.adType.replace(/_/g, " ")} · {req.paymentCurrency === "USD" ? "$" : "₹"}{req.paymentAmount} · {new Date(req.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className={cfg.color}>{cfg.label}</Badge>
                {req.status === "completed" && req.resultImageUrl && (
                  <Button size="sm" variant="outline" asChild className="gap-1.5">
                    <a href={req.resultImageUrl} download target="_blank" rel="noreferrer">
                      <Download className="h-3.5 w-3.5" /> Download
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
