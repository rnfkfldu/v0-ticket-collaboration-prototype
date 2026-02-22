"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Search, BookOpen, Shield, RefreshCw, Clock, Calendar, Eye,
  ChevronRight, AlertTriangle, CheckCircle, Settings, Layers
} from "lucide-react"
import { cn } from "@/lib/utils"

/* ── Static Operation Guides (master-based) ── */
const STATIC_GUIDES = [
  { id: "OG-001", title: "CDU Atmospheric Column Operation Guide", process: "CDU", type: "operation" as const, equipment: "T-1001 (Atmospheric Column)", version: "v4.2", lastReviewed: "2024-11-15", author: "기술팀", status: "active" as const, parameters: [ { name: "Top Temperature", min: 105, max: 120, unit: "C", normal: 112 }, { name: "Bottom Temperature", min: 340, max: 360, unit: "C", normal: 350 }, { name: "Reflux Ratio", min: 1.2, max: 1.8, unit: "", normal: 1.5 } ], description: "CDU 상압 증류탑 운전 가이드. Feed Crude TBP, Column Profile, 제품 품질 기준 포함." },
  { id: "OG-002", title: "HCR Reactor Operation Guide", process: "HCR", type: "operation" as const, equipment: "R-2001/2002 (Reactor)", version: "v3.1", lastReviewed: "2025-01-10", author: "기술팀", status: "active" as const, parameters: [ { name: "WABT", min: 360, max: 410, unit: "C", normal: 375 }, { name: "Hydrogen Partial Pressure", min: 140, max: 160, unit: "kg/cm2", normal: 150 }, { name: "LHSV", min: 0.8, max: 1.2, unit: "hr-1", normal: 1.0 } ], description: "HCR 반응기 운전 가이드. 촉매 활성도별 운전 조건, Feed Quality 대응 포함." },
  { id: "OG-003", title: "VDU Vacuum Column Operation Guide", process: "VDU", type: "operation" as const, equipment: "T-2001 (Vacuum Column)", version: "v2.5", lastReviewed: "2024-09-20", author: "기술팀", status: "active" as const, parameters: [ { name: "Top Vacuum", min: 20, max: 30, unit: "mmHg", normal: 25 }, { name: "Flash Zone Temperature", min: 380, max: 400, unit: "C", normal: 390 } ], description: "VDU 감압 증류탑 운전 가이드. 진공도 관리, LVGO/HVGO 품질 기준." },
  { id: "OG-004", title: "FCC Reactor-Regenerator Operation Guide", process: "FCC", type: "operation" as const, equipment: "Reactor/Regenerator", version: "v5.0", lastReviewed: "2024-12-01", author: "기술팀", status: "active" as const, parameters: [ { name: "Riser Outlet Temp", min: 510, max: 540, unit: "C", normal: 525 }, { name: "Regenerator Temp", min: 680, max: 720, unit: "C", normal: 700 }, { name: "Cat/Oil Ratio", min: 5, max: 8, unit: "", normal: 6.5 } ], description: "FCC Reactor-Regenerator 운전 가이드. 촉매 순환, Heat Balance, 수율 최적화." },
  { id: "OG-005", title: "CCR Continuous Regeneration Guide", process: "CCR", type: "operation" as const, equipment: "Regeneration Section", version: "v2.0", lastReviewed: "2024-10-15", author: "기술팀", status: "active" as const, parameters: [ { name: "Regeneration Temp", min: 480, max: 520, unit: "C", normal: 500 }, { name: "Chloride Injection", min: 150, max: 250, unit: "ppm", normal: 200 } ], description: "CCR 연속 촉매 재생 운전 가이드. Coke Burn, Chlorination, Reduction 공정." },
  { id: "IOW-001", title: "HCR Reactor IOW (Integrity Operating Window)", process: "HCR", type: "iow" as const, equipment: "R-2001/2002", version: "v2.3", lastReviewed: "2025-01-05", author: "설비팀", status: "active" as const, parameters: [ { name: "Max Skin Temperature", min: 0, max: 440, unit: "C", normal: 410 }, { name: "H2/Oil Ratio", min: 800, max: 1200, unit: "Nm3/m3", normal: 1000 } ], description: "HCR Reactor 설비 건전성 운전 범위. 고온 수소 취화, 부식 관리 기준." },
  { id: "IOW-002", title: "CDU Overhead IOW", process: "CDU", type: "iow" as const, equipment: "Overhead System", version: "v1.8", lastReviewed: "2024-08-20", author: "설비팀", status: "active" as const, parameters: [ { name: "pH Range", min: 5.5, max: 7.0, unit: "", normal: 6.2 }, { name: "Chloride", min: 0, max: 20, unit: "ppm", normal: 10 } ], description: "CDU Overhead 부식 관리 IOW. Neutralizer 주입량, pH, Chloride 기준." },
  { id: "IOW-003", title: "VDU Heater Tube IOW", process: "VDU", type: "iow" as const, equipment: "H-1001 Heater", version: "v1.5", lastReviewed: "2024-07-10", author: "설비팀", status: "active" as const, parameters: [ { name: "TMT (Tube Metal Temp)", min: 0, max: 550, unit: "C", normal: 480 }, { name: "Coil DP", min: 0, max: 3.5, unit: "kg/cm2", normal: 2.0 } ], description: "VDU Heater Tube 건전성 IOW. Coking, High Temp Oxidation 관리." },
]

