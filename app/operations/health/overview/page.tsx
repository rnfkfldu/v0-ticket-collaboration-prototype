"use client"

import React from "react"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  ChevronRight,
  Flame,
  ThermometerSun,
  Shield,
  Calendar,
  BarChart3,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useUser } from "@/lib/user-context"

// --- Mock data ---
type AccelStatus = "accelerating" | "stable" | "improving"
type DegType = "Deposition" | "Catalyst Performance" | "Integrity Risk"

interface DegradationUnit {
  id: string
  unit: string
  equipment: string
  degradationType: DegType
  subType: string
  currentIndex: number
  maxIndex: number
  slope1w: number
  slope1m: number
  acceleration: AccelStatus
  eta: string
  etaDays: number
  lastEvent: string
  lastEventDate: string
  dataConfidence: "good" | "partial" | "missing"
}

const UNITS: DegradationUnit[] = [
  { id: "D-001", unit: "HCR", equipment: "HC-R1/R2 Catalyst", degradationType: "Catalyst Performance", subType: "Aging", currentIndex: 72, maxIndex: 100, slope1w: 0.8, slope1m: 0.6, acceleration: "accelerating", eta: "2025-09-15", etaDays: 225, lastEvent: "Catalyst Loading", lastEventDate: "2023-06-15", dataConfidence: "good" },
  { id: "D-002", unit: "HCR", equipment: "E-2001 Feed/Effluent HX", degradationType: "Deposition", subType: "Fouling", currentIndex: 55, maxIndex: 100, slope1w: 1.5, slope1m: 1.2, acceleration: "accelerating", eta: "2025-06-20", etaDays: 138, lastEvent: "Chemical Cleaning", lastEventDate: "2024-08-10", dataConfidence: "good" },
  { id: "D-003", unit: "CDU", equipment: "Column Packing (PA Section)", degradationType: "Deposition", subType: "Fouling", currentIndex: 38, maxIndex: 100, slope1w: 0.5, slope1m: 0.4, acceleration: "stable", eta: "2026-03-01", etaDays: 392, lastEvent: "TA Cleaning", lastEventDate: "2024-01-15", dataConfidence: "good" },
  { id: "D-004", unit: "HDS", equipment: "HDS Catalyst Bed", degradationType: "Catalyst Performance", subType: "Aging", currentIndex: 82, maxIndex: 100, slope1w: 1.2, slope1m: 1.0, acceleration: "accelerating", eta: "2025-05-10", etaDays: 92, lastEvent: "Catalyst Loading", lastEventDate: "2022-12-01", dataConfidence: "good" },
  { id: "D-005", unit: "VDU", equipment: "VDU Heater Tubes", degradationType: "Deposition", subType: "Coking", currentIndex: 45, maxIndex: 100, slope1w: 0.3, slope1m: 0.35, acceleration: "stable", eta: "2026-08-01", etaDays: 545, lastEvent: "Decoking", lastEventDate: "2024-06-01", dataConfidence: "partial" },
  { id: "D-006", unit: "CCR", equipment: "Reforming Catalyst", degradationType: "Catalyst Performance", subType: "Aging", currentIndex: 25, maxIndex: 100, slope1w: 0.2, slope1m: 0.2, acceleration: "improving", eta: "2027-06-01", etaDays: 850, lastEvent: "Catalyst Regen", lastEventDate: "2024-11-01", dataConfidence: "good" },
  { id: "D-007", unit: "CDU", equipment: "CDU Overhead System", degradationType: "Integrity Risk", subType: "Corrosion", currentIndex: 30, maxIndex: 100, slope1w: 0.15, slope1m: 0.12, acceleration: "stable", eta: "2027-01-01", etaDays: 695, lastEvent: "UT Inspection", lastEventDate: "2024-09-20", dataConfidence: "partial" },
  { id: "D-008", unit: "HCR", equipment: "E-2002 Product Cooler", degradationType: "Deposition", subType: "Fouling", currentIndex: 32, maxIndex: 100, slope1w: 0.4, slope1m: 0.5, acceleration: "stable", eta: "2026-05-01", etaDays: 454, lastEvent: "Chemical Cleaning", lastEventDate: "2024-10-05", dataConfidence: "good" },
]

