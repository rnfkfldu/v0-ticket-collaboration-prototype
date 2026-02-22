"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import {
  BookOpen, Search, FileText, Settings, Shield, Activity,
  ChevronRight, ExternalLink, Clock, RefreshCw, AlertTriangle,
  Thermometer, Gauge, ArrowUpDown
} from "lucide-react"
import { cn } from "@/lib/utils"

// Static Operation Guide Data
const STATIC_GUIDES = [
  { id: "OG-001", title: "HCR Reactor Operation Guide", process: "HCR", category: "Operation Guide", version: "Rev.5", lastReviewed: "2025-01-10", owner: "Process Eng.", status: "approved",
    params: [
      { name: "Reactor Inlet Temp", tag: "TI-2101", min: 340, max: 400, unit: "deg.C", note: "W600N 모드 기준" },
      { name: "H2/Oil Ratio", tag: "FRC-2102", min: 800, max: 1200, unit: "Nm3/m3", note: "촉매 수명 연장 위해 1000 이상 유지" },
      { name: "Reactor dP", tag: "PDI-2103", min: 0, max: 3.5, unit: "kg/cm2", note: "3.0 이상 시 Alert" },
      { name: "WABT", tag: "TI-2104", min: 360, max: 410, unit: "deg.C", note: "EOR 기준 410" },
      { name: "Quench Gas Flow", tag: "FI-2105", min: 5000, max: 15000, unit: "Nm3/h", note: "Bed간 온도차 조절용" },
    ]},
  { id: "OG-002", title: "CDU Atmospheric Column Guide", process: "CDU", category: "Operation Guide", version: "Rev.8", lastReviewed: "2025-01-05", owner: "Process Eng.", status: "approved",
    params: [
      { name: "Column Top Temp", tag: "TI-1001", min: 105, max: 125, unit: "deg.C", note: "HS원유 기준" },
      { name: "Column Bottom Temp", tag: "TI-1002", min: 340, max: 360, unit: "deg.C", note: "" },
      { name: "Reflux Ratio", tag: "FRC-1003", min: 1.5, max: 3.0, unit: "-", note: "분리효율 확보" },
      { name: "Feed Flow", tag: "FI-1004", min: 200, max: 350, unit: "m3/h", note: "최대 처리량" },
    ]},
  { id: "OG-003", title: "FCC Riser/Regenerator Guide", process: "FCC", category: "Operation Guide", version: "Rev.6", lastReviewed: "2024-12-20", owner: "Process Eng.", status: "approved",
    params: [
      { name: "Riser Outlet Temp", tag: "TI-3001", min: 510, max: 540, unit: "deg.C", note: "전환율 제어 핵심" },
      { name: "Cat/Oil Ratio", tag: "CALC-3002", min: 5, max: 8, unit: "-", note: "" },
      { name: "Regenerator Temp", tag: "TI-3003", min: 680, max: 720, unit: "deg.C", note: "촉매 소손 방지" },
    ]},
  { id: "OG-004", title: "VDU Vacuum Column Guide", process: "VDU", category: "Operation Guide", version: "Rev.4", lastReviewed: "2025-01-08", owner: "Process Eng.", status: "approved",
    params: [
      { name: "Top Vacuum", tag: "PI-4001", min: 15, max: 30, unit: "mmHgA", note: "진공도 유지 필수" },
      { name: "Flash Zone Temp", tag: "TI-4002", min: 380, max: 410, unit: "deg.C", note: "" },
      { name: "Slop Wax Flow", tag: "FI-4003", min: 0, max: 15, unit: "m3/h", note: "과다시 열효율 저하" },
    ]},
  { id: "OG-005", title: "SRU Claus Reactor Guide", process: "SRU", category: "Operation Guide", version: "Rev.3", lastReviewed: "2024-11-15", owner: "Process Eng.", status: "approved",
    params: [
      { name: "Reaction Furnace Temp", tag: "TI-5001", min: 1000, max: 1250, unit: "deg.C", note: "" },
      { name: "H2S/SO2 Ratio", tag: "AI-5002", min: 1.8, max: 2.2, unit: "-", note: "최적 2.0" },
      { name: "Tail Gas H2S", tag: "AI-5003", min: 0, max: 150, unit: "ppm", note: "환경 규제치" },
    ]},
  // IOW (Integrity Operating Window)
  { id: "IOW-001", title: "HCR High Temp H2 Attack IOW", process: "HCR", category: "IOW", version: "Rev.2", lastReviewed: "2025-01-12", owner: "Inspection", status: "approved",
    params: [
      { name: "Reactor Wall Temp", tag: "TI-2201", min: 0, max: 454, unit: "deg.C", note: "Nelson Curve 기준" },
      { name: "H2 Partial Pressure", tag: "PI-2202", min: 0, max: 180, unit: "kg/cm2", note: "Material Limit" },
    ]},
  { id: "IOW-002", title: "CDU Overhead Corrosion IOW", process: "CDU", category: "IOW", version: "Rev.3", lastReviewed: "2025-01-05", owner: "Inspection", status: "approved",
    params: [
      { name: "Overhead pH", tag: "AI-1101", min: 5.5, max: 7.0, unit: "-", note: "산성 부식 방지" },
      { name: "Chloride Content", tag: "AI-1102", min: 0, max: 20, unit: "ppm", note: "" },
      { name: "Iron Content", tag: "AI-1103", min: 0, max: 1.0, unit: "ppm", note: "부식 지표" },
    ]},
  { id: "IOW-003", title: "FCC Regenerator Erosion IOW", process: "FCC", category: "IOW", version: "Rev.2", lastReviewed: "2024-12-18", owner: "Inspection", status: "approved",
    params: [
      { name: "Cyclone dP", tag: "PDI-3101", min: 50, max: 200, unit: "mmH2O", note: "촉매 손실 지표" },
      { name: "Stack Opacity", tag: "AI-3102", min: 0, max: 20, unit: "%", note: "환경 규제" },
    ]},
]

