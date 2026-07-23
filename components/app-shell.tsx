"use client"

import type { ReactNode } from "react"
import { Sidebar } from "./sidebar"
import { TopNavigation } from "./top-navigation"
import { FloatingQuickAccess } from "./floating-quick-access"

interface AppShellProps {
  children: ReactNode
  showSidebar?: boolean
  showTopNav?: boolean
}

export function AppShell({ children, showSidebar = true, showTopNav = true }: AppShellProps) {
  if (!showSidebar && !showTopNav) {
    return <>{children}</>
  }
  
  return (
    <div className="flex flex-col h-screen">
      {showTopNav && <TopNavigation />}
      <div className="flex flex-1 overflow-hidden">
        {showSidebar && <Sidebar unreadAlerts={3} />}
        <main className="flex-1 overflow-auto bg-background">
          {children}
        </main>
      </div>
      <FloatingQuickAccess />
    </div>
  )
}
