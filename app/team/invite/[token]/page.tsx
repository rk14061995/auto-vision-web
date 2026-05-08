import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { AcceptInviteClient } from "./accept-client"

export const metadata = {
  title: "Accept Team Invitation — AutoVision Pro",
}

export default async function AcceptInvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const session = await auth()
  if (!session?.user?.email) {
    redirect(`/login?redirect=/team/invite/${token}`)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <AcceptInviteClient token={token} />
      </main>
      <Footer />
    </div>
  )
}