const ACCEL_CONFIG: Record<AccelStatus, { label: string; color: string; bg: string }> = {
  accelerating: { label: "Accelerating", color: "text-red-700", bg: "bg-red-100 border-red-200" },
  stable: { label: "Stable", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  improving: { label: "Improving", color: "text-green-700", bg: "bg-green-100 border-green-200" },
}

const TYPE_ICON: Record<DegType, React.ElementType> = {
  Deposition: Flame,
  "Catalyst Performance": ThermometerSun,
  "Integrity Risk": Shield,
}

const TYPE_COLOR: Record<DegType, string> = {
  Deposition: "text-orange-600",
  "Catalyst Performance": "text-blue-600",
  "Integrity Risk": "text-slate-500",
}

export default function OverviewPage() {
  const [sortBy, setSortBy] = useState<"eta" | "speed" | "acceleration">("eta")
  const [filterType, setFilterType] = useState<"all" | DegType>("all")
  const { visibleProcesses, scopeMode, currentUser } = useUser()

  // Filter UNITS based on scope (visible processes)
  const visibleUnitNames = new Set(visibleProcesses.map(p => {
    if (p.id.includes("CDU")) return "CDU"
    if (p.id.includes("VDU")) return "VDU"
    if (p.id.includes("HDS")) return "HDS"
    if (p.id.includes("CCR")) return "CCR"
    if (p.id === "HCR") return "HCR"
    return p.id
  }))

  const scopedUnits = scopeMode === "my-processes"
    ? UNITS.filter(u => visibleUnitNames.has(u.unit))
    : UNITS

  const filtered = scopedUnits.filter((u) => filterType === "all" || u.degradationType === filterType)

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "eta") return a.etaDays - b.etaDays
    if (sortBy === "speed") return b.slope1m - a.slope1m
    const order: Record<AccelStatus, number> = { accelerating: 0, stable: 1, improving: 2 }
    return order[a.acceleration] - order[b.acceleration]
  })

  // Summary stats
  const acceleratingCount = scopedUnits.filter((u) => u.acceleration === "accelerating").length
  const criticalEta = scopedUnits.filter((u) => u.etaDays < 180).length
  const avgIndex = Math.round(scopedUnits.reduce((s, u) => s + u.currentIndex, 0) / (scopedUnits.length || 1))

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground text-balance">Long-Term Health Overview</h1>
            <p className="text-muted-foreground mt-1">
              {scopeMode === "my-processes" 
                ? `${currentUser.roleLabel} ${currentUser.name} - 담당 공정 열화 현황 (${scopedUnits.length}건)`
                : `전체 유닛 장기 열화 현황 및 리스크 랭킹 (${scopedUnits.length}건)`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filterType} onValueChange={(v) => setFilterType(v as typeof filterType)}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="전체 유형" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 유형</SelectItem>
                <SelectItem value="Deposition">Deposition</SelectItem>
                <SelectItem value="Catalyst Performance">Catalyst Performance</SelectItem>
                <SelectItem value="Integrity Risk">Integrity Risk</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="eta">ETA 빠른 순</SelectItem>
                <SelectItem value="speed">열화 속도 순</SelectItem>
                <SelectItem value="acceleration">가속 우선</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">모니터링 항목</p>
                  <p className="text-3xl font-bold mt-1">{UNITS.length}</p>
                </div>
                <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-red-200">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">가속 열화 항목</p>
                  <p className="text-3xl font-bold mt-1 text-red-600">{acceleratingCount}</p>
                </div>
                <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <ArrowUpRight className="h-5 w-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-amber-200">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{'ETA < 6개월'}</p>
                  <p className="text-3xl font-bold mt-1 text-amber-600">{criticalEta}</p>
                </div>
                <div className="h-10 w-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">평균 Degradation Index</p>
                  <p className="text-3xl font-bold mt-1">{avgIndex}%</p>
                </div>
                <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Degradation Ranking</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-[60px_120px_1fr_140px_180px_100px_100px_120px_100px_90px] bg-muted/50 px-4 py-2.5 text-xs font-medium text-muted-foreground border-b">
                <span>#</span>
                <span>Unit</span>
                <span>Equipment</span>
                <span>Degradation Type</span>
                <span>Current Index</span>
                <span>1W Slope</span>
                <span>1M Slope</span>
                <span>Acceleration</span>
                <span>ETA</span>
                <span>Data</span>
              </div>
              {/* Rows */}
              {sorted.map((item, idx) => {
                const Icon = TYPE_ICON[item.degradationType]
                const accel = ACCEL_CONFIG[item.acceleration]
                return (
                  <Link
                    key={item.id}
                    href={`/operations/health/degradation?unit=${item.unit}&equipment=${encodeURIComponent(item.equipment)}&type=${encodeURIComponent(item.degradationType)}`}
                    className={cn(
                      "grid grid-cols-[60px_120px_1fr_140px_180px_100px_100px_120px_100px_90px] px-4 py-3 items-center text-sm border-b last:border-b-0 hover:bg-muted/30 transition-colors cursor-pointer",
                      item.acceleration === "accelerating" && "bg-red-50/30"
                    )}
                  >
                    <span className="text-muted-foreground font-mono">{idx + 1}</span>
                    <Badge variant="outline" className="w-fit">{item.unit}</Badge>
                    <div className="flex items-center gap-2">
                      <Icon className={cn("h-4 w-4 shrink-0", TYPE_COLOR[item.degradationType])} />
                      <span className="font-medium truncate">{item.equipment}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">{item.degradationType}</span>
                      <span className="text-xs text-muted-foreground block">{item.subType}</span>
                    </div>
                    {/* Index bar */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            item.currentIndex > 70 ? "bg-red-500" : item.currentIndex > 50 ? "bg-amber-500" : "bg-green-500"
                          )}
                          style={{ width: `${item.currentIndex}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs w-10 text-right">{item.currentIndex}%</span>
                    </div>
                    <span className={cn("font-mono text-xs", item.slope1w > 1 ? "text-red-600" : "text-muted-foreground")}>
                      +{item.slope1w.toFixed(1)}%/w
                    </span>
                    <span className={cn("font-mono text-xs", item.slope1m > 0.8 ? "text-red-600" : "text-muted-foreground")}>
                      +{item.slope1m.toFixed(1)}%/m
                    </span>
                    <Badge variant="outline" className={cn("text-xs w-fit", accel.bg, accel.color)}>
                      {accel.label}
                    </Badge>
                    <div>
                      <span className={cn(
                        "font-mono text-xs font-medium",
                        item.etaDays < 180 ? "text-red-600" : item.etaDays < 365 ? "text-amber-600" : "text-muted-foreground"
                      )}>
                        {item.etaDays}d
                      </span>
                      <span className="text-xs text-muted-foreground block">{item.eta}</span>
                    </div>
                    <Badge variant="outline" className={cn(
                      "text-xs w-fit",
                      item.dataConfidence === "good" ? "text-green-600 border-green-200" :
                        item.dataConfidence === "partial" ? "text-amber-600 border-amber-200" :
                          "text-red-600 border-red-200"
                    )}>
                      {item.dataConfidence === "good" ? "Good" : item.dataConfidence === "partial" ? "Partial" : "Missing"}
                    </Badge>
                  </Link>
                )
              })}
            </div>
            <div className="mt-3 flex items-center gap-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><Flame className="h-3.5 w-3.5 text-orange-600" /> Deposition (Fouling/Coking)</span>
              <span className="flex items-center gap-1.5"><ThermometerSun className="h-3.5 w-3.5 text-blue-600" /> Catalyst Performance (Aging)</span>
              <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-slate-500" /> Integrity Risk</span>
            </div>
          </CardContent>
        </Card>

        {/* Last Events Timeline */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              최근 정비/이벤트 이력
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-3">
              {UNITS.filter((u) => u.etaDays < 400).sort((a, b) => new Date(b.lastEventDate).getTime() - new Date(a.lastEventDate).getTime()).slice(0, 4).map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                    item.degradationType === "Deposition" ? "bg-orange-100 text-orange-600" :
                      item.degradationType === "Catalyst Performance" ? "bg-blue-100 text-blue-600" :
                        "bg-slate-100 text-slate-500"
                  )}>
                    {React.createElement(TYPE_ICON[item.degradationType], { className: "h-4 w-4" })}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.equipment}</p>
                    <p className="text-xs text-muted-foreground">{item.lastEvent}</p>
                    <p className="text-xs text-muted-foreground">{item.lastEventDate}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
