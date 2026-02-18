"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, Activity, Droplets, Flame, Thermometer, Gauge } from "lucide-react"
import { cn } from "@/lib/utils"

const PROCESS_GROUPS = [
  {
    id: "kd",
    name: "KD (Kerosene Desulfurization)",
    units: ["1KD", "2KD", "3KD", "4KD"],
    compareMetrics: [
      { name: "Feed Rate (m3/h)", values: { "1KD": 185, "2KD": 192, "3KD": 178, "4KD": 195 }, unit: "m3/h", best: "4KD" },
      { name: "Reactor Inlet Temp (C)", values: { "1KD": 320, "2KD": 318, "3KD": 325, "4KD": 315 }, unit: "C", best: "4KD" },
      { name: "Product Sulfur (ppm)", values: { "1KD": 8.2, "2KD": 7.5, "3KD": 9.1, "4KD": 6.8 }, unit: "ppm", best: "4KD" },
      { name: "H2 Consumption (Nm3/m3)", values: { "1KD": 25.3, "2KD": 24.1, "3KD": 26.8, "4KD": 23.5 }, unit: "Nm3/m3", best: "4KD" },
      { name: "WABT (C)", values: { "1KD": 335, "2KD": 332, "3KD": 340, "4KD": 328 }, unit: "C", best: "4KD" },
      { name: "Energy Index", values: { "1KD": 102, "2KD": 98, "3KD": 108, "4KD": 95 }, unit: "%", best: "4KD" },
    ]
  },
  {
    id: "fcc",
    name: "FCC (Fluid Catalytic Cracking)",
    units: ["VGOFCC", "RFCC"],
    compareMetrics: [
      { name: "Feed Rate (m3/h)", values: { "VGOFCC": 520, "RFCC": 480 }, unit: "m3/h", best: "VGOFCC" },
      { name: "Conversion (%)", values: { "VGOFCC": 78.5, "RFCC": 72.3 }, unit: "%", best: "VGOFCC" },
      { name: "Gasoline Yield (%)", values: { "VGOFCC": 48.2, "RFCC": 42.8 }, unit: "%", best: "VGOFCC" },
      { name: "Catalyst Activity", values: { "VGOFCC": 72, "RFCC": 68 }, unit: "MAT", best: "VGOFCC" },
      { name: "Catalyst Circulation (ton/min)", values: { "VGOFCC": 28.5, "RFCC": 25.2 }, unit: "ton/min", best: "VGOFCC" },
      { name: "Regen Temp (C)", values: { "VGOFCC": 690, "RFCC": 685 }, unit: "C", best: "-" },
    ]
  },
  {
    id: "sru",
    name: "SRU (Sulfur Recovery Unit)",
    units: ["15SRU", "75SRU", "85SRU", "95SRU", "115SRU", "535SRU", "655SRU", "615SRU"],
    compareMetrics: [
      { name: "Feed H2S (%)", values: { "15SRU": 85, "75SRU": 82, "85SRU": 88, "95SRU": 80, "115SRU": 86, "535SRU": 84, "655SRU": 81, "615SRU": 83 }, unit: "%", best: "85SRU" },
      { name: "Recovery Rate (%)", values: { "15SRU": 99.2, "75SRU": 98.8, "85SRU": 99.5, "95SRU": 98.5, "115SRU": 99.1, "535SRU": 98.9, "655SRU": 98.6, "615SRU": 99.0 }, unit: "%", best: "85SRU" },
      { name: "Steam Production (ton/h)", values: { "15SRU": 12.5, "75SRU": 11.8, "85SRU": 13.2, "95SRU": 10.5, "115SRU": 12.0, "535SRU": 11.5, "655SRU": 10.8, "615SRU": 11.2 }, unit: "ton/h", best: "85SRU" },
      { name: "Tail Gas SO2 (ppm)", values: { "15SRU": 180, "75SRU": 220, "85SRU": 150, "95SRU": 250, "115SRU": 195, "535SRU": 210, "655SRU": 230, "615SRU": 200 }, unit: "ppm", best: "85SRU" },
    ]
  }
]

