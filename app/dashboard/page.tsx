"use client"

import { TeamDashboard } from "@/components/team-dashboard"
import { AppShell } from "@/components/app-shell"
import { useUser } from "@/lib/user-context"

export default function DashboardPage() {
  const { currentUser } = useUser()
  const isTeamLead = currentUser.role === "team-lead" || currentUser.role === "division-head" || currentUser.role === "plant-head"
  
  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="px-6 py-4">
            <h1 className="text-lg font-semibold text-foreground">
              {isTeamLead ? "팀 대시보드" : "내 대시보드"}
            </h1>
          </div>
        </header>
        <main className="p-6">
          <TeamDashboard />
        </main>
      </div>
    </AppShell>
  )
}
