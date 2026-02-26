"use client"

import { TeamDashboard } from "@/components/team-dashboard"
import { AppShell } from "@/components/app-shell"

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="px-6 py-4">
            <h1 className="text-lg font-semibold text-foreground">팀 업무 분석 대시보드</h1>
            <p className="text-sm text-muted-foreground mt-1">팀원별 이벤트 현황, 병목, 자산화 현황을 확인합니다</p>
          </div>
        </header>
        <main className="p-6">
          <TeamDashboard />
        </main>
      </div>
    </AppShell>
  )
}
