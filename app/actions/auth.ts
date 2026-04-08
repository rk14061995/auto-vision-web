"use server"

import { hash } from "bcryptjs"
import { createUser, getUserByEmail } from "@/lib/db"
import { signIn } from "@/lib/auth"

export async function signup(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const name = formData.get("name") as string

  if (!email || !password || !name) {
    return { error: "All fields are required" }
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" }
  }

  // Check if MongoDB is configured
  if (!process.env.MONGODB_URI) {
    return { error: "Database not configured. Please add MONGODB_URI in Settings > Vars." }
  }

  try {
    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      return { error: "Email already registered" }
    }

    const hashedPassword = await hash(password, 12)

    await createUser({
      email,
      password: hashedPassword,
      name,
      country: null,
      planType: "free",
      projectLimit: 1,
      projectsUsed: 0,
      subscriptionExpiry: null,
      lemonSqueezyCustomerId: null,
      lemonSqueezySubscriptionId: null,
      razorpayCustomerId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return { success: true }
  } catch (error) {
    console.error("Signup error:", error)
    return { error: "Database connection failed. Please check MONGODB_URI configuration." }
  }
}

export async function login(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "All fields are required" }
  }

  // Check if MongoDB is configured
  if (!process.env.MONGODB_URI) {
    return { error: "Database not configured. Please add MONGODB_URI in Settings > Vars." }
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    })
    return { success: true }
  } catch {
    return { error: "Invalid email or password" }
  }
}
