import type { NextAuthConfig } from "next-auth"

// Edge-compatible auth config (no bcrypt or Node.js crypto)
export const authConfig: NextAuthConfig = {
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  providers: [], // Providers are added in auth.ts
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isProtectedRoute = ["/dashboard", "/profile", "/checkout"].some(
        (route) => nextUrl.pathname.startsWith(route)
      )
      const isAuthRoute = ["/login", "/signup"].some((route) =>
        nextUrl.pathname.startsWith(route)
      )

      if (isProtectedRoute) {
        if (isLoggedIn) return true
        return false // Redirect to login
      }

      if (isAuthRoute && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl))
      }

      return true
    },
  },
}
