import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { SessionProvider } from "next-auth/react"

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  return (
    <SessionProvider session={session}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar session={session} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header session={session} />
          <main className="flex-1 overflow-auto bg-slate-50 p-6">
            {children}
          </main>
        </div>
      </div>
    </SessionProvider>
  )
}
