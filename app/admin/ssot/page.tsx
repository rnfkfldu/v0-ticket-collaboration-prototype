"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Database, CheckCircle, AlertTriangle, XCircle, ArrowRight,
  RefreshCw, ExternalLink, Shield, Server, Activity, Clock
} from "lucide-react"
import { cn } from "@/lib/utils"

// Data source health status
type HealthStatus = "healthy" | "warning" | "error"

interface DataSource {
  id: string
  name: string
  platform: string
  description: string
  status: HealthStatus
  lastSync: string
  matchRate?: number   // DR vs RTDB consistency %
  records?: number
}

interface KPIDefinition {
  id: string
  name: string
  description: string
  frequency: string
  owner: string
  inputs: { sourceId: string; sourceName: string; platform: string; status: HealthStatus; matchRate?: number; description: string }[]
  output: { name: string; unit: string; lastValue: string; lastUpdated: string }
  integrityBackup?: { from: string; to: string; matchRate: number; status: HealthStatus }
}

const KPI_DEFINITIONS: KPIDefinition[] = [
  {
    id: "operating-cost",
    name: "Operating Cost",
    description: "공정 운전비용 산출 - 원가 데이터와 운전 변수를 조합하여 실시간 운전비용을 계산",
    frequency: "Daily",
    owner: "기술팀",
    inputs: [
      { sourceId: "pdp-price", sourceName: "Price Data", platform: "PDP", status: "healthy", matchRate: 100, description: "원료/제품 가격, 유틸리티 단가" },
      { sourceId: "dr-opvar", sourceName: "Operating 변수", platform: "DR", status: "healthy", matchRate: 99.2, description: "유량, 온도, 압력 등 운전 변수" },
      { sourceId: "oop-opdata", sourceName: "체계화 데이터", platform: "OOP", status: "healthy", matchRate: 100, description: "운전 매뉴얼 기준값, 보정 계수" },
    ],
    output: { name: "Operating Cost", unit: "$/bbl", lastValue: "4.82", lastUpdated: "2025-02-03 06:00" },
    integrityBackup: { from: "DR", to: "OOP RTDB", matchRate: 99.2, status: "healthy" },
  },
  {
    id: "back-review",
    name: "Back Review Data",
    description: "전월 실적 대비 계획 대비 차이 분석용 데이터 세트",
    frequency: "Monthly",
    owner: "기술팀",
    inputs: [
      { sourceId: "dr-actual", sourceName: "실적 데이터", platform: "DR", status: "healthy", matchRate: 99.5, description: "일일/월간 실적 집계" },
      { sourceId: "plan-data", sourceName: "계획 데이터", platform: "OOP", status: "healthy", matchRate: 100, description: "월간 운전 계획 변수" },
      { sourceId: "pdp-price-m", sourceName: "월간 가격", platform: "PDP", status: "healthy", matchRate: 100, description: "월평균 원료/제품 가격" },
    ],
    output: { name: "Back Review", unit: "Report", lastValue: "2025-01", lastUpdated: "2025-02-01 09:00" },
    integrityBackup: { from: "DR", to: "OOP RTDB", matchRate: 99.5, status: "healthy" },
  },
  {
    id: "eii",
    name: "EII (Energy Intensity Index)",
    description: "에너지 효율 지수 - Solomon EII 기준 에너지 원단위 산출",
    frequency: "Daily",
    owner: "기술팀",
    inputs: [
      { sourceId: "dr-energy", sourceName: "DR 데이터", platform: "DR", status: "warning", matchRate: 97.8, description: "에너지 소비량, 스팀/전력/연료" },
      { sourceId: "romys-data", sourceName: "ROMYS 데이터", platform: "ROMYS", status: "healthy", matchRate: 100, description: "정유 수율 및 물질수지" },
      { sourceId: "oop-energy", sourceName: "OOP 변수 데이터", platform: "OOP", status: "healthy", matchRate: 100, description: "에너지 보정 계수, 기준값" },
    ],
    output: { name: "EII", unit: "index", lastValue: "98.4", lastUpdated: "2025-02-03 06:00" },
    integrityBackup: { from: "DR", to: "OOP RTDB", matchRate: 97.8, status: "warning" },
  },
  {
    id: "oa",
    name: "OA (Operating Availability)",
    description: "운전 가용률 - 계획 대비 실제 가동 시간 비율",
    frequency: "Daily",
    owner: "생산팀",
    inputs: [
      { sourceId: "dr-runtime", sourceName: "가동시간 데이터", platform: "DR", status: "healthy", matchRate: 99.9, description: "장치별 가동/정지 시간" },
      { sourceId: "plan-runtime", sourceName: "계획 가동시간", platform: "OOP", status: "healthy", matchRate: 100, description: "연간 계획 가동 일수" },
    ],
    output: { name: "OA", unit: "%", lastValue: "96.2", lastUpdated: "2025-02-03 06:00" },
    integrityBackup: { from: "DR", to: "OOP RTDB", matchRate: 99.9, status: "healthy" },
  },
  {
    id: "ghg",
    name: "온실가스 (GHG)",
    description: "온실가스 배출량 산출 - Scope 1/2 기준",
    frequency: "Monthly",
    owner: "환경안전팀",
    inputs: [
      { sourceId: "dr-fuel", sourceName: "연료 소비 데이터", platform: "DR", status: "healthy", matchRate: 99.1, description: "연료별 소비량 (연료유, 가스 등)" },
      { sourceId: "emission-factor", sourceName: "배출계수", platform: "OOP", status: "healthy", matchRate: 100, description: "연료별 배출계수, 산화율" },
      { sourceId: "external-ghg", sourceName: "외부 데이터", platform: "환경부", status: "healthy", matchRate: 100, description: "국가 배출계수 업데이트" },
    ],
    output: { name: "GHG", unit: "tCO2eq", lastValue: "12,450", lastUpdated: "2025-01-31 18:00" },
    integrityBackup: { from: "DR", to: "OOP RTDB", matchRate: 99.1, status: "healthy" },
  },
  {
    id: "necc",
    name: "NECC (Net Energy Cash Cost)",
    description: "순 에너지 현금비용 - 에너지 관련 순비용 산출",
    frequency: "Monthly",
    owner: "기술팀",
    inputs: [
      { sourceId: "dr-util", sourceName: "유틸리티 소비", platform: "DR", status: "error", matchRate: 94.5, description: "스팀, 전력, 냉각수 소비량" },
      { sourceId: "pdp-util-price", sourceName: "유틸리티 가격", platform: "PDP", status: "healthy", matchRate: 100, description: "유틸리티 단가" },
      { sourceId: "oop-necc", sourceName: "NECC 보정값", platform: "OOP", status: "healthy", matchRate: 100, description: "자가발전, 내부이전 보정" },
    ],
    output: { name: "NECC", unit: "$/bbl", lastValue: "1.34", lastUpdated: "2025-01-31 18:00" },
    integrityBackup: { from: "DR", to: "OOP RTDB", matchRate: 94.5, status: "error" },
  },
]

