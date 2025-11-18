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
  Layers
} from "lucide-react"
import { useState } from "react"

interface SidebarProps {
  session: any
}

export function Sidebar({ session }: SidebarProps) {
  const pathname = usePathname()
  const userRole = session?.user?.role || ""

  const dashboardPath = `/${userRole}`

  const navigation = [
    { name: "Dashboard", href: dashboardPath, icon: LayoutDashboard, roles: ["admin", "hod", "faculty"] },
    { name: "Courses", href: "/courses", icon: GraduationCap, roles: ["admin", "hod", "faculty"] },
    { name: "Students", href: "/students", icon: Users, roles: ["admin", "hod", "faculty"] },
    { name: "Classes", href: "/classes", icon: Layers, roles: ["admin", "hod", "faculty"] },  // Added Classes
    { name: "Assessments", href: "/assessments", icon: FileText, roles: ["admin", "hod", "faculty"] },
    { name: "Reports", href: "/reports", icon: BarChart3, roles: ["admin", "hod"] },
    { name: "Settings", href: "/settings", icon: Settings, roles: ["admin"] },
  ]

  const filteredNavigation = navigation.filter((item) =>
    item.roles.includes(userRole)
  )

  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        "border-r bg-white h-screen flex flex-col transition-width duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex flex-col flex-grow">
        <div className="flex items-center justify-between p-6 border-b">
          {!collapsed && (
            <div>
              <h1 className="text-2xl font-bold text-primary">OBEP</h1>
              <p className="text-xs text-muted-foreground">Outcome Based Education</p>
            </div>
          )}
          <button
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded hover:bg-slate-200 focus:outline-none focus:ring"
            type="button"
          >
            {/* Simple chevron icon */}
            {collapsed ? (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            )}
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-2">
          {filteredNavigation.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg py-2 px-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-slate-100 hover:text-foreground",
                  collapsed && "justify-center px-1"
                )}
              >
                <item.icon className="h-5 w-5" aria-hidden="true" />
                {!collapsed && item.name}
              </Link>
            )
          })}
        </nav>

        {!collapsed && (
          <div className="border-t p-4">
            <div className="text-xs text-muted-foreground">
              <p className="font-medium">{session?.user?.name}</p>
              <p className="capitalize">{userRole}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
