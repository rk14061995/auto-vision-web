import type { Metadata } from "next"
import Link from "next/link"
import { LoginForm } from "@/components/auth/login-form"
import { Car } from "lucide-react"

export const metadata: Metadata = {
  title: "Sign In - AutoVision Pro",
  description: "Sign in to your AutoVision Pro account",
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Car className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold">AutoVision Pro</span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to your account to continue
          </p>
        </div>

        {/* Form */}
        <div className="rounded-xl border border-border/50 bg-card p-6 shadow-lg">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
