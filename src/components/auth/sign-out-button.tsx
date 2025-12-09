"use client"

import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

export default function SignOutButton() {
  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: "/login" })
  }

  return (
    <Button variant="ghost" className="flex items-center gap-2" onClick={handleSignOut}>
      <LogOut className="w-5 h-5 text-gray-400" />
      Sign out
    </Button>
  )
}