export default function SimilarProcessPage() {
  const [selectedGroup, setSelectedGroup] = useState("kd")

  const group = PROCESS_GROUPS.find(g => g.id === selectedGroup)!

  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card px-6 py-4">
          <h1 className="text-lg font-semibold">Similar Process Comparison</h1>
          <p className="text-sm text-muted-foreground mt-1">유사 공정 간 운전 데이터, Feed, Utility 사용량 비교 분석</p>
        </header>

        <main className="p-6 space-y-6">
          {/* 공정 그룹 선택 */}
          <Tabs value={selectedGroup} onValueChange={setSelectedGroup}>
            <TabsList>
              {PROCESS_GROUPS.map(g => (
                <TabsTrigger key={g.id} value={g.id}>{g.name}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* 비교 유닛 표시 */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-muted-foreground">비교 대상:</span>
            {group.units.map(u => (
              <Badge key={u} variant="outline" className="text-sm">{u}</Badge>
            ))}
          </div>

          {/* 비교 테이블 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                {group.name} - 운전 비교
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground sticky left-0 bg-muted/30 min-w-48">Metric</th>
                      {group.units.map(u => (
                        <th key={u} className="text-center p-3 text-xs font-medium text-muted-foreground min-w-24">{u}</th>
                      ))}
                      <th className="text-center p-3 text-xs font-medium text-muted-foreground min-w-20">Best</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.compareMetrics.map((metric, idx) => {
                      const values = Object.values(metric.values) as number[]
                      const maxVal = Math.max(...values)
                      const minVal = Math.min(...values)
                      // For metrics where lower is better (sulfur, consumption, energy, tail gas, temp for some)
                      const lowerIsBetter = metric.name.includes("Sulfur") || metric.name.includes("Consumption") || metric.name.includes("Energy") || metric.name.includes("SO2") || metric.name.includes("WABT")

                      return (
                        <tr key={idx} className="border-b hover:bg-muted/20 transition-colors">
                          <td className="p-3 text-sm font-medium sticky left-0 bg-card">{metric.name}</td>
                          {group.units.map(u => {
                            const val = (metric.values as Record<string, number>)[u]
                            const isBest = lowerIsBetter ? val === minVal : val === maxVal
                            const isWorst = lowerIsBetter ? val === maxVal : val === minVal
                            return (
                              <td key={u} className="p-3 text-center">
                                <span className={cn("font-mono text-sm font-medium", isBest ? "text-green-600" : isWorst ? "text-red-600" : "text-foreground")}>
                                  {val}
                                </span>
                                {isBest && <Badge className="ml-1 text-xs bg-green-100 text-green-700 px-1">Best</Badge>}
                              </td>
                            )
                          })}
                          <td className="p-3 text-center">
                            <Badge variant="outline" className="text-xs text-green-600 border-green-300">{metric.best}</Badge>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* 인사이트 요약 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">AI 분석 요약</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 text-sm space-y-2">
                {selectedGroup === "kd" && (
                  <>
                    <p><strong>4KD</strong>가 전반적으로 가장 우수한 운전 성능을 보이고 있습니다 (Product Sulfur 6.8ppm, H2 소비 23.5 Nm3/m3).</p>
                    <p><strong>3KD</strong>는 WABT가 340C로 가장 높아 촉매 노화가 진행된 것으로 판단되며, 촉매 교체 시기 검토가 필요합니다.</p>
                    <p>4KD의 운전 조건을 다른 Unit에 적용 시 연간 약 <strong>12억원</strong>의 개선 효과가 예상됩니다.</p>
                  </>
                )}
                {selectedGroup === "fcc" && (
                  <>
                    <p><strong>VGOFCC</strong>가 Conversion 78.5%, Gasoline Yield 48.2%로 RFCC 대비 우수한 성능을 보이고 있습니다.</p>
                    <p>RFCC의 촉매 활성도(MAT 68)가 상대적으로 낮아 촉매 보충 검토가 필요합니다.</p>
                  </>
                )}
                {selectedGroup === "sru" && (
                  <>
                    <p><strong>85SRU</strong>가 Recovery Rate 99.5%, Tail Gas SO2 150ppm으로 가장 우수한 성능을 보이고 있습니다.</p>
                    <p>95SRU의 Recovery Rate가 98.5%로 가장 낮으며, Tail Gas SO2도 250ppm으로 환경 규제 기준 근접 - 점검 필요합니다.</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </AppShell>
  )
}