// Repeatable Guide Data
const REPEATABLE_GUIDES = [
  { id: "RG-001", title: "W600N 모드 전환 가이드", process: "HCR", triggerType: "mode-change", frequency: "수시", lastIssued: "2025-02-01", nextDue: "-", status: "active", assignee: "김지수",
    description: "W600N 모드 전환 시 Reactor Inlet Temp, H2/Oil Ratio 등 주요 변수 조정 절차. 전환 전 촉매 상태 확인 필수.",
    checklist: ["촉매 WABT 여유 확인 (EOR-현재 > 15deg)", "Feed Sulfur 분석 완료", "Quench 밸브 정상 확인", "Mode 전환 운영팀 공지", "변경 후 2hr 안정화 모니터링"] },
  { id: "RG-002", title: "주간 Heat Exchanger Fouling 점검", process: "전체", triggerType: "periodic", frequency: "주 1회", lastIssued: "2025-02-15", nextDue: "2025-02-22", status: "active", assignee: "이철수",
    description: "주요 열교환기의 U값 트렌드 확인 및 Cleaning 필요 여부 판단.",
    checklist: ["U값 트렌드 확인 (건전성 대시보드 참조)", "dP 트렌드 이상 유무", "Fouling Rate 계산 (월간)", "Cleaning Schedule 수립 필요 여부", "결과 운영 로그 기록"] },
  { id: "RG-003", title: "원유 Grade 전환 운전 가이드", process: "CDU", triggerType: "mode-change", frequency: "수시", lastIssued: "2025-02-10", nextDue: "-", status: "active", assignee: "박영희",
    description: "원유 Grade 변경 시 Desalter, Preheat Train, Column 온도 프로파일 조정 절차.",
    checklist: ["신규 원유 Assay 확인", "Desalter 조건 조정", "Preheat Train 열수지 재계산", "Column 온도 프로파일 변경", "제품 품질 1hr 주기 확인"] },
  { id: "RG-004", title: "촉매 활성도 월간 평가", process: "HCR", triggerType: "periodic", frequency: "월 1회", lastIssued: "2025-02-01", nextDue: "2025-03-01", status: "active", assignee: "김지수",
    description: "WABT 트렌드 기반 촉매 Deactivation Rate 계산 및 잔여 수명 예측.",
    checklist: ["WABT 월간 평균 산출", "Deactivation Rate 계산", "EOR 예측일 업데이트", "AI 모델 결과와 비교", "건전성 페이지 업데이트"] },
  { id: "RG-005", title: "FCC 촉매 사용량 주간 점검", process: "FCC", triggerType: "periodic", frequency: "주 1회", lastIssued: "2025-02-14", nextDue: "2025-02-21", status: "active", assignee: "최민호",
    description: "Fresh/E-Cat 투입량 대비 손실량 확인 및 최적 투입량 AI 모델 대비 분석.",
    checklist: ["Fresh Cat 투입량 기록", "E-Cat 물성 분석 (Activity, Metal)", "촉매 손실량 계산", "AI 최적 대비 편차 확인", "비용 영향 분석"] },
  { id: "RG-006", title: "일일 IOW 점검 (전체 공정)", process: "전체", triggerType: "periodic", frequency: "일 1회", lastIssued: "2025-02-18", nextDue: "2025-02-19", status: "active", assignee: "당직 근무조",
    description: "전 공정 IOW 항목 일일 점검. Critical/Standard Window 이탈 여부 확인.",
    checklist: ["Critical IOW 이탈 여부 확인", "Standard IOW 이탈 항목 리스트", "이탈 항목 원인 분석 및 조치 기록", "건전성 대시보드 신호등 확인"] },
  { id: "RG-007", title: "분기 Corrosion Coupon 점검", process: "CDU", triggerType: "periodic", frequency: "분기 1회", lastIssued: "2025-01-05", nextDue: "2025-04-05", status: "upcoming", assignee: "Inspection팀",
    description: "CDU Overhead 계통 Corrosion Coupon 회수 및 부식속도 측정.",
    checklist: ["Coupon 회수 (3개소)", "중량 감소 측정", "부식속도 계산 (mpy)", "IOW 항목 반영", "Inhibitor 주입량 조정 검토"] },
  { id: "RG-008", title: "TA 전 Scope Finalization 가이드", process: "전체", triggerType: "event", frequency: "TA 3개월 전", lastIssued: "2024-11-01", nextDue: "2025-08-01", status: "upcoming", assignee: "TA팀",
    description: "TA Scope 최종 확정 시 건전성 모니터링 결과, 과제 진행 현황, Worklist 최종 검토.",
    checklist: ["건전성 Red/Yellow 항목 전수 검토", "과제 Worklist 최종 확인", "자재 발주 현황 점검", "Scope 변경 사항 이력 확인", "TA 일정 영향 분석"] },
]

