import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { getUserByEmail, getUserById, updateUser, type User } from "./db"
import { computeFreePlanExpiresAt } from "./subscription-access"
import { authConfig } from "./auth.config"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      country: "IN" | "US" | null
      planType: string
      projectLimit: number
      projectsUsed: number
      subscriptionExpiry: Date | null
    }
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await getUserByEmail(credentials.email as string)
        if (!user) {
          return null
        }

        const isPasswordValid = await compare(
          credentials.password as string,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        let subscriptionExpiry = user.subscriptionExpiry
        if (user.planType === "free" && !subscriptionExpiry) {
          const next = computeFreePlanExpiresAt()
          const updated = await updateUser(user.email, { subscriptionExpiry: next })
          subscriptionExpiry = updated?.subscriptionExpiry ?? next
        }

        return {
          id: user._id?.toString() ?? "",
          email: user.email,
          name: user.name,
          country: user.country,
          planType: user.planType,
          projectLimit: user.projectLimit,
          projectsUsed: user.projectsUsed,
          subscriptionExpiry,
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        const u = user as {
          id: string
          email: string
          name: string
          country: User["country"]
          planType: string
          projectLimit: number
          projectsUsed: number
          subscriptionExpiry: Date | null
        }
        token.id = u.id
        token.email = u.email
        token.name = u.name
        token.country = u.country
        token.planType = u.planType
        token.projectLimit = u.projectLimit
        token.projectsUsed = u.projectsUsed
        token.subscriptionExpiry = u.subscriptionExpiry
      }

      const email =
        typeof token.email === "string" ? token.email : undefined
      const id = typeof token.id === "string" ? token.id : undefined

      try {
        let dbUser: User | null = null
        if (email) {
          dbUser = await getUserByEmail(email)
        } else if (id) {
          dbUser = await getUserById(id)
        }
        if (dbUser) {
          if (!token.email) token.email = dbUser.email
          token.name = dbUser.name
          token.country = dbUser.country
          token.planType = dbUser.planType
          token.projectLimit = dbUser.projectLimit
          token.projectsUsed = dbUser.projectsUsed
          token.subscriptionExpiry = dbUser.subscriptionExpiry
        }
      } catch (err) {
        console.error("[auth jwt] refresh user from db failed:", err)
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        if (typeof token.email === "string") {
          session.user.email = token.email
        }
        if (typeof token.name === "string") {
          session.user.name = token.name
        }
        session.user.country = token.country as "IN" | "US" | null
        session.user.planType = token.planType as string
        session.user.projectLimit = token.projectLimit as number
        session.user.projectsUsed = token.projectsUsed as number
        session.user.subscriptionExpiry = token.subscriptionExpiry as Date | null
      }
      return session
    },
  },
  session: {
    strategy: "jwt",
  },
})
