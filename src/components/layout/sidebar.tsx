"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  FileText,
  BarChart3,
  Settings,
} from "lucide-react"

interface SidebarProps {
  session: any
}

export function Sidebar({ session }: SidebarProps) {
  const pathname = usePathname()
  const userRole = session?.user?.role || ""

  // Dynamic dashboard based on role
  const dashboardPath = `/${userRole}`

  const navigation = [
    { name: "Dashboard", href: dashboardPath, icon: LayoutDashboard, roles: ["admin", "hod", "faculty"] },
    { name: "Courses", href: "/courses", icon: GraduationCap, roles: ["admin", "hod", "faculty"] },
    { name: "Students", href: "/students", icon: Users, roles: ["admin", "hod", "faculty"] },
    { name: "Assessments", href: "/assessments", icon: FileText, roles: ["admin", "hod", "faculty"] },
    { name: "Reports", href: "/reports", icon: BarChart3, roles: ["admin", "hod"] },
    { name: "Settings", href: "/settings", icon: Settings, roles: ["admin"] },
  ]

  const filteredNavigation = navigation.filter((item) =>
    item.roles.includes(userRole)
  )

  return (
    <aside className="w-64 border-r bg-white">
      <div className="flex h-full flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-primary">OBEP</h1>
          <p className="text-xs text-muted-foreground">Outcome Based Education</p>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-slate-100 hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="border-t p-4">
          <div className="text-xs text-muted-foreground">
            <p className="font-medium">{session?.user?.name}</p>
            <p className="capitalize">{userRole}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
