"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Globe, Smartphone, Search, Zap, Shield, Headphones,
  CheckCircle2, ArrowRight, Star
} from "lucide-react"

const FEATURES = [
  {
    icon: Globe,
    title: "Custom Design",
    desc: "A unique website tailored to your brand — not a generic template. We design around your logo, colours, and services.",
  },
  {
    icon: Smartphone,
    title: "Mobile-First",
    desc: "Over 60% of car-related searches happen on phones. Your site will look perfect on every screen size.",
  },
  {
    icon: Search,
    title: "SEO Ready",
    desc: "On-page SEO, fast load times, structured data, and Google Business integration to help local customers find you.",
  },
  {
    icon: Zap,
    title: "Fast & Reliable",
    desc: "Hosted on global CDN infrastructure with 99.9% uptime SLA. Your site loads in under 2 seconds, anywhere.",
  },
  {
    icon: Shield,
    title: "Secure & Maintained",
    desc: "Free SSL certificate, automatic updates, monthly security patches — all included in your subscription.",
  },
  {
    icon: Headphones,
    title: "Dedicated Support",
    desc: "Need to update your hours, add a new service, or change photos? Just email us — we handle it within 2 business days.",
  },
]

const WHATS_INCLUDED = [
  "Up to 8-page custom website",
  "Mobile-responsive design",
  "Contact form + WhatsApp integration",
  "Google Maps embed",
  "Basic SEO optimisation",
  "SSL certificate (HTTPS)",
  "Monthly content updates (up to 2/month)",
  "Hosting & domain management",
  "Google Analytics setup",
  "1 revision per quarter",
]

const TESTIMONIALS = [
  {
    quote: "Within 3 weeks of launching my new site, I was getting 5–6 new wrap enquiries per week directly from Google.",
    author: "Rajesh K.",
    role: "Wrap Shop Owner, Bangalore",
  },
  {
    quote: "The team understood exactly what a detailing studio needs — before & after photos, service menus, booking links. It all just works.",
    author: "Priya M.",
    role: "Auto Detailing Studio, Mumbai",
  },
]

const BUSINESS_TYPES = [
  "Wrap Shop / Vinyl Studio",
  "Auto Detailing",
  "Car Dealership",
  "Accessories Shop",
  "Tyre & Wheel Shop",
  "Auto Repair Garage",
  "Car Photography",
  "Other",
]

const PRICING = {
  IN: { standard: "₹2,999/mo", premium: "₹4,499/mo", hero: "₹2,999", sub: "Standard" },
  US: { standard: "$99/mo",    premium: "$149/mo",    hero: "$99",     sub: "Standard" },
}

