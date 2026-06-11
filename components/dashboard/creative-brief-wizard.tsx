"use client"

import { useState, useRef } from "react"
import Script from "next/script"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Loader2, Sparkles, CheckCircle2, ArrowRight, ArrowLeft,
  Upload, X, CreditCard, Palette,
} from "lucide-react"
import { AD_TYPES, DESIGN_SERVICE_PRICES, formatPrice } from "@/lib/products"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  IndiaGatewaySelector,
  submitPayUForm,
  type IndiaGateway,
} from "@/components/payment/india-gateway"

type DesignAdType = "banner" | "vertical_basic" | "vertical_premium" | "landing_hero"
type Step = "type" | "brief" | "copy" | "pay" | "done"

interface CopyVariant { headline: string; subtext: string; cta: string }

interface Props {
  userEmail: string
  userName: string
  country?: "IN" | "US"
}

declare global {
  interface Window {
    Razorpay: new (opts: Record<string, unknown>) => { open(): void }
  }
}

const DESIGNABLE_TYPES = AD_TYPES.filter((a) =>
  ["banner", "vertical_basic", "vertical_premium", "landing_hero"].includes(a.id)
)

export function CreativeBriefWizard({ userEmail, userName, country = "IN" }: Props) {
  const [step, setStep] = useState<Step>("type")

  // Step 1
  const [adType, setAdType] = useState<DesignAdType | "">("")

  // Step 2
  const [shopName, setShopName] = useState("")
  const [tagline, setTagline] = useState("")
  const [shopDescription, setShopDescription] = useState("")
  const [brandColors, setBrandColors] = useState<string[]>(["#0f172a", "#3b82f6"])
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [referenceNotes, setReferenceNotes] = useState("")
  const logoRef = useRef<HTMLInputElement>(null)

  // Step 3
  const [variants, setVariants] = useState<CopyVariant[]>([])
  const [generatingCopy, setGeneratingCopy] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState<CopyVariant | null>(null)

  // Step 4 - payment
  const [requestId, setRequestId] = useState<string | null>(null)
  const [gateway, setGateway] = useState<IndiaGateway>("razorpay")
  const [paying, setPaying] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const isUS = country === "US"
  const pricing = adType
    ? DESIGN_SERVICE_PRICES[adType as DesignAdType]?.[isUS ? "US" : "IN"]
    : null

  // ── helpers ──────────────────────────────────────────────────────────────

  function addColor() {
    if (brandColors.length < 4) setBrandColors((p) => [...p, "#ffffff"])
  }
  function updateColor(i: number, v: string) {
    setBrandColors((p) => p.map((c, idx) => (idx === i ? v : c)))
  }
  function removeColor(i: number) {
    setBrandColors((p) => p.filter((_, idx) => idx !== i))
  }

  async function saveRequestAndGetId(): Promise<string | null> {
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append("adType", adType)
      fd.append("shopName", shopName)
      fd.append("tagline", tagline)
      fd.append("shopDescription", shopDescription)
      fd.append("brandColors", JSON.stringify(brandColors))
      fd.append("referenceNotes", referenceNotes)
      if (selectedVariant) fd.append("selectedCopy", JSON.stringify(selectedVariant))
      if (logoFile) fd.append("logo", logoFile)

      const res = await fetch("/api/ads/design-request", { method: "POST", body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Failed to save request")
      return json.requestId as string
    } catch (err) {
      toast.error((err as Error).message)
      return null
    } finally {
      setSubmitting(false)
    }
  }

  async function generateCopy() {
    setGeneratingCopy(true)
    try {
      const res = await fetch("/api/ads/generate-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopName, tagline, shopDescription, adType, brandColors }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Generation failed")
      setVariants(json.variants)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setGeneratingCopy(false)
    }
  }

  async function handlePayPal() {
    setPaying(true)
    try {
      const rid = requestId ?? (await saveRequestAndGetId())
      if (!rid) { setPaying(false); return }
      setRequestId(rid)

      const res = await fetch("/api/paypal/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "design_request", adType, requestId: rid }),
      })
      const json = await res.json()
      if (!res.ok || !json.approveUrl) throw new Error(json.error ?? "Could not start checkout")
      window.location.href = json.approveUrl
    } catch (err) {
      toast.error((err as Error).message)
      setPaying(false)
    }
  }

  async function handlePayU() {
    setPaying(true)
    try {
      const rid = requestId ?? (await saveRequestAndGetId())
      if (!rid) { setPaying(false); return }
      setRequestId(rid)

      const res = await fetch("/api/payu/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "design_request", adType, requestId: rid }),
      })
      const json = await res.json()
      if (!res.ok || !json.fields) throw new Error(json.error ?? "Could not start PayU checkout")
      submitPayUForm(json.fields, json.formUrl)
    } catch (err) {
      toast.error((err as Error).message)
      setPaying(false)
    }
  }

  async function handleRazorpay() {
    setPaying(true)
    try {
      const rid = requestId ?? (await saveRequestAndGetId())
      if (!rid) { setPaying(false); return }
      setRequestId(rid)

      const orderRes = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "design_request", adType, requestId: rid }),
      })
      if (!orderRes.ok) throw new Error("Failed to create order")
      const orderData = await orderRes.json()
      if (!window.Razorpay) throw new Error("Razorpay SDK not loaded")

      const rzp = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "AutoVision Pro",
        description: `Ad Creative Design — ${adType.replace(/_/g, " ")}`,
        order_id: orderData.orderId,
        prefill: { name: userName, email: userEmail },
        theme: { color: "#0f172a" },
        handler: async (response: {
          razorpay_order_id: string
          razorpay_payment_id: string
          razorpay_signature: string
        }) => {
          try {
            const vRes = await fetch("/api/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...response, kind: "design_request", requestId: rid }),
            })
            if (!vRes.ok) throw new Error("Verification failed")
            toast.success("Payment successful!")
            setStep("done")
          } catch {
            toast.error("Payment verification failed")
            setPaying(false)
          }
        },
        modal: {
          ondismiss: () => {
            setPaying(false)
            toast.error("Payment cancelled")
          },
        },
      })
      rzp.open()
    } catch (err) {
      toast.error((err as Error).message)
      setPaying(false)
    }
  }

  // ── step renders ──────────────────────────────────────────────────────────

  if (step === "done") {
    return (
      <div className="rounded-2xl border border-green-500/30 bg-green-500/5 p-10 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-green-500" />
        <h3 className="mt-4 text-xl font-bold">Design request submitted!</h3>
        <p className="mt-2 text-muted-foreground max-w-sm mx-auto">
          Our team will create your ad creative and deliver it within{" "}
          <strong>2–3 business days</strong>. You can track the status in the{" "}
          <strong>Design Service</strong> tab.
        </p>
      </div>
    )
  }

  return (
    <>
      {!isUS && <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />}

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8 text-sm">
        {(["type", "brief", "copy", "pay"] as Step[]).map((s, i) => {
          const labels = ["Ad Type", "Brand Brief", "Copy Ideas", "Pay"]
          const stepIndex = ["type", "brief", "copy", "pay"].indexOf(step)
          const done = i < stepIndex
          const active = s === step
          return (
            <div key={s} className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  active ? "bg-primary text-primary-foreground" : done ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
                )}
              >
                {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className={cn("hidden sm:inline", active ? "font-medium" : "text-muted-foreground")}>{labels[i]}</span>
              {i < 3 && <span className="text-muted-foreground/40">›</span>}
            </div>
          )
        })}
      </div>

      {/* Step 1 — Ad Type */}
      {step === "type" && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold">Choose your ad format</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Our team will design a professional creative at the exact dimensions for your chosen format.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {DESIGNABLE_TYPES.map((a) => {
              const dPrice = DESIGN_SERVICE_PRICES[a.id as DesignAdType]?.[isUS ? "US" : "IN"]
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setAdType(a.id as DesignAdType)}
                  className={cn(
                    "rounded-xl border p-5 text-left transition-all",
                    adType === a.id
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border/50 bg-card/60 hover:border-primary/40"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{a.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{a.dimensions}</p>
                    </div>
                    {adType === a.id && <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{a.description}</p>
                  {dPrice && (
                    <p className="mt-3 text-lg font-bold text-primary">
                      {formatPrice(dPrice.amount, dPrice.currency)}
                      <span className="text-xs font-normal text-muted-foreground ml-1">design fee</span>
                    </p>
                  )}
                </button>
              )
            })}
          </div>
          <Button disabled={!adType} onClick={() => setStep("brief")} className="gap-2">
            Continue <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Step 2 — Brand Brief */}
      {step === "brief" && (
        <div className="space-y-5">
          <div>
            <h3 className="text-lg font-semibold">Tell us about your brand</h3>
            <p className="text-sm text-muted-foreground mt-1">
              The more detail you give us, the better your creative will be.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Shop / Brand Name <span className="text-destructive">*</span></Label>
            <Input value={shopName} onChange={(e) => setShopName(e.target.value)} placeholder="e.g. SpeedWrap Studios" />
          </div>

          <div className="space-y-1.5">
            <Label>Tagline <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="e.g. India's fastest wraps" />
          </div>

          <div className="space-y-1.5">
            <Label>What do you want to promote? <span className="text-destructive">*</span></Label>
            <Textarea
              rows={3}
              value={shopDescription}
              onChange={(e) => setShopDescription(e.target.value)}
              placeholder="Describe your services, offers, or what makes you special..."
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Palette className="h-4 w-4" /> Brand Colors
            </Label>
            <div className="flex flex-wrap gap-3 items-center">
              {brandColors.map((c, i) => (
                <div key={i} className="relative group">
                  <input
                    type="color"
                    value={c}
                    onChange={(e) => updateColor(i, e.target.value)}
                    className="h-10 w-10 rounded-lg border cursor-pointer"
                  />
                  {brandColors.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeColor(i)}
                      className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  )}
                </div>
              ))}
              {brandColors.length < 4 && (
                <Button type="button" variant="outline" size="sm" onClick={addColor}>+ Add</Button>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Logo <span className="text-muted-foreground text-xs">(optional)</span></Label>
            {logoFile ? (
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                <img src={URL.createObjectURL(logoFile)} alt="logo" className="h-10 w-10 object-contain rounded" />
                <span className="text-sm truncate flex-1">{logoFile.name}</span>
                <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => setLogoFile(null)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => logoRef.current?.click()}
                className="flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 text-center hover:border-primary/40 transition-colors"
              >
                <Upload className="h-6 w-6 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Click to upload PNG or SVG logo</span>
              </button>
            )}
            <input ref={logoRef} type="file" accept="image/png,image/svg+xml,image/jpeg" className="hidden" onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)} />
          </div>

          <div className="space-y-1.5">
            <Label>Additional notes <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Textarea
              rows={2}
              value={referenceNotes}
              onChange={(e) => setReferenceNotes(e.target.value)}
              placeholder="Any specific style, references, or things to avoid..."
            />
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep("type")} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button disabled={!shopName || !shopDescription} onClick={() => setStep("copy")} className="gap-2">
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3 — AI Copy */}
      {step === "copy" && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold">AI copy ideas</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Generate headline + copy suggestions from your brief, then choose your favourite. You can also skip this and let us decide.
            </p>
          </div>

          {variants.length === 0 ? (
            <Button onClick={generateCopy} disabled={generatingCopy} className="gap-2" variant="outline">
              {generatingCopy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {generatingCopy ? "Generating..." : "Generate copy ideas"}
            </Button>
          ) : (
            <div className="space-y-3">
              {variants.map((v, i) => (
                <Card
                  key={i}
                  onClick={() => setSelectedVariant(selectedVariant === v ? null : v)}
                  className={cn(
                    "cursor-pointer transition-all",
                    selectedVariant === v ? "border-primary bg-primary/5" : "hover:border-primary/40"
                  )}
                >
                  <CardContent className="p-4 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">{v.headline}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">{v.subtext}</p>
                        <Badge variant="secondary" className="mt-2 text-xs">{v.cta}</Badge>
                      </div>
                      {selectedVariant === v && <CheckCircle2 className="h-5 w-5 shrink-0 text-primary mt-0.5" />}
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Button variant="ghost" size="sm" onClick={() => { setVariants([]); setSelectedVariant(null) }} className="text-muted-foreground">
                Regenerate
              </Button>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep("brief")} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button onClick={() => setStep("pay")} className="gap-2">
              {selectedVariant ? "Continue with this copy" : "Skip & continue"} <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 4 — Payment */}
      {step === "pay" && pricing && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold">Review & Pay</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Your design brief is ready. Complete payment to submit your request.
            </p>
          </div>

          {/* Summary */}
          <div className="rounded-xl border border-border/50 bg-secondary/30 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Service</span>
              <span className="font-medium">Ad Creative Design</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Format</span>
              <span className="font-medium">{AD_TYPES.find((a) => a.id === adType)?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shop name</span>
              <span className="font-medium">{shopName}</span>
            </div>
            {selectedVariant && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Selected headline</span>
                <span className="font-medium max-w-[200px] text-right">{selectedVariant.headline}</span>
              </div>
            )}
            <div className="border-t border-border/40 pt-2 flex justify-between">
              <span className="font-semibold">Total</span>
              <span className="text-xl font-bold">{formatPrice(pricing.amount, pricing.currency)}</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Expected delivery: <strong>2–3 business days</strong> · One revision included · Result delivered as high-res PNG
          </p>

          {/* Gateway selector (India only) */}
          {!isUS && (
            <IndiaGatewaySelector selected={gateway} onChange={setGateway} />
          )}

          <Button
            onClick={isUS ? handlePayPal : gateway === "payu" ? handlePayU : handleRazorpay}
            disabled={paying || submitting}
            className={cn("w-full", isUS && "bg-[#0070ba] hover:bg-[#003087] text-white")}
            size="lg"
          >
            {paying || submitting
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isUS ? "Redirecting to PayPal…" : gateway === "payu" ? "Redirecting to PayU…" : "Processing…"}
                </>
              : <><CreditCard className="mr-2 h-4 w-4" />Pay {formatPrice(pricing.amount, pricing.currency)}</>
            }
          </Button>

          <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setStep("copy")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </div>
      )}
    </>
  )
}
