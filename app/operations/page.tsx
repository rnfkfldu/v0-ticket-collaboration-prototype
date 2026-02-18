"use client"

import { useMemo } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  Gauge,
  BarChart3,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useUser, getProcessesByDivision, type Division } from "@/lib/user-context"

// Generate mock status for any process
function generateUnitStatus(id: string, name: string) {
  // Deterministic pseudo-random based on id hash
  const hash = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
  const statusOptions = ["normal", "normal", "normal", "warning"] as const
  const trendOptions = ["up", "stable", "down"] as const
  const status = statusOptions[hash % statusOptions.length]
  const trend = trendOptions[hash % trendOptions.length]
  const throughput = 90 + (hash % 10)
  const alerts = status === "warning" ? (hash % 3) + 1 : hash % 2 === 0 ? 0 : 0

  return {
    id,
    name,
    status,
    throughput,
    trend,
    alerts,
  }
}

const DIVISION_COLORS: Record<Division, string> = {
  Refining: "bg-blue-500",
  Chemical: "bg-emerald-500",
  Upgrading: "bg-amber-500",
}

const DIVISION_LABELS: Record<Division, string> = {
  Refining: "Refining 부문",
  Chemical: "Chemical 부문",
  Upgrading: "Upgrading 부문",
}

export default function OperationsPage() {
  const { visibleProcesses, scopeMode, currentUser, isManagement } = useUser()

  const unitStatuses = useMemo(() => 
    visibleProcesses.map(p => generateUnitStatus(p.id, p.name)),
    [visibleProcesses]
  )

  const byDivision = useMemo(() => getProcessesByDivision(visibleProcesses), [visibleProcesses])

  // Summary stats
  const normalCount = unitStatuses.filter(u => u.status === "normal").length
  const warningCount = unitStatuses.filter(u => u.status === "warning").length
  const totalAlerts = unitStatuses.reduce((s, u) => s + u.alerts, 0)
  const avgThroughput = unitStatuses.length > 0
    ? (unitStatuses.reduce((s, u) => s + u.throughput, 0) / unitStatuses.length).toFixed(1)
    : "0"

  return (
    <AppShell>
      <div className="flex flex-col h-full">
        <header className="border-b bg-background/95 backdrop-blur px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-balance">Operations Overview</h1>
              <p className="text-sm text-muted-foreground">
                {scopeMode === "my-processes"
                  ? `${currentUser.roleLabel} ${currentUser.name} - 담당 공정 ${visibleProcesses.length}개`
                  : `전체 공정 현황 (${visibleProcesses.length}개 공정)`}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Last Updated</p>
                <p className="text-sm font-medium">2025-02-04 14:32:15</p>
              </div>
              <Badge variant="outline" className="gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Live
              </Badge>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">평균 가동률</p>
                    <p className="text-2xl font-bold">{avgThroughput}%</p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Activity className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Alerts</p>
                    <p className="text-2xl font-bold text-amber-600">{totalAlerts}</p>
                  </div>
                  <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Units Normal</p>
                    <p className="text-2xl font-bold text-green-600">{normalCount}/{unitStatuses.length}</p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">주의 공정</p>
                    <p className="text-2xl font-bold text-red-600">{warningCount}</p>
                  </div>
                  <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                    <Gauge className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Management-level view: division summary */}
          {isManagement && scopeMode === "all-processes" && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              {(["Refining", "Chemical", "Upgrading"] as Division[]).map(div => {
                const divProcesses = byDivision[div]
                const divStatuses = divProcesses.map(p => generateUnitStatus(p.id, p.name))
                const divWarnings = divStatuses.filter(u => u.status === "warning").length
                return (
                  <Card key={div}>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={cn("w-3 h-3 rounded-full", DIVISION_COLORS[div])} />
                        <p className="font-semibold text-sm">{DIVISION_LABELS[div]}</p>
                        <Badge variant="outline" className="ml-auto text-xs">{divProcesses.length}개 공정</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">정상</span>
                        <span className="font-medium text-green-600">{divProcesses.length - divWarnings}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">주의</span>
                        <span className={cn("font-medium", divWarnings > 0 ? "text-amber-600" : "text-muted-foreground")}>{divWarnings}</span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Unit Status Grid */}
          {isManagement && visibleProcesses.length > 10 ? (
            // Management compact view: table-like
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  공정 현황 요약
                  <Badge variant="secondary" className="text-xs ml-2">{unitStatuses.length}개</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-[120px_100px_100px_80px_80px] bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground border-b">
                    <span>공정</span>
                    <span>부문</span>
                    <span>가동률</span>
                    <span>상태</span>
                    <span>Alerts</span>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {unitStatuses.map((unit) => {
                      const proc = visibleProcesses.find(p => p.id === unit.id)
                      return (
                        <div
                          key={unit.id}
                          className={cn(
                            "grid grid-cols-[120px_100px_100px_80px_80px] px-4 py-2.5 text-sm border-b last:border-0 items-center",
                            unit.status === "warning" && "bg-amber-50/50"
                          )}
                        >
                          <span className="font-medium">{unit.name}</span>
                          <div className="flex items-center gap-1.5">
                            <div className={cn("w-2 h-2 rounded-full", DIVISION_COLORS[proc?.division || "Refining"])} />
                            <span className="text-xs text-muted-foreground">{proc?.division}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {unit.trend === "up" && <TrendingUp className="h-3 w-3 text-green-500" />}
                            {unit.trend === "down" && <TrendingDown className="h-3 w-3 text-red-500" />}
                            <span className="font-mono text-xs">{unit.throughput}%</span>
                          </div>
                          <Badge variant={unit.status === "normal" ? "secondary" : "destructive"} className="text-xs w-fit">
                            {unit.status === "normal" ? "정상" : "주의"}
                          </Badge>
                          <span className={cn("text-xs font-mono", unit.alerts > 0 ? "text-amber-600 font-medium" : "text-muted-foreground")}>
                            {unit.alerts}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            // Engineer / small scope: detailed card view
            <div className={cn("grid gap-6", visibleProcesses.length <= 3 ? "grid-cols-1" : "grid-cols-2")}>
              {unitStatuses.map((unit) => {
                const proc = visibleProcesses.find(p => p.id === unit.id)
                return (
                  <Card key={unit.id} className={unit.status === "warning" ? "border-amber-300" : ""}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          {unit.name}
                          <Badge variant={unit.status === "normal" ? "default" : "destructive"}>
                            {unit.status === "normal" ? "정상" : "주의"}
                          </Badge>
                          <div className="flex items-center gap-1.5 ml-2">
                            <div className={cn("w-2 h-2 rounded-full", DIVISION_COLORS[proc?.division || "Refining"])} />
                            <span className="text-xs text-muted-foreground font-normal">{proc?.division}</span>
                          </div>
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          {unit.alerts > 0 && (
                            <Badge variant="outline" className="text-amber-600 border-amber-300">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {unit.alerts}
                            </Badge>
                          )}
                          <div className="flex items-center gap-1 text-sm">
                            {unit.trend === "up" && <TrendingUp className="h-4 w-4 text-green-500" />}
                            {unit.trend === "down" && <TrendingDown className="h-4 w-4 text-red-500" />}
                            {unit.trend === "stable" && <span className="text-muted-foreground">-</span>}
                            <span className="font-medium">{unit.throughput}%</span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Long-Term Health badges for this process */}
                      <div className="flex gap-2 mb-3">
                        {proc?.hasDeposition && (
                          <Badge variant="outline" className="text-xs text-orange-600 border-orange-200">Deposition</Badge>
                        )}
                        {proc?.hasCatalystPerformance && (
                          <Badge variant="outline" className="text-xs text-blue-600 border-blue-200">Catalyst</Badge>
                        )}
                        {proc?.hasIntegrityRisk && (
                          <Badge variant="outline" className="text-xs text-slate-600 border-slate-200">Integrity</Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 rounded-lg bg-muted/50">
                          <p className="text-xs text-muted-foreground">가동률</p>
                          <p className="text-sm font-medium">{unit.throughput}%</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/50">
                          <p className="text-xs text-muted-foreground">Alert</p>
                          <p className={cn("text-sm font-medium", unit.alerts > 0 ? "text-amber-600" : "")}>{unit.alerts}건</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/50">
                          <p className="text-xs text-muted-foreground">Trend</p>
                          <p className="text-sm font-medium flex items-center gap-1">
                            {unit.trend === "up" && <><TrendingUp className="h-3 w-3 text-green-500" /> 상승</>}
                            {unit.trend === "down" && <><TrendingDown className="h-3 w-3 text-red-500" /> 하락</>}
                            {unit.trend === "stable" && "안정"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </AppShell>
  )
}
