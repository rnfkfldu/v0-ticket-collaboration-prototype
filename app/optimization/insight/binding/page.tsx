"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { AlertTriangle, Clock, TrendingUp, Search, ArrowUpDown, Filter } from "lucide-react"
import { cn } from "@/lib/utils"

const BINDING_DATA = [
  { id: 1, tagId: "TI-2001", description: "HCR Reactor Inlet Temp", unit: "HCR", guideMin: 370, guideMax: 400, currentValue: 398.2, boundType: "max", bindingDuration: "18d 4h", bindingPct: 72, priority: "high", trend: "increasing" },
  { id: 2, tagId: "PI-3001", description: "CCR Regenerator Pressure", unit: "CCR", guideMin: 2.5, guideMax: 3.5, currentValue: 2.52, boundType: "min", bindingDuration: "12d 8h", bindingPct: 58, priority: "high", trend: "stable" },
  { id: 3, tagId: "FI-1001", description: "CDU Feed Flow Rate", unit: "CDU", guideMin: 800, guideMax: 1200, currentValue: 1185, boundType: "max", bindingDuration: "9d 2h", bindingPct: 45, priority: "medium", trend: "increasing" },
  { id: 4, tagId: "TI-4501", description: "VDU Column Bottom Temp", unit: "VDU", guideMin: 340, guideMax: 380, currentValue: 377.8, boundType: "max", bindingDuration: "7d 14h", bindingPct: 38, priority: "medium", trend: "stable" },
  { id: 5, tagId: "AI-2501", description: "HCR Product Sulfur", unit: "HCR", guideMin: null, guideMax: 10, currentValue: 9.4, boundType: "max", bindingDuration: "5d 6h", bindingPct: 28, priority: "medium", trend: "increasing" },
  { id: 6, tagId: "FI-3501", description: "CCR H2/HC Ratio", unit: "CCR", guideMin: 3.0, guideMax: 5.0, currentValue: 3.08, boundType: "min", bindingDuration: "3d 18h", bindingPct: 22, priority: "low", trend: "decreasing" },
  { id: 7, tagId: "PI-1201", description: "CDU Column Top Pressure", unit: "CDU", guideMin: 1.2, guideMax: 1.8, currentValue: 1.78, boundType: "max", bindingDuration: "2d 5h", bindingPct: 15, priority: "low", trend: "stable" },
]

export default function BindingConstraintPage() {
  const [unitFilter, setUnitFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState<"duration" | "priority" | "pct">("duration")

  const filtered = BINDING_DATA
    .filter(d => unitFilter === "all" || d.unit === unitFilter)
    .filter(d => d.tagId.toLowerCase().includes(search.toLowerCase()) || d.description.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "priority") {
        const p = { high: 3, medium: 2, low: 1 }
        return (p[b.priority as keyof typeof p] || 0) - (p[a.priority as keyof typeof p] || 0)
      }
      if (sortBy === "pct") return b.bindingPct - a.bindingPct
      return b.bindingPct - a.bindingPct
    })

  const stats = {
    total: BINDING_DATA.length,
    high: BINDING_DATA.filter(d => d.priority === "high").length,
    medium: BINDING_DATA.filter(d => d.priority === "medium").length,
    low: BINDING_DATA.filter(d => d.priority === "low").length,
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card px-6 py-4">
          <h1 className="text-lg font-semibold">Binding Constraint Analysis</h1>
          <p className="text-sm text-muted-foreground mt-1">Operation Guide Min/Max 근처에서 운전 중인 항목 분석 - Binding 지속 시간 기반 우선순위</p>
        </header>

        <main className="p-6 space-y-6">
          {/* 요약 카드 */}
          <div className="grid grid-cols-4 gap-4">
            <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{stats.total}</div><p className="text-xs text-muted-foreground">Total Binding Items</p></CardContent></Card>
            <Card className="border-red-200"><CardContent className="pt-4"><div className="text-2xl font-bold text-red-600">{stats.high}</div><p className="text-xs text-muted-foreground">High Priority</p></CardContent></Card>
            <Card className="border-amber-200"><CardContent className="pt-4"><div className="text-2xl font-bold text-amber-600">{stats.medium}</div><p className="text-xs text-muted-foreground">Medium Priority</p></CardContent></Card>
            <Card className="border-blue-200"><CardContent className="pt-4"><div className="text-2xl font-bold text-blue-600">{stats.low}</div><p className="text-xs text-muted-foreground">Low Priority</p></CardContent></Card>
          </div>

          {/* 필터 */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Tag ID / 항목 검색..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={unitFilter} onValueChange={setUnitFilter}>
              <SelectTrigger className="w-32"><SelectValue placeholder="Unit" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Units</SelectItem>
                <SelectItem value="CDU">CDU</SelectItem>
                <SelectItem value="VDU">VDU</SelectItem>
                <SelectItem value="HCR">HCR</SelectItem>
                <SelectItem value="CCR">CCR</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="duration">Binding 지속시간</SelectItem>
                <SelectItem value="priority">우선순위</SelectItem>
                <SelectItem value="pct">Binding 비율</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 테이블 */}
          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">우선순위</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Tag ID</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">항목</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Unit</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Guide Range</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">현재값</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Bound</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Binding 지속</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Binding %</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">추세</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(item => (
                    <tr key={item.id} className="border-b hover:bg-muted/20 transition-colors cursor-pointer">
                      <td className="p-3">
                        <Badge className={cn("text-xs", item.priority === "high" ? "bg-red-500 text-white" : item.priority === "medium" ? "bg-amber-500 text-white" : "bg-blue-500 text-white")}>{item.priority}</Badge>
                      </td>
                      <td className="p-3 font-mono text-sm">{item.tagId}</td>
                      <td className="p-3 text-sm">{item.description}</td>
                      <td className="p-3"><Badge variant="outline" className="text-xs">{item.unit}</Badge></td>
                      <td className="p-3 text-sm font-mono">{item.guideMin ?? "-"} ~ {item.guideMax ?? "-"}</td>
                      <td className="p-3">
                        <span className={cn("font-mono text-sm font-bold", item.priority === "high" ? "text-red-600" : item.priority === "medium" ? "text-amber-600" : "text-foreground")}>{item.currentValue}</span>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className={cn("text-xs", item.boundType === "max" ? "border-red-300 text-red-600" : "border-blue-300 text-blue-600")}>{item.boundType === "max" ? "Upper" : "Lower"}</Badge>
                      </td>
                      <td className="p-3"><div className="flex items-center gap-1"><Clock className="h-3 w-3 text-muted-foreground" /><span className="text-sm font-medium">{item.bindingDuration}</span></div></td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden"><div className={cn("h-full rounded-full", item.bindingPct > 60 ? "bg-red-500" : item.bindingPct > 30 ? "bg-amber-500" : "bg-blue-500")} style={{ width: `${item.bindingPct}%` }} /></div>
                          <span className="text-xs font-mono">{item.bindingPct}%</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className={cn("text-xs", item.trend === "increasing" ? "text-red-600" : item.trend === "decreasing" ? "text-green-600" : "text-muted-foreground")}>
                          {item.trend === "increasing" ? "Increasing" : item.trend === "decreasing" ? "Decreasing" : "Stable"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </main>
      </div>
    </AppShell>
  )
}
