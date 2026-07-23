"use client"

import { AppShell } from "@/components/app-shell"
import { HomeKpiCards } from "@/components/home/home-kpi-cards"
import { ProcessOverview } from "@/components/home/process-overview"
import { HomeSidePanels } from "@/components/home/home-side-panels"
import { RefreshCw } from "lucide-react"

export default function HomePage() {
  return (
    <AppShell>
      <div className="p-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <header className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground text-balance">공정운영최적화 플랫폼</h1>
            <p className="text-sm text-muted-foreground mt-1">전사 운전 현황 종합 대시보드</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap">
            <span>최종 업데이트</span>
            <span className="font-medium text-foreground tabular-nums">2025.05.22 10:30:45</span>
            <RefreshCw className="h-4 w-4 text-primary" />
          </div>
        </header>

        {/* KPI summary */}
        <HomeKpiCards />

        {/* Main content: process overview + side panels */}
        <div className="mt-6 grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
          <ProcessOverview />
          <HomeSidePanels />
        </div>
      </div>
    </AppShell>
  )
}
