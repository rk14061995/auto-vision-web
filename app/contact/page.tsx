"use client"

import { useState } from "react"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Mail, MessageSquare, Clock, CheckCircle2 } from "lucide-react"

const CONTACT_REASONS = [
  "General question",
  "Billing / subscription",
  "Technical issue",
  "Advertising inquiry",
  "Design service",
  "Website building service",
  "Partnership",
  "Other",
]

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: CONTACT_REASONS[0], message: "" })
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError("")
    try {
      const res = await fetch("/api/contact", {
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
      <main className="flex-1 py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">

          <div className="mb-12 text-center">
            <p className="text-xs font-medium uppercase tracking-widest text-primary mb-3">Contact</p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Get in Touch</h1>
            <p className="mt-3 text-lg text-muted-foreground">
              Questions, partnership ideas, or just want to say hello — we reply within 1 business day.
            </p>
          </div>

          <div className="grid gap-10 lg:grid-cols-3">

            {/* Side info */}
            <div className="space-y-6 lg:col-span-1">
              <div className="rounded-xl border border-border/50 bg-card/60 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Mail className="h-4 w-4" />
                  </div>
                  <span className="font-medium text-sm">Email</span>
                </div>
                <a href="mailto:autovisionpro07@gmail.com" className="text-sm text-primary hover:underline break-all">
                  autovisionpro07@gmail.com
                </a>
              </div>

              <div className="rounded-xl border border-border/50 bg-card/60 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Clock className="h-4 w-4" />
                  </div>
                  <span className="font-medium text-sm">Response Time</span>
                </div>
                <p className="text-sm text-muted-foreground">Within 1 business day (Mon–Fri, 9am–6pm IST)</p>
              </div>

              <div className="rounded-xl border border-border/50 bg-card/60 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <span className="font-medium text-sm">Quick Links</span>
                </div>
                <div className="space-y-2 text-sm">
                  <Link href="/faq" className="block text-primary hover:underline">Frequently Asked Questions</Link>
                  <Link href="/refund" className="block text-primary hover:underline">Refund Policy</Link>
                  <Link href="/privacy" className="block text-primary hover:underline">Privacy Policy</Link>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-2">
              {done ? (
                <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-border/50 bg-card/60 px-8">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                    <CheckCircle2 className="h-7 w-7 text-green-600 dark:text-green-400" />
                  </div>
                  <h2 className="text-xl font-bold">Message received!</h2>
                  <p className="mt-2 text-muted-foreground">We'll get back to you within 1 business day.</p>
                  <Button className="mt-6" onClick={() => { setDone(false); setForm({ name: "", email: "", subject: CONTACT_REASONS[0], message: "" }) }}>
                    Send another message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="rounded-xl border border-border/50 bg-card/60 p-6 sm:p-8 space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="name">Your name</Label>
                      <Input
                        id="name"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Jane Smith"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email">Email address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="jane@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="subject">Subject</Label>
                    <select
                      id="subject"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {CONTACT_REASONS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Tell us how we can help..."
                      rows={6}
                      required
                    />
                    <p className="text-xs text-muted-foreground text-right">{form.message.length}/2000</p>
                  </div>

                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}

                  <Button type="submit" disabled={submitting} className="w-full">
                    {submitting ? "Sending…" : "Send message"}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
