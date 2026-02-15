"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { Sidebar as AnimatedSidebar, SidebarBody, SidebarLink, Logo } from "@/components/ui/animated-sidebar"
import { LayoutDashboard, Brain, LogOut, Users } from "lucide-react"

const teacherLinks = [
  {
    label: "Attendance Analytics",
    href: "/dashboard",
    icon: <LayoutDashboard className="text-neutral-400 h-5 w-5 flex-shrink-0" />,
  },
  {
    label: "NEP Insights",
    href: "/dashboard/nep-insights",
    icon: <Brain className="text-neutral-400 h-5 w-5 flex-shrink-0" />,
  },
  {
    label: "Student Wise Analysis",
    href: "/dashboard/student-analysis",
    icon: <Users className="text-neutral-400 h-5 w-5 flex-shrink-0" />,
  },
]

export function TeacherSidebar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <AnimatedSidebar open={open} setOpen={setOpen}>
      <SidebarBody className="justify-between gap-10 border-r border-neutral-800">
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <Logo open={open} />
          <div className="mt-8 flex flex-col gap-2">
            {teacherLinks.map((link, idx) => (
              <SidebarLink
                key={idx}
                link={link}
                active={pathname === link.href || pathname.startsWith(link.href + "/")}
              />
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
              label: "Teacher User",
              href: "#",
              icon: (
                <div className="h-7 w-7 flex-shrink-0 rounded-full bg-neutral-700 flex items-center justify-center text-white text-xs font-medium">
                  TU
                </div>
              ),
            }}
          />
        </div>
      </SidebarBody>
    </AnimatedSidebar>
  )
}
