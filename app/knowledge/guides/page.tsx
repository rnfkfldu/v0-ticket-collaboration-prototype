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
  Search, BookOpen, FileText, Clock, ChevronRight, Eye,
  RefreshCw, Shield, Settings, AlertTriangle, Star, Calendar
} from "lucide-react"
import { cn } from "@/lib/utils"

// -- Static Operation Guides (마스터 기반) --
const STATIC_GUIDES = [
  { id: "OG-001", title: "CDU Operation Guide - Crude Distillation", process: "CDU", category: "Operation Guide", version: "Rev.5", lastReviewed: "2024-06-15", owner: "공정기술팀", status: "active", description: "CDU 상압증류 공정 운전 가이드. 원유 투입부터 제품 인출까지의 전체 운전 절차 및 가이드값 포함.", items: ["Feed Rate: 280-320 m3/h", "Column Top Temp: 120-130C", "Column Bottom Temp: 350-365C", "Reflux Ratio: 1.8-2.2", "Overhead Pressure: 1.2-1.5 kg/cm2"] },
  { id: "OG-002", title: "VDU Operation Guide - Vacuum Distillation", process: "VDU", category: "Operation Guide", version: "Rev.4", lastReviewed: "2024-06-15", owner: "공정기술팀", status: "active", description: "VDU 감압증류 공정 운전 가이드. 진공 시스템 관리 및 제품 품질 관리 포함.", items: ["Vacuum: 780-800 mmHg", "Flash Zone Temp: 390-405C", "Heater Outlet: 410-420C", "LVGO Cut Point: 370C", "HVGO Cut Point: 520C"] },
  { id: "OG-003", title: "HCR Operation Guide - Hydrocracker", process: "HCR", category: "Operation Guide", version: "Rev.6", lastReviewed: "2024-06-15", owner: "공정기술팀", status: "active", description: "HCR 수소화분해 공정 운전 가이드. Reactor 온도관리, 촉매 수명관리, 수율 최적화 가이드.", items: ["WABT: 370-400C", "H2/HC Ratio: 1200-1500 Nm3/m3", "Feed Rate: 250-300 m3/h", "Recycle Ratio: 0.85-0.95", "Separator Pressure: 155 kg/cm2"] },
  { id: "OG-004", title: "CCR Operation Guide - Catalytic Reformer", process: "CCR", category: "Operation Guide", version: "Rev.3", lastReviewed: "2024-06-15", owner: "공정기술팀", status: "active", description: "CCR 접촉개질 공정 운전 가이드. Reactor/Regenerator 온도관리, RON 관리.", items: ["Reactor Inlet: 525-535C", "Catalyst Circulation: 750 kg/h", "RON Target: 100-102", "Coke on Catalyst: <5%", "Regenerator Temp: 520-540C"] },
  { id: "OG-005", title: "FCC Operation Guide - Fluid Catalytic Cracker", process: "FCC", category: "Operation Guide", version: "Rev.4", lastReviewed: "2024-06-15", owner: "공정기술팀", status: "active", description: "FCC 유동접촉분해 공정 운전 가이드.", items: ["Riser Outlet Temp: 520-530C", "Regenerator Dense Bed: 680-700C", "Cat/Oil Ratio: 6-8", "Feed Preheat: 230-250C"] },
  { id: "OG-006", title: "SRU Operation Guide - Sulfur Recovery", process: "SRU", category: "Operation Guide", version: "Rev.3", lastReviewed: "2024-06-15", owner: "공정기술팀", status: "active", description: "SRU 황 회수 공정 운전 가이드. Tail Gas 관리 및 환경 Spec 준수.", items: ["S Recovery: >99.5%", "Tail Gas SO2: <50ppm", "Furnace Temp: 1050-1150C", "Air/AG Ratio: 2.0-2.2"] },
  // -- IOW (Integrity Operating Window) --
  { id: "IOW-001", title: "CDU Overhead System IOW", process: "CDU", category: "IOW", version: "Rev.2", lastReviewed: "2024-09-10", owner: "설비건전성팀", status: "active", description: "CDU Overhead Corrosion 관리를 위한 IOW. Neutralizer/Inhibitor 주입 기준.", items: ["Overhead Temp: <130C (Critical)", "pH: 5.5-6.5 (Standard)", "Chloride: <20ppm (Target)", "Fe Ion: <2ppm (Alert at >1ppm)", "Neutralizer Rate: 5-15 L/h"] },
  { id: "IOW-002", title: "HCR Reactor System IOW", process: "HCR", category: "IOW", version: "Rev.3", lastReviewed: "2024-09-10", owner: "설비건전성팀", status: "active", description: "HCR Reactor 고온/고압 영역 IOW.", items: ["Max WABT: 420C (Critical)", "Max ΔT across bed: 30C (Standard)", "H2 Partial Pressure: >120 kg/cm2", "Max Metal Temp: 454C (Design Limit)"] },
  { id: "IOW-003", title: "VDU Heater IOW", process: "VDU", category: "IOW", version: "Rev.2", lastReviewed: "2024-09-10", owner: "설비건전성팀", status: "active", description: "VDU Heater Coking/Creep 관리를 위한 IOW.", items: ["Max Tube Skin Temp: 520C (Critical)", "Max Flux Rate: 35 kW/m2", "Stack Temp: <250C", "Draft: -5 to -10 mmH2O"] },
]

