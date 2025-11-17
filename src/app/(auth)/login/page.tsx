import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { LoginForm } from "@/components/auth/login-form"

export default async function LoginPage() {
  const session = await auth()

  if (session) {
    const role = session.user?.role || "faculty"
    redirect(`/${role}`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <LoginForm />
    </div>
  )
}
