"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { LineChart, AlertTriangle, Search, DollarSign, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

const LP_VECTOR_DATA = [
  { id: 1, vectorName: "CDU Naphtha Yield", unit: "CDU", lpValue: 0.285, actualCorrelation: 0.312, deviation: 9.5, deviationDir: "over", updateBenefit: 42000000, lastUpdated: "2024-06-15", priority: "high" },
  { id: 2, vectorName: "HCR Diesel Conversion", unit: "HCR", lpValue: 0.680, actualCorrelation: 0.652, deviation: -4.1, deviationDir: "under", updateBenefit: 38000000, lastUpdated: "2024-08-20", priority: "high" },
  { id: 3, vectorName: "CCR Reformate Octane", unit: "CCR", lpValue: 98.5, actualCorrelation: 99.2, deviation: 0.7, deviationDir: "over", updateBenefit: 25000000, lastUpdated: "2024-09-10", priority: "medium" },
  { id: 4, vectorName: "VDU LVGO Cut Point", unit: "VDU", lpValue: 370, actualCorrelation: 365, deviation: -1.4, deviationDir: "under", updateBenefit: 18000000, lastUpdated: "2024-07-05", priority: "medium" },
  { id: 5, vectorName: "CDU Kerosene Flash", unit: "CDU", lpValue: 42.0, actualCorrelation: 43.8, deviation: 4.3, deviationDir: "over", updateBenefit: 12000000, lastUpdated: "2024-10-01", priority: "medium" },
  { id: 6, vectorName: "HCR H2 Consumption", unit: "HCR", lpValue: 185, actualCorrelation: 192, deviation: 3.8, deviationDir: "over", updateBenefit: 8500000, lastUpdated: "2024-11-15", priority: "low" },
  { id: 7, vectorName: "CCR LPG Yield", unit: "CCR", lpValue: 0.125, actualCorrelation: 0.128, deviation: 2.4, deviationDir: "over", updateBenefit: 5200000, lastUpdated: "2025-01-05", priority: "low" },
]

export default function LPVectorPage() {
  const [unitFilter, setUnitFilter] = useState("all")
  const [search, setSearch] = useState("")

  const filtered = LP_VECTOR_DATA
    .filter(d => unitFilter === "all" || d.unit === unitFilter)
    .filter(d => d.vectorName.toLowerCase().includes(search.toLowerCase()))

  const totalBenefit = filtered.reduce((sum, d) => sum + d.updateBenefit, 0)
  const highDeviation = filtered.filter(d => Math.abs(d.deviation) > 5).length

  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card px-6 py-4">
          <h1 className="text-lg font-semibold">LP Vector Analysis</h1>
          <p className="text-sm text-muted-foreground mt-1">LP Model Vector vs 실제 공정 Correlation 괴리 분석 - LP Vector Update 우선순위 판단</p>
        </header>

        <main className="p-6 space-y-6">
          {/* 요약 */}
          <div className="grid grid-cols-4 gap-4">
            <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{filtered.length}</div><p className="text-xs text-muted-foreground">Total LP Vectors</p></CardContent></Card>
            <Card className="border-red-200"><CardContent className="pt-4"><div className="text-2xl font-bold text-red-600">{highDeviation}</div><p className="text-xs text-muted-foreground">{'Deviation > 5%'}</p></CardContent></Card>
            <Card className="border-green-200">
              <CardContent className="pt-4">
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-2xl font-bold text-green-600">{(totalBenefit / 100000000).toFixed(1)}억원</span>
                </div>
                <p className="text-xs text-muted-foreground">Update 시 예상 수익</p>
              </CardContent>
            </Card>
            <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{filtered.filter(d => d.priority === "high").length}</div><p className="text-xs text-muted-foreground">Update 우선순위 High</p></CardContent></Card>
          </div>

          {/* 필터 */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Vector 검색..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
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
          </div>

          {/* 테이블 */}
          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">우선순위</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Vector Name</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Unit</th>
                    <th className="text-right p-3 text-xs font-medium text-muted-foreground">LP Value</th>
                    <th className="text-right p-3 text-xs font-medium text-muted-foreground">Actual Correlation</th>
                    <th className="text-right p-3 text-xs font-medium text-muted-foreground">Deviation</th>
                    <th className="text-right p-3 text-xs font-medium text-muted-foreground">Update 시 예상 수익</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Last Updated</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(item => (
                    <tr key={item.id} className="border-b hover:bg-muted/20 transition-colors">
                      <td className="p-3">
                        <Badge className={cn("text-xs", item.priority === "high" ? "bg-red-500 text-white" : item.priority === "medium" ? "bg-amber-500 text-white" : "bg-blue-500 text-white")}>{item.priority}</Badge>
                      </td>
                      <td className="p-3 text-sm font-medium">{item.vectorName}</td>
                      <td className="p-3"><Badge variant="outline" className="text-xs">{item.unit}</Badge></td>
                      <td className="p-3 text-right font-mono text-sm">{item.lpValue}</td>
                      <td className="p-3 text-right font-mono text-sm">{item.actualCorrelation}</td>
                      <td className="p-3 text-right">
                        <span className={cn("font-mono text-sm font-bold", Math.abs(item.deviation) > 5 ? "text-red-600" : Math.abs(item.deviation) > 3 ? "text-amber-600" : "text-foreground")}>
                          {item.deviation > 0 ? "+" : ""}{item.deviation}%
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono text-sm text-green-600 font-bold">{(item.updateBenefit / 100000000).toFixed(2)}억원/년</td>
                      <td className="p-3 text-sm text-muted-foreground">{item.lastUpdated}</td>
                      <td className="p-3">
                        <Button variant="outline" size="sm" className="text-xs gap-1 bg-transparent">
                          <RefreshCw className="h-3 w-3" /> Update 요청
                        </Button>
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
