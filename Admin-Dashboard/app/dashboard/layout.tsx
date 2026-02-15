"use client"

import type React from "react"
import { TeacherSidebar } from "@/components/dashboard/sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <TeacherSidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
