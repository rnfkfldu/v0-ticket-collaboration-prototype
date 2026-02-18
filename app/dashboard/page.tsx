import { TeamDashboard } from "@/components/team-dashboard"
import { AppShell } from "@/components/app-shell"

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="px-6 py-4">
            <h1 className="text-lg font-semibold text-foreground">팀 대시보드</h1>
          </div>
        </header>
        <main className="p-6">
          <TeamDashboard />
        </main>
      </div>
    </AppShell>
  )
}