/* ── Repeatable Guides (periodic, condition-based) ── */
const REPEATABLE_GUIDES = [
  { id: "RG-001", title: "HCR Reactor 온도 조정 가이드", process: "HCR", frequency: "수시 (온도 변동 시)", lastIssued: "2025-02-03", nextDue: "-", author: "김지수", version: 3, status: "active" as const, description: "Reactor inlet 온도 변동 시 Feed rate 및 Quench 조정 절차. WABT 상한 기준 포함." },
  { id: "RG-002", title: "CDU 원유 전환 운전 가이드", process: "CDU", frequency: "원유 Grade 변경 시", lastIssued: "2025-01-28", nextDue: "-", author: "이철수", version: 5, status: "active" as const, description: "원유 Grade 변경 시 CDU 운전 조건 조정 가이드. Desalter, Column Profile 변경 포함." },
  { id: "RG-003", title: "VDU 진공도 회복 절차", process: "VDU", frequency: "수시 (진공 저하 시)", lastIssued: "2025-01-15", nextDue: "-", author: "박영희", version: 2, status: "active" as const, description: "진공도 저하 시 Ejector 점검 및 복구 절차." },
  { id: "RG-004", title: "FCC 촉매 보충 가이드", process: "FCC", frequency: "월 1회 / Activity 기준", lastIssued: "2025-02-02", nextDue: "2025-03-02", author: "이엔지니어", version: 4, status: "active" as const, description: "E-Cat Activity 기반 촉매 보충량 산정 및 투입 절차." },
  { id: "RG-005", title: "CCR Chloride Injection 조정 가이드", process: "CCR", frequency: "주 1회 분석 후", lastIssued: "2025-02-04", nextDue: "2025-02-11", author: "이연구원", version: 3, status: "active" as const, description: "주간 Chloride 분석 결과 기반 주입량 조정 절차." },
  { id: "RG-006", title: "월간 IOW 준수 점검 가이드", process: "전체", frequency: "월 1회", lastIssued: "2025-02-01", nextDue: "2025-03-01", author: "설비팀", version: 2, status: "active" as const, description: "전 공정 IOW 준수 현황 월간 점검 및 리포트 작성 가이드." },
  { id: "RG-007", title: "CDU Neutralizer 주입 조정 가이드", process: "CDU", frequency: "주 2회 (pH 분석 후)", lastIssued: "2025-02-04", nextDue: "2025-02-07", author: "박엔지니어", version: 6, status: "active" as const, description: "Overhead pH 분석 결과 기반 Neutralizer 주입량 조정 절차." },
  { id: "RG-008", title: "HCR 촉매 활성도 월간 평가 가이드", process: "HCR", frequency: "월 1회", lastIssued: "2025-02-01", nextDue: "2025-03-01", author: "김철수", version: 3, status: "active" as const, description: "WABT Trend, Conversion 등 촉매 활성도 지표 월간 평가 절차." },
]

