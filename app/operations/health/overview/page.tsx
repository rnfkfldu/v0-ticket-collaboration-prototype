"use client"

import React, { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Flame, Activity, ArrowDownUp, Layers, Zap, Cog, ChevronRight, AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  type HealthCategory,
  HEALTH_CATEGORIES, PROCESSES, getEquipmentData,
} from "@/lib/health-data"
import { AppShell } from "@/components/app-shell"
import { useRouter } from "next/navigation"

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  fouling: <Flame className="h-5 w-5" />,
  coking: <Flame className="h-5 w-5" />,
  "catalyst-aging": <Activity className="h-5 w-5" />,
  hydraulics: <ArrowDownUp className="h-5 w-5" />,
  separation: <Layers className="h-5 w-5" />,
  energy: <Zap className="h-5 w-5" />,
  mechanical: <Cog className="h-5 w-5" />,
}

const CATEGORY_COLORS: Record<string, string> = {
  fouling: "from-orange-500/10 to-orange-500/5 border-orange-200",
  coking: "from-red-500/10 to-red-500/5 border-red-200",
  "catalyst-aging": "from-violet-500/10 to-violet-500/5 border-violet-200",
  hydraulics: "from-blue-500/10 to-blue-500/5 border-blue-200",
  separation: "from-cyan-500/10 to-cyan-500/5 border-cyan-200",
  energy: "from-amber-500/10 to-amber-500/5 border-amber-200",
  mechanical: "from-emerald-500/10 to-emerald-500/5 border-emerald-200",
}

export default function HealthOverviewPage() {
  const router = useRouter()
  const [processFilter, setProcessFilter] = useState<string>("all")
  const categories = Object.values(HEALTH_CATEGORIES)

  const categoryData = useMemo(() => {
    return categories.map(cat => {
      const allEquip = getEquipmentData(cat.id)
      const filtered = processFilter === "all" ? allEquip : allEquip.filter(e => e.process === processFilter)
      const red = filtered.filter(e => e.trafficLight === "red")
      const yellow = filtered.filter(e => e.trafficLight === "yellow")
      const green = filtered.filter(e => e.trafficLight === "green")
      return { ...cat, equipment: filtered, red, yellow, green, total: filtered.length }
    })
  }, [processFilter])

  const totals = useMemo(() => {
    return categoryData.reduce((acc, c) => ({
      red: acc.red + c.red.length,
      yellow: acc.yellow + c.yellow.length,
      green: acc.green + c.green.length,
      total: acc.total + c.total,
    }), { red: 0, yellow: 0, green: 0, total: 0 })
  }, [categoryData])

  return (
    <AppShell>
      <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-foreground">장기 건전성 현황</h1>
            <p className="text-sm text-muted-foreground mt-1">7개 카테고리 전체 장치의 Health Index 현황을 한눈에 확인합니다</p>
          </div>
          <Select value={processFilter} onValueChange={setProcessFilter}>
            <SelectTrigger className="w-[150px] h-8 text-xs">
              <SelectValue placeholder="공정 필터" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 공정</SelectItem>
              {PROCESSES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Global summary bar */}
        <Card className="p-4">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">전체 장치</span>
              <span className="text-lg font-bold">{totals.total}</span>
            </div>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-red-500" />
              <span className="text-sm font-medium text-red-600">{totals.red} 위험</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-amber-400" />
              <span className="text-sm font-medium text-amber-600">{totals.yellow} 주의</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-emerald-500" />
              <span className="text-sm font-medium text-emerald-600">{totals.green} 양호</span>
            </div>
            <div className="ml-auto">
              {totals.total > 0 && (
                <div className="flex h-3 w-48 rounded-full overflow-hidden bg-muted">
                  <div className="bg-red-500 transition-all" style={{ width: `${(totals.red / totals.total) * 100}%` }} />
                  <div className="bg-amber-400 transition-all" style={{ width: `${(totals.yellow / totals.total) * 100}%` }} />
                  <div className="bg-emerald-500 transition-all" style={{ width: `${(totals.green / totals.total) * 100}%` }} />
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Category cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {categoryData.map(cat => (
            <Card
              key={cat.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md border bg-gradient-to-br overflow-hidden",
                CATEGORY_COLORS[cat.id],
                cat.red.length > 0 && "ring-1 ring-red-200"
              )}
              onClick={() => router.push(`/operations/health/${cat.id}`)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-background/80 shadow-sm">
                      {CATEGORY_ICONS[cat.id]}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{cat.label}</h3>
                      <p className="text-[11px] text-muted-foreground">{cat.equipmentTypes.join(", ")}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground mt-1" />
                </div>

                <p className="text-xs text-muted-foreground mb-3">
                  Health Index: <span className="font-medium text-foreground">{cat.healthIndexName}</span> [{cat.healthIndexUnit}]
                </p>

                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                    <span className={cn("text-sm font-semibold", cat.red.length > 0 ? "text-red-600" : "text-muted-foreground")}>{cat.red.length}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <span className={cn("text-sm font-semibold", cat.yellow.length > 0 ? "text-amber-600" : "text-muted-foreground")}>{cat.yellow.length}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <span className="text-sm font-semibold text-emerald-600">{cat.green.length}</span>
                  </div>
                  <span className="text-xs text-muted-foreground ml-auto">/ {cat.total}개</span>
                </div>

                {cat.total > 0 && (
                  <div className="flex h-2 rounded-full overflow-hidden bg-background/60">
                    <div className="bg-red-500 transition-all" style={{ width: `${(cat.red.length / cat.total) * 100}%` }} />
                    <div className="bg-amber-400 transition-all" style={{ width: `${(cat.yellow.length / cat.total) * 100}%` }} />
                    <div className="bg-emerald-500 transition-all" style={{ width: `${(cat.green.length / cat.total) * 100}%` }} />
                  </div>
                )}

                {cat.red.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {cat.red.slice(0, 3).map(eq => (
                      <div key={eq.id} className="flex items-center gap-2 p-1.5 rounded bg-red-50/80 border border-red-100">
                        <AlertTriangle className="h-3 w-3 text-red-500 shrink-0" />
                        <span className="text-[11px] font-mono font-medium text-red-700">{eq.id}</span>
                        <span className="text-[11px] text-red-600 truncate">{eq.name}</span>
                        <Badge variant="outline" className="ml-auto text-[9px] h-4 border-red-200 text-red-600 shrink-0">
                          x{eq.slopeRatio.toFixed(1)}
                        </Badge>
                      </div>
                    ))}
                    {cat.red.length > 3 && (
                      <p className="text-[11px] text-red-400 text-center">+{cat.red.length - 3}개 더</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