// -- Repeatable Guides (운전 현황 기반 주기적 발행) --
const REPEATABLE_GUIDES = [
  { id: "RG-001", title: "HCR Reactor 온도 조정 가이드", process: "HCR", category: "Repeatable", frequency: "On-demand", lastIssued: "2025-02-03", nextDue: "-", version: 3, status: "active", trigger: "Reactor Inlet Temp 변동 시", description: "Reactor inlet 온도 변동 시 Feed rate 및 Quench 조정 절차. 현재 운전 데이터 기반 자동 계산.", usageCount: 45 },
  { id: "RG-002", title: "CDU 원유 전환 절차 가이드", process: "CDU", category: "Repeatable", frequency: "원유전환 시", lastIssued: "2025-02-04", nextDue: "-", version: 5, status: "active", trigger: "Crude Grade 변경 시", description: "원유 Grade 변경 시 운전 조건 조정 가이드. Blend ratio에 따른 Column profile 자동 산출.", usageCount: 32 },
  { id: "RG-003", title: "VDU 진공도 회복 절차", process: "VDU", category: "Repeatable", frequency: "On-demand", lastIssued: "2025-01-28", nextDue: "-", version: 2, status: "active", trigger: "진공도 저하 감지 시", description: "진공도 저하 시 원인별 대응 절차. Ejector/LRVP 상태 진단 포함.", usageCount: 28 },
  { id: "RG-004", title: "CCR Regenerator 온도 관리 가이드", process: "CCR", category: "Repeatable", frequency: "주 1회", lastIssued: "2025-02-01", nextDue: "2025-02-08", version: 4, status: "active", trigger: "주간 정기 점검", description: "Coke burn zone 온도 프로파일 최적화 가이드. 촉매 순환량 조정 포함.", usageCount: 21 },
  { id: "RG-005", title: "SRU Air/AG Ratio 조정 가이드", process: "SRU", category: "Repeatable", frequency: "On-demand", lastIssued: "2025-01-20", nextDue: "-", version: 2, status: "active", trigger: "Tail Gas SO2 변동 시", description: "Tail Gas SO2 농도 기준 Air/Acid Gas Ratio 재조정 절차.", usageCount: 15 },
  { id: "RG-006", title: "FCC Catalyst Inventory 관리", process: "FCC", category: "Repeatable", frequency: "월 1회", lastIssued: "2025-02-01", nextDue: "2025-03-01", version: 3, status: "active", trigger: "월간 촉매 현황 점검", description: "FCC 촉매 보유량, Activity, Metal Level 점검 및 보충 계획.", usageCount: 18 },
  { id: "RG-007", title: "WABT 계산시트 (반복 실행)", process: "HCR", category: "Repeatable", frequency: "일 1회", lastIssued: "2025-02-04", nextDue: "2025-02-05", version: 2, status: "active", trigger: "일일 촉매 모니터링", description: "Weighted Average Bed Temperature 계산 및 추세 갱신.", usageCount: 89 },
  { id: "RG-008", title: "열교환기 효율 계산시트", process: "공통", category: "Repeatable", frequency: "주 1회", lastIssued: "2025-02-03", nextDue: "2025-02-10", version: 3, status: "active", trigger: "주간 Fouling 점검", description: "열교환기 열전달 효율 및 Fouling Factor 계산. UA값 추적.", usageCount: 67 },
]