const PROCESSES = ["전체", "HCR", "CDU", "VDU", "FCC", "CCR"]
const GUIDE_TYPE_COLORS: Record<string, string> = {
  operation: "bg-blue-50 text-blue-700 border-blue-200",
  iow: "bg-amber-50 text-amber-700 border-amber-200",
}

export default function GuidesPage() {
  const [tab, setTab] = useState("static")
  const [search, setSearch] = useState("")
  const [processFilter, setProcessFilter] = useState("전체")
  const [selectedStatic, setSelectedStatic] = useState<typeof STATIC_GUIDES[0] | null>(null)
  const [selectedRepeatable, setSelectedRepeatable] = useState<typeof REPEATABLE_GUIDES[0] | null>(null)

  const filteredStatic = STATIC_GUIDES.filter(g => {
    if (processFilter !== "전체" && g.process !== processFilter) return false
    if (search && !g.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const filteredRepeatable = REPEATABLE_GUIDES.filter(g => {
    if (processFilter !== "전체" && g.process !== processFilter) return false
    if (search && !g.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="px-6 py-4">
            <h1 className="text-lg font-semibold">운영 가이드</h1>
            <p className="text-sm text-muted-foreground mt-1">Operation Guide, IOW 등 설비 가이드 및 반복성 가이드 관리</p>
          </div>
        </header>

        <div className="p-6 space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="가이드 검색..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
            </div>
            <Select value={processFilter} onValueChange={setProcessFilter}>
              <SelectTrigger className="w-28 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>{PROCESSES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="static" className="gap-1.5">
                <BookOpen className="h-3.5 w-3.5" /> Operation Guide / IOW
                <Badge variant="secondary" className="ml-1 h-5 text-[10px]">{filteredStatic.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="repeatable" className="gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" /> 반복성 가이드
                <Badge variant="secondary" className="ml-1 h-5 text-[10px]">{filteredRepeatable.length}</Badge>
              </TabsTrigger>
            </TabsList>

            {/* Static Guides */}
            <TabsContent value="static" className="mt-4 space-y-2">
              {filteredStatic.map(guide => (
                <Card key={guide.id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setSelectedStatic(guide)}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", guide.type === "iow" ? "bg-amber-50" : "bg-blue-50")}>
                      {guide.type === "iow" ? <Shield className="h-4 w-4 text-amber-600" /> : <BookOpen className="h-4 w-4 text-blue-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[11px] font-mono text-muted-foreground">{guide.id}</span>
                        <Badge variant="outline" className={cn("text-[10px] h-4", GUIDE_TYPE_COLORS[guide.type])}>{guide.type === "iow" ? "IOW" : "Op.Guide"}</Badge>
                        <Badge variant="outline" className="text-[10px] h-4">{guide.process}</Badge>
                        <span className="text-[10px] text-muted-foreground">{guide.version}</span>
                      </div>
                      <p className="text-sm font-medium truncate">{guide.title}</p>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                        <span>설비: {guide.equipment}</span>
                        <span>최종 검토: {guide.lastReviewed}</span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* Repeatable Guides */}
            <TabsContent value="repeatable" className="mt-4 space-y-2">
              {filteredRepeatable.map(guide => (
                <Card key={guide.id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setSelectedRepeatable(guide)}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                      <RefreshCw className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[11px] font-mono text-muted-foreground">{guide.id}</span>
                        <Badge variant="outline" className="text-[10px] h-4 bg-green-50 text-green-700 border-green-200">반복성</Badge>
                        <Badge variant="outline" className="text-[10px] h-4">{guide.process}</Badge>
                        <span className="text-[10px] text-muted-foreground">v{guide.version}</span>
                      </div>
                      <p className="text-sm font-medium truncate">{guide.title}</p>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                        <span>주기: {guide.frequency}</span>
                        <span>최종 발행: {guide.lastIssued}</span>
                        {guide.nextDue !== "-" && <span className="text-amber-600">다음: {guide.nextDue}</span>}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>

        {/* Static Guide Detail */}
        <Dialog open={!!selectedStatic} onOpenChange={() => setSelectedStatic(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-base">{selectedStatic?.title}</DialogTitle>
            </DialogHeader>
            {selectedStatic && (
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/30">
                  <div><span className="text-xs text-muted-foreground">ID</span><p className="font-mono text-xs">{selectedStatic.id}</p></div>
                  <div><span className="text-xs text-muted-foreground">유형</span><p><Badge variant="outline" className={cn("text-[10px]", GUIDE_TYPE_COLORS[selectedStatic.type])}>{selectedStatic.type === "iow" ? "IOW" : "Operation Guide"}</Badge></p></div>
                  <div><span className="text-xs text-muted-foreground">공정</span><p>{selectedStatic.process}</p></div>
                  <div><span className="text-xs text-muted-foreground">설비</span><p className="text-xs">{selectedStatic.equipment}</p></div>
                  <div><span className="text-xs text-muted-foreground">버전</span><p>{selectedStatic.version}</p></div>
                  <div><span className="text-xs text-muted-foreground">최종 검토</span><p>{selectedStatic.lastReviewed}</p></div>
                </div>
                <div>
                  <span className="text-xs font-medium">설명</span>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{selectedStatic.description}</p>
                </div>
                <div>
                  <span className="text-xs font-medium">주요 운전 파라미터</span>
                  <div className="mt-2 border border-border rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead><tr className="bg-muted/50"><th className="text-left p-2 font-medium">파라미터</th><th className="text-center p-2 font-medium">Min</th><th className="text-center p-2 font-medium">정상값</th><th className="text-center p-2 font-medium">Max</th><th className="text-center p-2 font-medium">단위</th></tr></thead>
                      <tbody>
                        {selectedStatic.parameters.map((param, i) => (
                          <tr key={i} className="border-t border-border">
                            <td className="p-2 font-medium">{param.name}</td>
                            <td className="p-2 text-center text-muted-foreground">{param.min}</td>
                            <td className="p-2 text-center font-semibold text-primary">{param.normal}</td>
                            <td className="p-2 text-center text-muted-foreground">{param.max}</td>
                            <td className="p-2 text-center text-muted-foreground">{param.unit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs"><Eye className="h-3 w-3" /> 전체 문서 보기</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Repeatable Guide Detail */}
        <Dialog open={!!selectedRepeatable} onOpenChange={() => setSelectedRepeatable(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base">{selectedRepeatable?.title}</DialogTitle>
            </DialogHeader>
            {selectedRepeatable && (
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/30">
                  <div><span className="text-xs text-muted-foreground">ID</span><p className="font-mono text-xs">{selectedRepeatable.id}</p></div>
                  <div><span className="text-xs text-muted-foreground">공정</span><p>{selectedRepeatable.process}</p></div>
                  <div><span className="text-xs text-muted-foreground">발행 주기</span><p className="text-xs">{selectedRepeatable.frequency}</p></div>
                  <div><span className="text-xs text-muted-foreground">버전</span><p>v{selectedRepeatable.version}</p></div>
                  <div><span className="text-xs text-muted-foreground">최종 발행</span><p>{selectedRepeatable.lastIssued}</p></div>
                  <div><span className="text-xs text-muted-foreground">다음 예정</span><p className={selectedRepeatable.nextDue !== "-" ? "text-amber-600 font-medium" : ""}>{selectedRepeatable.nextDue}</p></div>
                </div>
                <div>
                  <span className="text-xs font-medium">설명</span>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{selectedRepeatable.description}</p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  )
}
