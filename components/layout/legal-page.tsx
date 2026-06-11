import type { ReactNode } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

interface Props {
  title: string
  subtitle?: string
  lastUpdated: string
  children: ReactNode
}

export function LegalPage({ title, subtitle, lastUpdated, children }: Props) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <p className="text-xs font-medium uppercase tracking-widest text-primary mb-3">Legal</p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
            {subtitle && <p className="mt-3 text-lg text-muted-foreground">{subtitle}</p>}
            <p className="mt-4 text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
          </div>
          <div className="legal-content">
            {children}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
