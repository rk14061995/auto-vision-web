import type { Metadata } from "next"
import Link from "next/link"
import { SignupForm } from "@/components/auth/signup-form"
import { Car, Check } from "lucide-react"

export const metadata: Metadata = {
  title: "Sign Up - AutoVision Pro",
  description: "Create your AutoVision Pro account and start designing",
}

const benefits = [
  "Design your dream car virtually",
  "Access to basic customization tools",
  "Save and share your designs",
  "No credit card required",
]

export default function SignupPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Benefits */}
      <div className="hidden flex-1 flex-col justify-center bg-card/50 px-12 lg:flex">
        <div className="max-w-md">
          <h2 className="text-3xl font-bold">
            Start designing your dream car today
          </h2>
          <p className="mt-4 text-muted-foreground">
            Join thousands of car enthusiasts who use AutoVision Pro to visualize
            their perfect vehicle.
          </p>
          <ul className="mt-8 space-y-4">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                  <Check className="h-4 w-4 text-primary" />
                </div>
                <span className="text-muted-foreground">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="flex flex-col items-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Car className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-semibold">AutoVision Pro</span>
            </Link>
            <h1 className="mt-6 text-2xl font-bold">Create your account</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Get started with your free account
            </p>
          </div>

          {/* Form */}
          <div className="rounded-xl border border-border/50 bg-card p-6 shadow-lg">
            <SignupForm />
          </div>
        </div>
      </div>
    </div>
  )
}
