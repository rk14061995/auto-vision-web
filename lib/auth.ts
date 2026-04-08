import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { getUserByEmail, type User } from "./db"
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

        return {
          id: user._id?.toString() ?? "",
          email: user.email,
          name: user.name,
          country: user.country,
          planType: user.planType,
          projectLimit: user.projectLimit,
          projectsUsed: user.projectsUsed,
          subscriptionExpiry: user.subscriptionExpiry,
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.country = (user as User).country
        token.planType = (user as User).planType
        token.projectLimit = (user as User).projectLimit
        token.projectsUsed = (user as User).projectsUsed
        token.subscriptionExpiry = (user as User).subscriptionExpiry
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
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
