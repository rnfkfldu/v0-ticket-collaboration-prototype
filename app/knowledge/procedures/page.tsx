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
  Shield, Search, FileText, Clock, ChevronRight, ExternalLink,
  History, AlertTriangle, CheckCircle, Link2, BarChart3, Eye
} from "lucide-react"
import { cn } from "@/lib/utils"

type DocType = "sop" | "live" | "monitoring"
type VersionEntry = { ver: string; date: string; author: string; summary: string }

interface ProcedureDoc {
  id: string
  title: string
  type: DocType
  process: string
  status: "approved" | "draft" | "review"
  currentVersion: string
  lastUpdated: string
  owner: string
  description: string
  versions?: VersionEntry[]
  linkedDashboard?: string
  linkedTrendBundle?: string
  sections?: string[]
}

const PROCEDURES: ProcedureDoc[] = [
  // SOP - Static official manuals
  { id: "SOP-001", title: "CDU Emergency Shutdown Procedure", type: "sop", process: "CDU", status: "approved", currentVersion: "Rev.3", lastUpdated: "2024-06-15", owner: "Plant Manager",
    description: "CDU 비상 정지 절차. ESB 작동 후 각 계통별 차단 순서 및 확인 항목을 정의.", sections: ["1. 비상 정지 판단 기준", "2. ESB 작동 절차", "3. 계통별 차단 순서", "4. 확인 항목 체크리스트", "5. 재기동 사전 조건"] },
  { id: "SOP-002", title: "HCR Catalyst Loading/Unloading Manual", type: "sop", process: "HCR", status: "approved", currentVersion: "Rev.2", lastUpdated: "2023-11-20", owner: "TA Manager",
    description: "HCR 촉매 장입/인출 작업 표준 절차. Dense Loading 방식 기준.", sections: ["1. 사전 준비사항", "2. Reactor Isolation", "3. Catalyst Unloading", "4. Reactor Inspection", "5. Dense Loading 절차", "6. 촉매 활성화"] },
  { id: "SOP-003", title: "FCC Startup Procedure", type: "sop", process: "FCC", status: "approved", currentVersion: "Rev.5", lastUpdated: "2024-08-10", owner: "Process Eng.",
    description: "FCC 가동 시 Regenerator Heatup부터 정상 운전까지의 절차.", sections: ["1. Pre-startup Check", "2. Regenerator Heatup", "3. Catalyst Circulation", "4. Feed Introduction", "5. Normal Operation 전환"] },
  { id: "SOP-004", title: "SRU Claus Unit Startup/Shutdown", type: "sop", process: "SRU", status: "approved", currentVersion: "Rev.4", lastUpdated: "2024-04-22", owner: "Process Eng.",
    description: "SRU 가동/정지 절차. Thermal Reactor 가열부터 Tail Gas 관리까지.", sections: ["1. Pre-startup", "2. Thermal Reactor Heatup", "3. Acid Gas Introduction", "4. Normal Operation", "5. Shutdown 절차"] },
  { id: "SOP-005", title: "VDU Vacuum System Operating Manual", type: "sop", process: "VDU", status: "approved", currentVersion: "Rev.3", lastUpdated: "2024-09-05", owner: "Process Eng.",
    description: "VDU 진공 계통 운전 매뉴얼. Ejector, Condenser, Vacuum Column 연계 운전.", sections: ["1. 진공 계통 개요", "2. Ejector 운전", "3. Condenser 관리", "4. Vacuum 이상 시 대응", "5. Leak 점검 절차"] },

  // Live Documents - Contingency Plans, Decision Trees
  { id: "CP-001", title: "CDU Feed Pump Total Failure 대응", type: "live", process: "CDU", status: "approved", currentVersion: "v3.2", lastUpdated: "2025-02-10", owner: "Operations",
    description: "CDU Feed Pump 전수 정지 시 의사결정 트리 및 조치 절차. Standby Pump, 감량운전, ESD 단계별 대응.",
    linkedDashboard: "/operations/custom-dashboard",
    versions: [
      { ver: "v3.2", date: "2025-02-10", author: "이철수", summary: "감량운전 시 Column 온도 프로파일 업데이트" },
      { ver: "v3.1", date: "2025-01-05", author: "김지수", summary: "Standby Pump 가동 절차 보완" },
      { ver: "v3.0", date: "2024-11-20", author: "박영희", summary: "전면 개정 - Decision Tree 재구성" },
      { ver: "v2.1", date: "2024-06-15", author: "이철수", summary: "환경부서 통보 절차 추가" },
    ] },
  { id: "CP-002", title: "Steam Header Pressure Loss 대응", type: "live", process: "Utility", status: "approved", currentVersion: "v2.4", lastUpdated: "2025-01-28", owner: "Operations",
    description: "40kg Steam Header 압력 급락 시 단계별 대응. Boiler 추가 기동, 비필수 차단, 전체 감량.",
    linkedTrendBundle: "steam-monitoring",
    versions: [
      { ver: "v2.4", date: "2025-01-28", author: "최민호", summary: "비필수 소비처 목록 업데이트" },
      { ver: "v2.3", date: "2024-10-10", author: "김지수", summary: "감량 운전 우선순위 조정" },
      { ver: "v2.2", date: "2024-07-05", author: "박영희", summary: "Boiler #3 추가 반영" },
    ] },
  { id: "CP-003", title: "Power Failure 비상대응 계획", type: "live", process: "전체", status: "approved", currentVersion: "v4.1", lastUpdated: "2025-02-05", owner: "Plant Manager",
    description: "전원 상실 시 비상 대응. UPS, Emergency Generator, 수동 조작 절차.",
    linkedDashboard: "/operations/custom-dashboard",
    versions: [
      { ver: "v4.1", date: "2025-02-05", author: "Plant Manager", summary: "Emergency Generator 자동 절체 절차 보완" },
      { ver: "v4.0", date: "2024-09-01", author: "이철수", summary: "전면 개정" },
    ] },
  { id: "DT-001", title: "이상징후 대응 Decision Tree (Fouling)", type: "live", process: "HCR", status: "approved", currentVersion: "v2.0", lastUpdated: "2025-01-15", owner: "Process Eng.",
    description: "열교환기 Fouling 이상 감지 시 단계별 의사결정. Online Cleaning, Bypass, TA 반영 판단.",
    linkedTrendBundle: "fouling-trend-bundle",
    versions: [
      { ver: "v2.0", date: "2025-01-15", author: "김지수", summary: "AI 모델 기반 Projection 연동 추가" },
      { ver: "v1.2", date: "2024-08-20", author: "박영희", summary: "Chemical Cleaning 옵션 추가" },
    ] },
  { id: "DT-002", title: "촉매 수명 관리 Decision Tree", type: "live", process: "HCR", status: "review", currentVersion: "v1.3-draft", lastUpdated: "2025-02-12", owner: "Process Eng.",
    description: "촉매 WABT 트렌드 기반 잔여 수명 판단 및 TA 시점 결정 의사결정 트리.",
    versions: [
      { ver: "v1.3-draft", date: "2025-02-12", author: "김지수", summary: "AI 예측 결과 반영 기준 추가 (검토중)" },
      { ver: "v1.2", date: "2024-12-01", author: "김지수", summary: "Severity 상향 운전 옵션 추가" },
    ] },

  // Monitoring Sheets
  { id: "MS-001", title: "HCR Daily Monitoring Sheet", type: "monitoring", process: "HCR", status: "approved", currentVersion: "v5.0", lastUpdated: "2025-02-01", owner: "당직 근무조",
    description: "HCR 일일 모니터링 시트. 주요 변수 24hr 추이 및 이상 유무 체크.",
    linkedDashboard: "/operations/custom-dashboard",
    versions: [
      { ver: "v5.0", date: "2025-02-01", author: "이철수", summary: "AI 모델 예측값 컬럼 추가" },
      { ver: "v4.3", date: "2024-10-15", author: "김지수", summary: "Fouling Index 항목 추가" },
    ] },
  { id: "MS-002", title: "CDU/VDU Shift Handover Sheet", type: "monitoring", process: "CDU", status: "approved", currentVersion: "v3.1", lastUpdated: "2025-01-20", owner: "당직 근무조",
    description: "CDU/VDU 교대 인수인계 시트. 주요 운전 상태 및 특이사항 기록.",
    versions: [
      { ver: "v3.1", date: "2025-01-20", author: "박영희", summary: "VDU Vacuum 상태 체크항목 추가" },
    ] },
  { id: "MS-003", title: "FCC Catalyst Performance Sheet", type: "monitoring", process: "FCC", status: "approved", currentVersion: "v2.2", lastUpdated: "2025-02-08", owner: "Process Eng.",
    description: "FCC 촉매 성능 주간 모니터링 시트. Activity, Metal, Loss Rate 추적.",
    linkedTrendBundle: "fcc-catalyst-trend",
    versions: [
      { ver: "v2.2", date: "2025-02-08", author: "최민호", summary: "AI 최적 대비 편차 항목 추가" },
      { ver: "v2.1", date: "2024-11-01", author: "최민호", summary: "비용 영향 컬럼 추가" },
    ] },
]