export default function OperatingGuidesPage() {
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get("tab") === "repeatable" ? "repeatable" : "static"
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [search, setSearch] = useState("")
  const [processFilter, setProcessFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [selectedGuide, setSelectedGuide] = useState<typeof STATIC_GUIDES[0] | null>(null)
  const [selectedRepeatable, setSelectedRepeatable] = useState<typeof REPEATABLE_GUIDES[0] | null>(null)

  const filteredStatic = STATIC_GUIDES.filter(g => {
    if (processFilter !== "all" && g.process !== processFilter) return false
    if (categoryFilter !== "all" && g.category !== categoryFilter) return false
    if (search && !g.title.toLowerCase().includes(search.toLowerCase()) && !g.id.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const filteredRepeatable = REPEATABLE_GUIDES.filter(g => {
    if (processFilter !== "all" && g.process !== processFilter) return false
    if (search && !g.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">운영 가이드</h1>
          <p className="text-sm text-muted-foreground mt-1">Operation Guide, IOW, 반복성 가이드를 통합 관리합니다.</p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="가이드 검색..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>
          <Select value={processFilter} onValueChange={setProcessFilter}>
            <SelectTrigger className="w-32 h-9"><SelectValue placeholder="공정" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 공정</SelectItem>
              {["CDU","VDU","HCR","FCC","SRU"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
          {activeTab === "static" && (
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-44 h-9"><SelectValue placeholder="카테고리" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="Operation Guide">Operation Guide</SelectItem>
                <SelectItem value="IOW">IOW</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="static">Static Guide (마스터)</TabsTrigger>
            <TabsTrigger value="repeatable">반복성 가이드</TabsTrigger>
          </TabsList>

          {/* --- Static Guides --- */}
          <TabsContent value="static" className="mt-4 space-y-3">
            {filteredStatic.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">검색 결과가 없습니다.</p>}
            {filteredStatic.map(g => (
              <Card key={g.id} className="cursor-pointer hover:ring-1 hover:ring-primary/30 transition-all" onClick={() => setSelectedGuide(g)}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
                      g.category === "IOW" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                    )}>
                      {g.category === "IOW" ? <Shield className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold truncate">{g.title}</span>
                        <Badge variant="outline" className="text-[10px] h-4 shrink-0">{g.category}</Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                        <span>{g.process}</span>
                        <span>{g.version}</span>
                        <span>Last: {g.lastReviewed}</span>
                        <span>{g.params.length}개 항목</span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* --- Repeatable Guides --- */}
          <TabsContent value="repeatable" className="mt-4 space-y-3">
            {filteredRepeatable.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">검색 결과가 없습니다.</p>}
            {filteredRepeatable.map(g => (
              <Card key={g.id} className={cn("cursor-pointer hover:ring-1 hover:ring-primary/30 transition-all",
                g.status === "upcoming" && "border-amber-200 bg-amber-50/30"
              )} onClick={() => setSelectedRepeatable(g)}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
                      g.triggerType === "periodic" ? "bg-emerald-100 text-emerald-700" :
                      g.triggerType === "mode-change" ? "bg-indigo-100 text-indigo-700" :
                      "bg-amber-100 text-amber-700"
                    )}>
                      {g.triggerType === "periodic" ? <RefreshCw className="h-4 w-4" /> :
                       g.triggerType === "mode-change" ? <ArrowUpDown className="h-4 w-4" /> :
                       <AlertTriangle className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold truncate">{g.title}</span>
                        <Badge variant={g.status === "upcoming" ? "secondary" : "outline"} className="text-[10px] h-4 shrink-0">
                          {g.status === "upcoming" ? "예정" : "활성"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                        <span>{g.process}</span>
                        <span>{g.frequency}</span>
                        <span>담당: {g.assignee}</span>
                        {g.nextDue !== "-" && <span className="text-amber-600">Next: {g.nextDue}</span>}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>

      {/* Static Guide Detail Dialog */}
      <Dialog open={!!selectedGuide} onOpenChange={() => setSelectedGuide(null)}>
        <DialogContent className="max-w-2xl">
          {selectedGuide && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedGuide.category === "IOW" ? <Shield className="h-5 w-5 text-amber-600" /> : <BookOpen className="h-5 w-5 text-blue-600" />}
                  {selectedGuide.title}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <Badge variant="outline">{selectedGuide.category}</Badge>
                  <span>공정: {selectedGuide.process}</span>
                  <span>{selectedGuide.version}</span>
                  <span>최종 검토: {selectedGuide.lastReviewed}</span>
                  <span>Owner: {selectedGuide.owner}</span>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">항목</TableHead>
                      <TableHead className="w-[100px]">Tag</TableHead>
                      <TableHead className="w-[60px] text-right">Min</TableHead>
                      <TableHead className="w-[60px] text-right">Max</TableHead>
                      <TableHead className="w-[60px]">단위</TableHead>
                      <TableHead>비고</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedGuide.params.map((p, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium text-sm">{p.name}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{p.tag}</TableCell>
                        <TableCell className="text-right text-sm">{p.min}</TableCell>
                        <TableCell className="text-right text-sm">{p.max}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{p.unit}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{p.note}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Repeatable Guide Detail Dialog */}
      <Dialog open={!!selectedRepeatable} onOpenChange={() => setSelectedRepeatable(null)}>
        <DialogContent className="max-w-lg">
          {selectedRepeatable && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-emerald-600" />
                  {selectedRepeatable.title}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                  <Badge variant="outline">{selectedRepeatable.process}</Badge>
                  <span>주기: {selectedRepeatable.frequency}</span>
                  <span>담당: {selectedRepeatable.assignee}</span>
                  <span>최근: {selectedRepeatable.lastIssued}</span>
                  {selectedRepeatable.nextDue !== "-" && <Badge variant="secondary" className="text-[10px]">Next: {selectedRepeatable.nextDue}</Badge>}
                </div>
                <p className="text-sm">{selectedRepeatable.description}</p>
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground">체크리스트</h4>
                  {selectedRepeatable.checklist.map((item, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm p-2 rounded bg-muted/40">
                      <span className="h-5 w-5 rounded-full border flex items-center justify-center text-xs font-medium shrink-0 mt-0.5">{i + 1}</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
