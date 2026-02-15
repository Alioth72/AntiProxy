"use client"

import type React from "react"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { Sidebar, SidebarBody, SidebarLink, Logo } from "@/components/ui/animated-sidebar"
import { Users, Brain, Settings, LogOut } from "lucide-react"

const hodLinks = [
  {
    label: "Teacher Feedback",
    href: "/dashboard-hod",
    icon: <Users className="text-neutral-400 h-5 w-5 flex-shrink-0" />,
  },
  {
    label: "NEP Insights",
    href: "/dashboard-hod/nep-insights",
    icon: <Brain className="text-neutral-400 h-5 w-5 flex-shrink-0" />,
  },
  {
    label: "Attendance Settings",
    href: "/dashboard-hod/attendance-settings",
    icon: <Settings className="text-neutral-400 h-5 w-5 flex-shrink-0" />,
  },
]

export default function HODDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10 border-r border-neutral-800">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            <Logo open={open} />
            <div className="mt-8 flex flex-col gap-2">
              {hodLinks.map((link, idx) => (
                <SidebarLink key={idx} link={link} active={pathname === link.href} />
              ))}
            </div>
          </div>
          <div>
            <SidebarLink
              link={{
                label: "Sign Out",
                href: "/",
                icon: <LogOut className="text-neutral-400 h-5 w-5 flex-shrink-0" />,
              }}
            />
            <SidebarLink
              link={{
                label: "Dr. HOD User",
                href: "#",
                icon: (
                  <div className="h-7 w-7 flex-shrink-0 rounded-full bg-neutral-700 flex items-center justify-center text-white text-xs font-medium">
                    HU
                  </div>
                ),
              }}
            />
          </div>
        </SidebarBody>
      </Sidebar>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