export default function WebsiteServicePage() {
  const [form, setForm] = useState({
    name: "", email: "", businessName: "", businessType: BUSINESS_TYPES[0],
    phone: "", currentWebsite: "", requirements: "", budget: "standard",
  })
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState("")
  const [country, setCountry] = useState<"IN" | "US">("IN")

  useEffect(() => {
    fetch("/api/geo").then(r => r.json()).then(d => {
      if (d.country === "US") setCountry("US")
    }).catch(() => {})
  }, [])

  const p = PRICING[country]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError("")
    try {
      const res = await fetch("/api/contact/website-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Submission failed")
      setDone(true)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">

        {/* Hero */}
        <section className="py-20 sm:py-32 border-b border-border/40">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
              <Globe className="h-4 w-4" />
              Website Building Service
            </span>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl text-balance">
              A Professional Website for Your{" "}
              <span className="text-primary">Auto Business</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
              We design, build, and maintain a custom website for your wrap shop, detailing studio, or dealership — starting at {p.standard}. No agency fees, no tech headaches.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <a href="#inquire">
                <Button size="lg" className="gap-2">
                  Get started — {p.standard} <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
              <Link href="/faq#website">
                <Button size="lg" variant="outline">Read the FAQ</Button>
              </Link>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">Cancel anytime · No setup fee</p>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Everything you need, nothing you don't</h2>
              <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
                We've built websites for dozens of automotive businesses. We know what converts visitors into customers.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <div key={f.title} className="rounded-xl border border-border/50 bg-card/60 p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What's included */}
        <section className="py-20 sm:py-28 bg-muted/30 border-y border-border/40">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-start">
              <div>
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">What's included</h2>
                <p className="mt-3 text-muted-foreground">Every subscription includes:</p>
                <ul className="mt-6 space-y-3">
                  {WHATS_INCLUDED.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background p-8">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Starting from</p>
                  <div className="mt-2">
                    <span className="text-5xl font-bold">{p.hero}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <div className="mt-6 space-y-2 text-left text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <span>No setup fee</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <span>First website delivered within 10 business days</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <span>Cancel anytime — no lock-in</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <span>30-day satisfaction guarantee on first month</span>
                    </div>
                  </div>
                  <a href="#inquire" className="mt-6 block">
                    <Button className="w-full gap-2">
                      Get your website <ArrowRight className="h-4 w-4" />
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold tracking-tight text-center mb-10">What our clients say</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {TESTIMONIALS.map((t, i) => (
                <div key={i} className="rounded-xl border border-border/50 bg-card/60 p-6">
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">"{t.quote}"</p>
                  <div className="mt-4">
                    <p className="text-sm font-medium">{t.author}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Inquiry form */}
        <section id="inquire" className="py-20 sm:py-28 bg-muted/30 border-t border-border/40">
          <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Get your website</h2>
              <p className="mt-3 text-muted-foreground">
                Fill out the form below and we'll get back to you within 1 business day with a plan.
              </p>
            </div>

            {done ? (
              <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-border/50 bg-card/60 px-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                  <CheckCircle2 className="h-7 w-7 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-bold">Inquiry received!</h3>
                <p className="mt-2 text-muted-foreground">We'll review your requirements and get back to you within 1 business day.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="rounded-xl border border-border/50 bg-card/60 p-6 sm:p-8 space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Your name *</Label>
                    <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Rajesh Kumar" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email address *</Label>
                    <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="rajesh@example.com" required />
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="businessName">Business name *</Label>
                    <Input id="businessName" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} placeholder="Speed Wraps Bangalore" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Phone (optional)</Label>
                    <Input id="phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="businessType">Type of business</Label>
                  <select
                    id="businessType"
                    value={form.businessType}
                    onChange={(e) => setForm({ ...form, businessType: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {BUSINESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="currentWebsite">Current website (if any)</Label>
                  <Input id="currentWebsite" type="url" value={form.currentWebsite} onChange={(e) => setForm({ ...form, currentWebsite: e.target.value })} placeholder="https://example.com" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="requirements">What do you need on your website? *</Label>
                  <Textarea
                    id="requirements"
                    value={form.requirements}
                    onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                    placeholder="E.g. Service menu, before/after gallery, booking form, contact details, Google Maps..."
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Budget preference</Label>
                  <div className="flex gap-3">
                    {[
                      { value: "standard", label: p.standard, sub: "Standard" },
                      { value: "premium", label: p.premium, sub: "Premium (more pages + priority)" },
                    ].map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex-1 cursor-pointer rounded-lg border p-3 text-center text-sm transition-all ${
                          form.budget === opt.value
                            ? "border-primary bg-primary/5"
                            : "border-border/50 bg-card/60"
                        }`}
                      >
                        <input
                          type="radio"
                          name="budget"
                          value={opt.value}
                          checked={form.budget === opt.value}
                          onChange={(e) => setForm({ ...form, budget: e.target.value })}
                          className="sr-only"
                        />
                        <div className="font-semibold">{opt.label}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{opt.sub}</div>
                      </label>
                    ))}
                  </div>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button type="submit" disabled={submitting} className="w-full gap-2">
                  {submitting ? "Submitting…" : "Submit inquiry"}
                  {!submitting && <ArrowRight className="h-4 w-4" />}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  We'll reply within 1 business day. No commitment required.
                </p>
              </form>
            )}
          </div>
        </section>

      </main>
      <Footer />
    </div>
  )
}
