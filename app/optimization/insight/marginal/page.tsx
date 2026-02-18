"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { TrendingUp, DollarSign, Search, ArrowUp, ArrowDown } from "lucide-react"
import { cn } from "@/lib/utils"

const MARGINAL_DATA = [
  { id: 1, constraint: "HCR Reactor Temp Max (400C)", unit: "HCR", type: "spec", waiveUnit: "+1C", marginalValue: 285000, annualPotential: 104000000, confidence: "high", direction: "relax" },
  { id: 2, constraint: "CDU Feed Rate Max (1200 m3/h)", unit: "CDU", type: "feed", waiveUnit: "+10 m3/h", marginalValue: 180000, annualPotential: 65700000, confidence: "high", direction: "relax" },
  { id: 3, constraint: "HCR Product Sulfur Max (10ppm)", unit: "HCR", type: "spec", waiveUnit: "+1ppm", marginalValue: 125000, annualPotential: 45600000, confidence: "medium", direction: "relax" },
  { id: 4, constraint: "CCR Regenerator Pressure Min (2.5bar)", unit: "CCR", type: "process", waiveUnit: "-0.1bar", marginalValue: 95000, annualPotential: 34700000, confidence: "medium", direction: "relax" },
  { id: 5, constraint: "VDU Column Bottom Temp Max (380C)", unit: "VDU", type: "process", waiveUnit: "+5C", marginalValue: 72000, annualPotential: 26300000, confidence: "medium", direction: "relax" },
  { id: 6, constraint: "CDU Naphtha D86 EP Max (180C)", unit: "CDU", type: "spec", waiveUnit: "+2C", marginalValue: 55000, annualPotential: 20100000, confidence: "low", direction: "relax" },
  { id: 7, constraint: "CCR H2/HC Ratio Min (3.0)", unit: "CCR", type: "process", waiveUnit: "-0.1", marginalValue: 42000, annualPotential: 15300000, confidence: "low", direction: "relax" },
]

export default function MarginalValuePage() {
  const [unitFilter, setUnitFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [search, setSearch] = useState("")

  const filtered = MARGINAL_DATA
    .filter(d => unitFilter === "all" || d.unit === unitFilter)
    .filter(d => typeFilter === "all" || d.type === typeFilter)
    .filter(d => d.constraint.toLowerCase().includes(search.toLowerCase()))

  const totalAnnual = filtered.reduce((sum, d) => sum + d.annualPotential, 0)

  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card px-6 py-4">
          <h1 className="text-lg font-semibold">Marginal Value Analysis</h1>
          <p className="text-sm text-muted-foreground mt-1">Operation Guide 제약 조건을 단위만큼 Waive 시 예상 Margin - Optimization 우선순위 파악</p>
        </header>

        <main className="p-6 space-y-6">
          {/* 요약 */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="border-green-200">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="text-2xl font-bold text-green-600">{(totalAnnual / 100000000).toFixed(1)}억원</div>
                    <p className="text-xs text-muted-foreground">Total Annual Potential</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{filtered.length}</div><p className="text-xs text-muted-foreground">Constraint Items</p></CardContent></Card>
            <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{filtered.filter(d => d.confidence === "high").length}</div><p className="text-xs text-muted-foreground">High Confidence Items</p></CardContent></Card>
          </div>

          {/* 필터 */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="제약 조건 검색..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
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
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="spec">Spec</SelectItem>
                <SelectItem value="process">Process</SelectItem>
                <SelectItem value="feed">Feed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 테이블 */}
          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">#</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">제약 조건</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Unit</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">유형</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Waive 단위</th>
                    <th className="text-right p-3 text-xs font-medium text-muted-foreground">Marginal Value (일)</th>
                    <th className="text-right p-3 text-xs font-medium text-muted-foreground">Annual Potential</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">신뢰도</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item, idx) => (
                    <tr key={item.id} className="border-b hover:bg-muted/20 transition-colors cursor-pointer">
                      <td className="p-3 text-sm text-muted-foreground">{idx + 1}</td>
                      <td className="p-3 text-sm font-medium">{item.constraint}</td>
                      <td className="p-3"><Badge variant="outline" className="text-xs">{item.unit}</Badge></td>
                      <td className="p-3">
                        <Badge className={cn("text-xs", item.type === "spec" ? "bg-purple-100 text-purple-700" : item.type === "feed" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700")}>{item.type}</Badge>
                      </td>
                      <td className="p-3 font-mono text-sm">{item.waiveUnit}</td>
                      <td className="p-3 text-right font-mono text-sm font-bold text-green-600">{item.marginalValue.toLocaleString()}원/일</td>
                      <td className="p-3 text-right font-mono text-sm font-bold">{(item.annualPotential / 100000000).toFixed(1)}억원/년</td>
                      <td className="p-3">
                        <Badge variant="outline" className={cn("text-xs", item.confidence === "high" ? "border-green-300 text-green-600" : item.confidence === "medium" ? "border-amber-300 text-amber-600" : "border-gray-300 text-gray-500")}>{item.confidence}</Badge>
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