const typeLabels: Record<DocType, string> = { sop: "SOP (공식 매뉴얼)", live: "Live Document", monitoring: "모니터링 시트" }
const typeColors: Record<DocType, string> = { sop: "bg-slate-100 text-slate-700", live: "bg-indigo-100 text-indigo-700", monitoring: "bg-emerald-100 text-emerald-700" }

export default function ProceduresPage() {
  const [activeTab, setActiveTab] = useState<"all" | DocType>("all")
  const [search, setSearch] = useState("")
  const [processFilter, setProcessFilter] = useState("all")
  const [selectedDoc, setSelectedDoc] = useState<ProcedureDoc | null>(null)

  const filtered = PROCEDURES.filter(d => {
    if (activeTab !== "all" && d.type !== activeTab) return false
    if (processFilter !== "all" && d.process !== processFilter) return false
    if (search && !d.title.toLowerCase().includes(search.toLowerCase()) && !d.id.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">절차서/표준 (업무절차)</h1>
          <p className="text-sm text-muted-foreground mt-1">SOP, Contingency Plan, Decision Tree, 모니터링 시트를 통합 관리합니다. Live Document는 버전 관리가 됩니다.</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="문서 검색..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>
          <Select value={processFilter} onValueChange={setProcessFilter}>
            <SelectTrigger className="w-32 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 공정</SelectItem>
              {["CDU","VDU","HCR","FCC","SRU","Utility","전체"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Tabs value={activeTab} onValueChange={v => setActiveTab(v as typeof activeTab)}>
          <TabsList>
            <TabsTrigger value="all">전체 ({PROCEDURES.length})</TabsTrigger>
            <TabsTrigger value="sop">SOP ({PROCEDURES.filter(d=>d.type==="sop").length})</TabsTrigger>
            <TabsTrigger value="live">Live Doc ({PROCEDURES.filter(d=>d.type==="live").length})</TabsTrigger>
            <TabsTrigger value="monitoring">모니터링 시트 ({PROCEDURES.filter(d=>d.type==="monitoring").length})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4 space-y-3">
            {filtered.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">검색 결과가 없습니다.</p>}
            {filtered.map(d => (
              <Card key={d.id} className="cursor-pointer hover:ring-1 hover:ring-primary/30 transition-all" onClick={() => setSelectedDoc(d)}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", typeColors[d.type])}>
                      {d.type === "sop" ? <FileText className="h-4 w-4" /> : d.type === "live" ? <History className="h-4 w-4" /> : <BarChart3 className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold truncate">{d.title}</span>
                        <Badge className={cn("text-[10px] h-4 shrink-0 border-0", typeColors[d.type])}>{typeLabels[d.type]}</Badge>
                        {d.status === "review" && <Badge variant="destructive" className="text-[10px] h-4">검토중</Badge>}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                        <span>{d.process}</span>
                        <span>{d.currentVersion}</span>
                        <span>Updated: {d.lastUpdated}</span>
                        {(d.linkedDashboard || d.linkedTrendBundle) && (
                          <span className="flex items-center gap-0.5 text-blue-500"><Link2 className="h-3 w-3" />연동</span>
                        )}
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

      {/* Document Detail Dialog */}
      <Dialog open={!!selectedDoc} onOpenChange={() => setSelectedDoc(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedDoc && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base">
                  {selectedDoc.type === "sop" ? <Shield className="h-5 w-5 text-slate-600" /> :
                   selectedDoc.type === "live" ? <History className="h-5 w-5 text-indigo-600" /> :
                   <BarChart3 className="h-5 w-5 text-emerald-600" />}
                  {selectedDoc.title}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-5">
                {/* Meta info */}
                <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                  <Badge className={cn("text-[10px] border-0", typeColors[selectedDoc.type])}>{typeLabels[selectedDoc.type]}</Badge>
                  <span>공정: {selectedDoc.process}</span>
                  <span>{selectedDoc.currentVersion}</span>
                  <span>Owner: {selectedDoc.owner}</span>
                  <span>Last: {selectedDoc.lastUpdated}</span>
                  {selectedDoc.status === "review" && <Badge variant="destructive" className="text-[10px]">검토중</Badge>}
                </div>

                {/* Description */}
                <p className="text-sm leading-relaxed">{selectedDoc.description}</p>

                {/* SOP sections */}
                {selectedDoc.sections && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground">목차</h4>
                    {selectedDoc.sections.map((s, i) => (
                      <div key={i} className="text-sm p-2 rounded bg-muted/40 flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        {s}
                      </div>
                    ))}
                  </div>
                )}

                {/* Version history (Live Doc / Monitoring) */}
                {selectedDoc.versions && selectedDoc.versions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground">버전 이력</h4>
                    <div className="relative pl-4 border-l-2 border-muted space-y-3">
                      {selectedDoc.versions.map((v, i) => (
                        <div key={i} className="relative">
                          <div className={cn("absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2",
                            i === 0 ? "bg-primary border-primary" : "bg-background border-muted-foreground/30"
                          )} />
                          <div className="flex items-center gap-2 text-xs">
                            <Badge variant={i === 0 ? "default" : "outline"} className="text-[10px] h-4">{v.ver}</Badge>
                            <span className="text-muted-foreground">{v.date}</span>
                            <span className="text-muted-foreground">by {v.author}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 ml-1">{v.summary}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Linked resources */}
                {(selectedDoc.linkedDashboard || selectedDoc.linkedTrendBundle) && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground">연동 리소스</h4>
                    <div className="flex gap-2 flex-wrap">
                      {selectedDoc.linkedDashboard && (
                        <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" asChild>
                          <a href={selectedDoc.linkedDashboard}>
                            <ExternalLink className="h-3 w-3" />
                            커스텀 대시보드
                          </a>
                        </Button>
                      )}
                      {selectedDoc.linkedTrendBundle && (
                        <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                          <Link2 className="h-3 w-3" />
                          트렌드 묶음: {selectedDoc.linkedTrendBundle}
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* SOP notice */}
                {selectedDoc.type === "sop" && (
                  <div className="p-3 rounded-lg bg-muted/50 border text-xs text-muted-foreground">
                    SOP 문서는 공식 승인 절차를 통해서만 개정됩니다. 변경 요청은 데이터/설정 관리자에게 문의하세요.
                  </div>
                )}
                {selectedDoc.type === "live" && (
                  <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100 text-xs text-indigo-700">
                    Live Document는 Notice를 통해 주기적으로 업데이트되며, 상단의 버전 이력에서 변경 내역을 확인할 수 있습니다.
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
