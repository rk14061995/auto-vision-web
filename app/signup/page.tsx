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
  "AI-powered wrap and colour tools",
  "Save and share your designs",
  "No credit card required",
]

export default function SignupPage() {
  return (
    <div className="flex min-h-screen">

      {/* Left — brand panel */}
      <div className="hidden w-[45%] flex-col justify-between bg-primary px-12 py-10 lg:flex">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20">
            <Car className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-white">AutoVision Pro</span>
        </Link>

        <div className="max-w-sm">
          <h2 className="text-3xl font-extrabold leading-tight text-white">
            Start designing your dream car today
          </h2>
          <p className="mt-4 text-base text-white/75">
            Join thousands of car enthusiasts who use AutoVision Pro to visualize their perfect vehicle.
          </p>
          <ul className="mt-8 space-y-3">
            {benefits.map((b) => (
              <li key={b} className="flex items-center gap-3 text-sm text-white/85">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20">
                  <Check className="h-3 w-3 text-white" />
                </div>
                {b}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-white/50">&copy; {new Date().getFullYear()} AutoVision Pro</p>
      </div>

      {/* Right — form */}
      <div className="flex flex-1 flex-col items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 flex flex-col items-center lg:hidden">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Car className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">AutoVision Pro</span>
            </Link>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
            <p className="mt-1 text-sm text-gray-500">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Sign in
              </Link>
            </p>
            <div className="mt-6">
              <SignupForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
