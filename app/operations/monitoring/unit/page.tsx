"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Activity, Thermometer, Gauge, Droplets, AlertTriangle, CheckCircle,
  TrendingUp, TrendingDown, ExternalLink, Eye, BarChart3
} from "lucide-react"
import { cn } from "@/lib/utils"

const UNITS = [
  { id: "CDU", name: "Crude Distillation Unit", status: "normal", throughput: 95, temperature: 365, pressure: 2.1, alarms: 0, trend: "stable" },
  { id: "VDU", name: "Vacuum Distillation Unit", status: "normal", throughput: 92, temperature: 410, pressure: 0.08, alarms: 1, trend: "up" },
  { id: "HCR", name: "Hydrocracker Unit", status: "warning", throughput: 88, temperature: 395, pressure: 165, alarms: 2, trend: "down" },
  { id: "CCR", name: "Continuous Catalytic Reformer", status: "normal", throughput: 97, temperature: 525, pressure: 3.5, alarms: 0, trend: "stable" },
]

const KEY_VARIABLES = [
  { tagId: "TI-2001", name: "HCR Reactor Inlet Temp", unit: "HCR", current: 392, guideMin: 370, guideMax: 400, uom: "C", status: "caution" },
  { tagId: "PI-3001", name: "CCR Regenerator Pressure", unit: "CCR", current: 3.2, guideMin: 2.5, guideMax: 3.5, uom: "bar", status: "normal" },
  { tagId: "FI-1001", name: "CDU Feed Flow", unit: "CDU", current: 1150, guideMin: 800, guideMax: 1200, uom: "m3/h", status: "normal" },
  { tagId: "TI-4501", name: "VDU Column Bottom Temp", unit: "VDU", current: 378, guideMin: 340, guideMax: 380, uom: "C", status: "caution" },
  { tagId: "AI-2501", name: "HCR Product Sulfur", unit: "HCR", current: 8.5, guideMin: null, guideMax: 10, uom: "ppm", status: "normal" },
  { tagId: "FI-3501", name: "CCR H2/HC Ratio", unit: "CCR", current: 3.8, guideMin: 3.0, guideMax: 5.0, uom: "", status: "normal" },
]

const ANOMALIES = [
  { id: "ANM-001", tagId: "TI-2001", name: "HCR Reactor Inlet Temp", unit: "HCR", type: "Trend Anomaly", confidence: 92, severity: "high", description: "최근 7일간 지속 상승 트렌드. 정상 패턴 대비 +2.3 sigma 이탈.", detectedAt: "2025-02-02 10:15" },
  { id: "ANM-002", tagId: "FV-2001", name: "HCR Feed Control Valve", unit: "HCR", type: "Behavior Change", confidence: 85, severity: "medium", description: "Valve Opening 92%로 정상 범위(60-80%) 초과. Valve 고착 또는 공정 변화 가능성.", detectedAt: "2025-02-01 16:30" },
  { id: "ANM-003", tagId: "E-101 UA", name: "CDU Preheater UA Value", unit: "CDU", type: "Degradation", confidence: 78, severity: "medium", description: "UA Value 점진적 감소. Fouling 진행 추정. 현재 설계 대비 85%.", detectedAt: "2025-02-01 09:00" },
  { id: "ANM-004", tagId: "XI-3001", name: "CCR Catalyst Circulation", unit: "CCR", type: "Pattern Change", confidence: 71, severity: "low", description: "일간 변동폭이 평소 대비 30% 증가. 모니터링 지속 필요.", detectedAt: "2025-01-31 14:20" },
]

