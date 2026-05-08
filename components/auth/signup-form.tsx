"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { signup } from "@/app/actions/auth"
import { trackSignUp, trackSignUpError } from "@/lib/gtag"

export function SignupForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (password !== confirmPassword) {
      trackSignUpError("passwords_do_not_match")
      toast.error("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (password.length < 8) {
      trackSignUpError("password_too_short")
      toast.error("Password must be at least 8 characters")
      setIsLoading(false)
      return
    }

    try {
      const result = await signup(formData)

      if (result.error) {
        trackSignUpError(result.error)
        toast.error(result.error)
        return
      }

      const signInResult = await signIn("credentials", {
        email: formData.get("email") as string,
        password,
        redirect: false,
      })

      if (signInResult?.error) {
        toast.error("Account created but failed to sign in. Please log in manually.")
        router.push("/login")
        return
      }

      trackSignUp("email")
      toast.success("Account created successfully!")
      router.push("/dashboard")
      router.refresh()
    } catch {
      trackSignUpError("unexpected_error")
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="John Doe"
          required
          autoComplete="name"
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          autoComplete="email"
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="At least 8 characters"
          required
          autoComplete="new-password"
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="Re-enter your password"
          required
          autoComplete="new-password"
          disabled={isLoading}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Create Account
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  )
}
