import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { isAtLeastTier } from "@/lib/feature-flags"
import { getUserByEmail } from "@/lib/db"
import { TeamWorkspace } from "@/components/team/team-workspace"

export const metadata = {
  title: "Team — AutoVision Pro",
}

export default async function TeamPage() {
  const session = await auth()
  if (!session?.user?.email) {
    redirect("/login?redirect=/team")
  }

  const user = await getUserByEmail(session.user.email)
  const allowed = isAtLeastTier(user, "studio")

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold sm:text-3xl">Team workspace</h1>
          <p className="mt-2 text-muted-foreground">
            Invite teammates, share assets, and manage your brand kit.
          </p>

          {!allowed ? (
            <div className="mt-8 rounded-2xl border border-primary/30 bg-primary/5 p-6">
              <p className="font-medium">Studio plan required</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Upgrade to Studio to unlock 5 team seats, brand kit, and shared
                workspace.
              </p>
              <a
                href="/pricing"
                className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                See plans
              </a>
            </div>
          ) : (
            <div className="mt-8">
              <TeamWorkspace />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