const statusIcon = (s: HealthStatus) => {
  switch (s) {
    case "healthy": return <CheckCircle className="h-3.5 w-3.5 text-green-600" />
    case "warning": return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
    case "error":   return <XCircle className="h-3.5 w-3.5 text-red-500" />
  }
}

const statusBg = (s: HealthStatus) => {
  switch (s) {
    case "healthy": return "bg-green-50 border-green-200 text-green-700"
    case "warning": return "bg-amber-50 border-amber-200 text-amber-700"
    case "error":   return "bg-red-50 border-red-200 text-red-700"
  }
}

const matchColor = (rate?: number) => {
  if (!rate) return "text-muted-foreground"
  if (rate >= 99) return "text-green-600"
  if (rate >= 97) return "text-amber-600"
  return "text-red-600"
}

export default function SSoTManagementPage() {
  const [selectedKPI, setSelectedKPI] = useState<string>("operating-cost")
  const kpi = KPI_DEFINITIONS.find(k => k.id === selectedKPI)!

  const overallHealth = KPI_DEFINITIONS.every(k => k.inputs.every(i => i.status === "healthy")) ? "healthy"
    : KPI_DEFINITIONS.some(k => k.inputs.some(i => i.status === "error")) ? "error" : "warning"

  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold">SSoT 관리</h1>
              <p className="text-sm text-muted-foreground mt-1">KPI 지표별 데이터 소스 정합성 및 산출 체계 현황</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn("gap-1", statusBg(overallHealth))}>
                {statusIcon(overallHealth)}
                {overallHealth === "healthy" ? "All Healthy" : overallHealth === "warning" ? "Warning" : "Issue Detected"}
              </Badge>
              <Button variant="outline" size="sm" className="gap-1.5 bg-transparent">
                <RefreshCw className="h-3.5 w-3.5" />
                Sync All
              </Button>
            </div>
          </div>
        </header>

        <main className="p-6">
          <div className="grid grid-cols-12 gap-6">
            {/* Left: KPI List */}
            <div className="col-span-4 space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground px-1 mb-3">KPI 지표 목록</h3>
              {KPI_DEFINITIONS.map(k => {
                const worst = k.inputs.reduce<HealthStatus>((acc, i) => i.status === "error" ? "error" : i.status === "warning" && acc !== "error" ? "warning" : acc, "healthy")
                return (
                  <button
                    key={k.id}
                    onClick={() => setSelectedKPI(k.id)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg border transition-all",
                      selectedKPI === k.id ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:bg-muted/30"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{k.name}</span>
                      {statusIcon(worst)}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="text-xs">{k.frequency}</Badge>
                      <span>{k.inputs.length}개 소스</span>
                      <span className="ml-auto font-mono">{k.output.lastValue} {k.output.unit}</span>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Right: KPI Detail */}
            <div className="col-span-8 space-y-4">
              {/* KPI Header */}
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-lg font-semibold">{kpi.name}</h2>
                      <p className="text-sm text-muted-foreground mt-1">{kpi.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold font-mono">{kpi.output.lastValue} <span className="text-sm font-normal text-muted-foreground">{kpi.output.unit}</span></p>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center justify-end gap-1">
                        <Clock className="h-3 w-3" /> {kpi.output.lastUpdated}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span>주기: <strong className="text-foreground">{kpi.frequency}</strong></span>
                    <span>담당: <strong className="text-foreground">{kpi.owner}</strong></span>
                  </div>
                </CardContent>
              </Card>

              {/* Data Flow Diagram */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    데이터 흐름 및 정합성 현황
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TooltipProvider>
                    <div className="flex items-center gap-3">
                      {/* Input Sources */}
                      <div className="flex-1 space-y-2">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Input Sources</p>
                        {kpi.inputs.map(input => (
                          <Tooltip key={input.sourceId}>
                            <TooltipTrigger asChild>
                              <div className={cn(
                                "flex items-center gap-2 p-2.5 rounded-lg border cursor-default",
                                statusBg(input.status)
                              )}>
                                {statusIcon(input.status)}
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium truncate">{input.sourceName}</p>
                                  <p className="text-xs opacity-70">{input.platform}</p>
                                </div>
                                {input.matchRate !== undefined && (
                                  <span className={cn("text-xs font-mono font-bold", matchColor(input.matchRate))}>{input.matchRate}%</span>
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="left"><p className="text-xs max-w-48">{input.description}</p></TooltipContent>
                          </Tooltip>
                        ))}
                      </div>

                      {/* Arrow */}
                      <div className="flex flex-col items-center gap-1 px-2">
                        {kpi.inputs.map((_, i) => (
                          <ArrowRight key={i} className="h-4 w-4 text-muted-foreground" />
                        ))}
                      </div>

                      {/* Output */}
                      <div className="w-40">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Output</p>
                        <div className="p-4 rounded-lg border-2 border-primary bg-primary/5 text-center">
                          <Activity className="h-6 w-6 text-primary mx-auto mb-1" />
                          <p className="text-sm font-bold">{kpi.output.name}</p>
                          <p className="text-lg font-mono font-bold mt-1">{kpi.output.lastValue}</p>
                          <p className="text-xs text-muted-foreground">{kpi.output.unit}</p>
                        </div>
                      </div>
                    </div>

                    {/* Integrity Backup */}
                    {kpi.integrityBackup && (
                      <div className={cn("mt-4 p-3 rounded-lg border flex items-center gap-3", statusBg(kpi.integrityBackup.status))}>
                        <Shield className="h-4 w-4 shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs font-medium">정합성 백업</p>
                          <p className="text-xs opacity-80">{kpi.integrityBackup.from} &rarr; {kpi.integrityBackup.to}</p>
                        </div>
                        <span className={cn("text-sm font-mono font-bold", matchColor(kpi.integrityBackup.matchRate))}>
                          {kpi.integrityBackup.matchRate}%
                        </span>
                      </div>
                    )}
                  </TooltipProvider>
                </CardContent>
              </Card>

              {/* Input Source Detail Table */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">입력 소스 상세</CardTitle>
                </CardHeader>
                <CardContent>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-medium text-muted-foreground">상태</th>
                        <th className="text-left py-2 font-medium text-muted-foreground">소스명</th>
                        <th className="text-left py-2 font-medium text-muted-foreground">플랫폼</th>
                        <th className="text-left py-2 font-medium text-muted-foreground">설명</th>
                        <th className="text-right py-2 font-medium text-muted-foreground">Match Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {kpi.inputs.map(input => (
                        <tr key={input.sourceId} className="border-b last:border-0">
                          <td className="py-2.5">{statusIcon(input.status)}</td>
                          <td className="py-2.5 font-medium">{input.sourceName}</td>
                          <td className="py-2.5"><Badge variant="outline" className="text-xs">{input.platform}</Badge></td>
                          <td className="py-2.5 text-muted-foreground text-xs">{input.description}</td>
                          <td className={cn("py-2.5 text-right font-mono font-bold", matchColor(input.matchRate))}>
                            {input.matchRate !== undefined ? `${input.matchRate}%` : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </AppShell>
  )
}