export default function UnitMonitoringPage() {
  const [unitFilter, setUnitFilter] = useState("all")

  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card px-6 py-4">
          <h1 className="text-lg font-semibold">Unit Monitoring</h1>
          <p className="text-sm text-muted-foreground mt-1">실시간 유닛 현황, 주요 운전 변수, 이상 감지</p>
        </header>

        <main className="p-6">
          <Tabs defaultValue="overview" className="space-y-6">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="overview">Unit Overview</TabsTrigger>
                <TabsTrigger value="variables">Key Operating Variables</TabsTrigger>
                <TabsTrigger value="anomaly">Anomaly Detection</TabsTrigger>
              </TabsList>
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

            {/* Unit Overview */}
            <TabsContent value="overview" className="space-y-6">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1"><span className="h-2 w-2 rounded-full bg-green-500" />정상 3</Badge>
                <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300"><span className="h-2 w-2 rounded-full bg-amber-500" />주의 1</Badge>
              </div>
              <div className="grid grid-cols-2 gap-6">
                {UNITS.filter(u => unitFilter === "all" || u.id === unitFilter).map((unit) => (
                  <Card key={unit.id} className={cn("transition-all hover:shadow-md", unit.status === "warning" && "border-amber-300 bg-amber-50/30")}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center font-bold", unit.status === "normal" ? "bg-primary/10 text-primary" : "bg-amber-100 text-amber-700")}>{unit.id}</div>
                          <div>
                            <CardTitle className="text-base">{unit.name}</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              {unit.status === "normal" ? (
                                <Badge variant="secondary" className="text-xs bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />정상 운전</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700"><AlertTriangle className="h-3 w-3 mr-1" />주의 필요</Badge>
                              )}
                              {unit.alarms > 0 && <Badge variant="destructive" className="text-xs">알람 {unit.alarms}</Badge>}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 gap-4 mt-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground"><Activity className="h-3 w-3" />처리량</div>
                          <div className="flex items-center gap-2"><span className="text-lg font-bold">{unit.throughput}%</span>{unit.trend === "up" && <TrendingUp className="h-4 w-4 text-green-500" />}{unit.trend === "down" && <TrendingDown className="h-4 w-4 text-red-500" />}</div>
                          <Progress value={unit.throughput} className="h-1.5" />
                        </div>
                        <div className="space-y-1"><div className="flex items-center gap-1 text-xs text-muted-foreground"><Thermometer className="h-3 w-3" />온도</div><span className="text-lg font-bold">{unit.temperature}°C</span></div>
                        <div className="space-y-1"><div className="flex items-center gap-1 text-xs text-muted-foreground"><Gauge className="h-3 w-3" />압력</div><span className="text-lg font-bold">{unit.pressure} bar</span></div>
                        <div className="space-y-1"><div className="flex items-center gap-1 text-xs text-muted-foreground"><Droplets className="h-3 w-3" />수율</div><span className="text-lg font-bold">94.2%</span></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Key Operating Variables */}
            <TabsContent value="variables" className="space-y-4">
              <Card>
                <CardContent className="p-0">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left p-3 text-xs font-medium text-muted-foreground">Status</th>
                        <th className="text-left p-3 text-xs font-medium text-muted-foreground">Tag ID</th>
                        <th className="text-left p-3 text-xs font-medium text-muted-foreground">항목</th>
                        <th className="text-left p-3 text-xs font-medium text-muted-foreground">Unit</th>
                        <th className="text-right p-3 text-xs font-medium text-muted-foreground">현재값</th>
                        <th className="text-right p-3 text-xs font-medium text-muted-foreground">Guide Min</th>
                        <th className="text-right p-3 text-xs font-medium text-muted-foreground">Guide Max</th>
                        <th className="text-left p-3 text-xs font-medium text-muted-foreground">위치</th>
                      </tr>
                    </thead>
                    <tbody>
                      {KEY_VARIABLES.filter(v => unitFilter === "all" || v.unit === unitFilter).map(v => {
                        const range = (v.guideMax || 0) - (v.guideMin || 0)
                        const pos = range > 0 ? ((v.current - (v.guideMin || 0)) / range) * 100 : 50
                        return (
                          <tr key={v.tagId} className="border-b hover:bg-muted/20 transition-colors">
                            <td className="p-3">
                              <span className={cn("h-2.5 w-2.5 rounded-full inline-block", v.status === "caution" ? "bg-amber-500" : "bg-green-500")} />
                            </td>
                            <td className="p-3 font-mono text-sm">{v.tagId}</td>
                            <td className="p-3 text-sm">{v.name}</td>
                            <td className="p-3"><Badge variant="outline" className="text-xs">{v.unit}</Badge></td>
                            <td className="p-3 text-right font-mono text-sm font-bold">{v.current} {v.uom}</td>
                            <td className="p-3 text-right font-mono text-sm text-muted-foreground">{v.guideMin ?? "-"}</td>
                            <td className="p-3 text-right font-mono text-sm text-muted-foreground">{v.guideMax ?? "-"}</td>
                            <td className="p-3">
                              <div className="w-32 h-3 bg-muted rounded-full relative overflow-hidden">
                                <div className="absolute inset-0 bg-green-200 rounded-full" />
                                <div className={cn("absolute h-full w-1 rounded-full", v.status === "caution" ? "bg-amber-500" : "bg-green-600")} style={{ left: `${Math.min(Math.max(pos, 2), 98)}%` }} />
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Anomaly Detection */}
            <TabsContent value="anomaly" className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Card className="border-red-200"><CardContent className="pt-4"><div className="text-2xl font-bold text-red-600">{ANOMALIES.filter(a => a.severity === "high").length}</div><p className="text-xs text-muted-foreground">High Severity</p></CardContent></Card>
                <Card className="border-amber-200"><CardContent className="pt-4"><div className="text-2xl font-bold text-amber-600">{ANOMALIES.filter(a => a.severity === "medium").length}</div><p className="text-xs text-muted-foreground">Medium Severity</p></CardContent></Card>
                <Card className="border-blue-200"><CardContent className="pt-4"><div className="text-2xl font-bold text-blue-600">{ANOMALIES.filter(a => a.severity === "low").length}</div><p className="text-xs text-muted-foreground">Low Severity</p></CardContent></Card>
              </div>
              <div className="space-y-3">
                {ANOMALIES.filter(a => unitFilter === "all" || a.unit === unitFilter).map(anomaly => (
                  <Card key={anomaly.id} className={cn("border-l-4", anomaly.severity === "high" ? "border-l-red-500" : anomaly.severity === "medium" ? "border-l-amber-500" : "border-l-blue-500")}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge className={cn("text-xs", anomaly.severity === "high" ? "bg-red-500 text-white" : anomaly.severity === "medium" ? "bg-amber-500 text-white" : "bg-blue-500 text-white")}>{anomaly.severity}</Badge>
                            <Badge variant="outline" className="text-xs">{anomaly.type}</Badge>
                            <span className="font-mono text-xs text-muted-foreground">{anomaly.tagId}</span>
                          </div>
                          <h3 className="font-medium text-sm mt-2">{anomaly.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{anomaly.description}</p>
                        </div>
                        <div className="text-right flex-shrink-0 ml-4">
                          <div className="text-xs text-muted-foreground">Confidence</div>
                          <div className="text-lg font-bold">{anomaly.confidence}%</div>
                          <div className="text-xs text-muted-foreground mt-1">{anomaly.detectedAt}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </AppShell>
  )
}