const PROCESSES = ["전체", "CDU", "VDU", "HCR", "CCR", "FCC", "SRU", "공통"]

export default function GuidesPage() {
  const [tab, setTab] = useState("static")
  const [search, setSearch] = useState("")
  const [processF, setProcessF] = useState("전체")
  const [selStatic, setSelStatic] = useState<typeof STATIC_GUIDES[0] | null>(null)
  const [selRepeat, setSelRepeat] = useState<typeof REPEATABLE_GUIDES[0] | null>(null)

  const filteredStatic = STATIC_GUIDES.filter(g => {
    if (search && !g.title.toLowerCase().includes(search.toLowerCase())) return false
    if (processF !== "전체" && g.process !== processF) return false
    return true
  })
  const filteredRepeat = REPEATABLE_GUIDES.filter(g => {
    if (search && !g.title.toLowerCase().includes(search.toLowerCase())) return false
    if (processF !== "전체" && g.process !== processF) return false
    return true
  })

  const ogGuides = filteredStatic.filter(g => g.category === "Operation Guide")
  const iowGuides = filteredStatic.filter(g => g.category === "IOW")

  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="px-6 py-4">
            <h1 className="text-lg font-semibold">운영 가이드</h1>
            <p className="text-sm text-muted-foreground mt-1">공정 Operation Guide, IOW 등 마스터 기반 가이드와 반복성 가이드를 관리합니다</p>
          </div>
        </header>
        <main className="p-6 space-y-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="가이드 검색..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                </div>
                <Select value={processF} onValueChange={setProcessF}><SelectTrigger className="w-28"><SelectValue /></SelectTrigger><SelectContent>{PROCESSES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select>
              </div>
            </CardContent>
          </Card>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="static" className="gap-1.5"><BookOpen className="h-3.5 w-3.5" />Operation Guide / IOW <Badge variant="secondary" className="ml-1 text-[10px] h-4">{filteredStatic.length}</Badge></TabsTrigger>
              <TabsTrigger value="repeatable" className="gap-1.5"><RefreshCw className="h-3.5 w-3.5" />반복성 가이드 <Badge variant="secondary" className="ml-1 text-[10px] h-4">{filteredRepeat.length}</Badge></TabsTrigger>
            </TabsList>

            {/* Static Guides */}
            <TabsContent value="static" className="space-y-4 mt-4">
              {/* Operation Guides */}
              {ogGuides.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold mb-2 flex items-center gap-2"><BookOpen className="h-4 w-4" /> Operation Guide</h2>
                  <div className="grid grid-cols-1 gap-2">
                    {ogGuides.map(g => (
                      <Card key={g.id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setSelStatic(g)}>
                        <CardContent className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                              <BookOpen className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px] h-4">{g.process}</Badge>
                                <Badge variant="outline" className="text-[10px] h-4">{g.version}</Badge>
                              </div>
                              <p className="text-sm font-medium mt-0.5">{g.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">{g.description}</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* IOW Guides */}
              {iowGuides.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold mb-2 flex items-center gap-2"><Shield className="h-4 w-4" /> IOW (Integrity Operating Window)</h2>
                  <div className="grid grid-cols-1 gap-2">
                    {iowGuides.map(g => (
                      <Card key={g.id} className="cursor-pointer hover:bg-muted/30 transition-colors border-amber-100" onClick={() => setSelStatic(g)}>
                        <CardContent className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                              <Shield className="h-5 w-5 text-amber-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px] h-4">{g.process}</Badge>
                                <Badge variant="outline" className="text-[10px] h-4">{g.version}</Badge>
                                <span className="text-[10px] text-muted-foreground">검토: {g.lastReviewed}</span>
                              </div>
                              <p className="text-sm font-medium mt-0.5">{g.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">{g.description}</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Repeatable Guides */}
            <TabsContent value="repeatable" className="space-y-2 mt-4">
              {filteredRepeat.map(g => (
                <Card key={g.id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setSelRepeat(g)}>
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                        <RefreshCw className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-[10px] h-4">{g.process}</Badge>
                          <Badge className="text-[10px] h-4 bg-emerald-50 text-emerald-700 border-emerald-200">{g.frequency}</Badge>
                          <span className="text-[10px] text-muted-foreground">v{g.version}</span>
                          <span className="text-[10px] text-muted-foreground">사용 {g.usageCount}회</span>
                        </div>
                        <p className="text-sm font-medium mt-0.5">{g.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{g.description}</p>
                      </div>
                      <div className="text-right shrink-0 text-xs text-muted-foreground">
                        <p>최근: {g.lastIssued}</p>
                        {g.nextDue !== "-" && <p className="text-amber-600">다음: {g.nextDue}</p>}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </main>

        {/* Static Guide Detail */}
        <Dialog open={!!selStatic} onOpenChange={() => setSelStatic(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="text-base">{selStatic?.title}</DialogTitle></DialogHeader>
            {selStatic && (
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div><span className="text-muted-foreground">ID:</span> {selStatic.id}</div>
                  <div><span className="text-muted-foreground">공정:</span> {selStatic.process}</div>
                  <div><span className="text-muted-foreground">버전:</span> {selStatic.version}</div>
                  <div><span className="text-muted-foreground">관리:</span> {selStatic.owner}</div>
                  <div><span className="text-muted-foreground">최종 검토:</span> {selStatic.lastReviewed}</div>
                  <div><span className="text-muted-foreground">유형:</span> {selStatic.category}</div>
                </div>
                <p className="text-sm text-muted-foreground">{selStatic.description}</p>
                <div>
                  <p className="text-xs font-semibold mb-2">{selStatic.category === "IOW" ? "IOW 기준값" : "주요 운전 가이드값"}</p>
                  <div className="space-y-1">
                    {selStatic.items.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 rounded bg-muted/50 text-xs font-mono">
                        <Settings className="h-3 w-3 text-muted-foreground shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
                <Button variant="outline" className="w-full gap-1.5"><Eye className="h-4 w-4" />전체 가이드 보기</Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Repeatable Guide Detail */}
        <Dialog open={!!selRepeat} onOpenChange={() => setSelRepeat(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="text-base">{selRepeat?.title}</DialogTitle></DialogHeader>
            {selRepeat && (
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div><span className="text-muted-foreground">ID:</span> {selRepeat.id}</div>
                  <div><span className="text-muted-foreground">공정:</span> {selRepeat.process}</div>
                  <div><span className="text-muted-foreground">주기:</span> {selRepeat.frequency}</div>
                  <div><span className="text-muted-foreground">버전:</span> v{selRepeat.version}</div>
                  <div><span className="text-muted-foreground">최근 발행:</span> {selRepeat.lastIssued}</div>
                  <div><span className="text-muted-foreground">사용횟수:</span> {selRepeat.usageCount}회</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs font-medium mb-1">트리거 조건</p>
                  <p className="text-sm">{selRepeat.trigger}</p>
                </div>
                <p className="text-sm text-muted-foreground">{selRepeat.description}</p>
                <Button className="w-full gap-1.5"><RefreshCw className="h-4 w-4" />가이드 실행</Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  )
}
