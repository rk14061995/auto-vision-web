import type { Metadata } from "next"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Zap, Target, Users, Globe, Shield, Sparkles, ArrowRight } from "lucide-react"

export const metadata: Metadata = {
  title: "About AutoVision Pro — AI-Powered Car Customization",
  description: "Learn about AutoVision Pro's mission to bring AI-powered car customization tools to enthusiasts, wrap shops, and dealerships worldwide.",
}

const VALUES = [
  {
    icon: Sparkles,
    title: "AI-First Design",
    desc: "We believe every car owner deserves professional-grade design tools. Our AI makes what used to take hours of Photoshop work instant and intuitive.",
  },
  {
    icon: Target,
    title: "Built for Automotive",
    desc: "Every feature we build is purpose-designed for the automotive industry — from wrap shops needing exact part detection to dealerships running campaigns.",
  },
  {
    icon: Users,
    title: "Community Driven",
    desc: "AutoVision Pro grew from conversations with real wrap artists, detailers, and car enthusiasts. Their feedback shapes every product decision.",
  },
  {
    icon: Globe,
    title: "India & Global",
    desc: "We serve both Indian (₹) and international ($) markets with localised pricing, regional ad placements, and payment options that actually work.",
  },
  {
    icon: Shield,
    title: "Privacy by Default",
    desc: "Your car designs and client images are yours. We process them to deliver the service — never to train models or sell data.",
  },
  {
    icon: Zap,
    title: "Speed at Scale",
    desc: "Background removal in under 2 seconds, part detection in 3 — we obsess over performance so your creative workflow doesn't stall.",
  },
]

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">

        {/* Hero */}
        <section className="py-20 sm:py-32 border-b border-border/40">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-xs font-medium uppercase tracking-widest text-primary mb-4">About AutoVision Pro</p>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl text-balance">
              AI-Powered Tools for the{" "}
              <span className="text-primary">Automotive Creative</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
              AutoVision Pro was built because wrap artists, dealerships, and car enthusiasts deserved better tools — not clunky desktop software or agency fees just to visualise a colour change.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/signup">
                <Button className="gap-2">
                  Try AutoVision Pro free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline">Get in touch</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
              <div>
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Our Mission</h2>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  We are on a mission to democratise automotive design. A solo wrap artist in Hyderabad should have access to the same quality of visualisation tools as a flagship BMW dealership — without the enterprise price tag.
                </p>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  By combining Claude AI for intelligent part detection and colour generation, remove.bg for instant background removal, and a Fabric.js canvas purpose-built for cars, we have compressed what used to be a half-day of Photoshop work into a few clicks.
                </p>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  Beyond the canvas, AutoVision Pro is also a marketplace — connecting automotive businesses with a highly targeted audience of car enthusiasts through our advertising platform and creative design services.
                </p>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-primary/20 via-primary/5 to-background border border-primary/20 p-8 text-center">
                <div className="text-5xl font-bold text-primary">10k+</div>
                <div className="mt-2 text-sm text-muted-foreground">Designs created</div>
                <div className="mt-8 text-5xl font-bold text-primary">150+</div>
                <div className="mt-2 text-sm text-muted-foreground">Automotive businesses advertising</div>
                <div className="mt-8 text-5xl font-bold text-primary">2</div>
                <div className="mt-2 text-sm text-muted-foreground">Markets served — India &amp; International</div>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-20 sm:py-28 bg-muted/30 border-y border-border/40">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">What We Stand For</h2>
              <p className="mt-3 text-muted-foreground">The principles behind every product decision we make.</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {VALUES.map((v) => (
                <div key={v.title} className="rounded-xl border border-border/50 bg-card/60 p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <v.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-semibold">{v.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Ready to get started?</h2>
            <p className="mt-4 text-muted-foreground">
              Join thousands of automotive professionals already using AutoVision Pro to design, advertise, and grow their business.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/signup">
                <Button size="lg" className="gap-2">
                  Start for free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/faq">
                <Button size="lg" variant="outline">Read the FAQ</Button>
              </Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  )
}
