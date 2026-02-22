"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Search, FileText, Shield, Eye, ChevronRight, RefreshCw,
  ExternalLink, Clock, AlertTriangle, CheckCircle, Link2, Layers
} from "lucide-react"
import { cn } from "@/lib/utils"

/* ── SOP (static, no updates) ── */
const SOPS = [
  { id: "SOP-001", title: "CDU Normal Startup Procedure", process: "CDU", category: "Startup/Shutdown", version: "Rev.5", status: "effective" as const, effectiveDate: "2023-06-15", pages: 32, owner: "공정기술팀", description: "CDU 상압 증류 유닛 정상 기동 절차서. Feed-in부터 정상 운전 전환까지." },
  { id: "SOP-002", title: "CDU Normal Shutdown Procedure", process: "CDU", category: "Startup/Shutdown", version: "Rev.4", status: "effective" as const, effectiveDate: "2023-06-15", pages: 28, owner: "공정기술팀", description: "CDU 정상 정지 절차서." },
  { id: "SOP-003", title: "HCR Emergency Shutdown Procedure", process: "HCR", category: "Emergency", version: "Rev.6", status: "effective" as const, effectiveDate: "2024-01-10", pages: 18, owner: "공정기술팀", description: "HCR 비상 정지 절차서. Reactor Runaway, Total Power Failure 등 시나리오별 대응." },
  { id: "SOP-004", title: "FCC Reactor-Regenerator Startup", process: "FCC", category: "Startup/Shutdown", version: "Rev.3", status: "effective" as const, effectiveDate: "2022-09-20", pages: 45, owner: "공정기술팀", description: "FCC Reactor-Regenerator 기동 절차. Catalyst Circulation 개시부터 Feed-in까지." },
  { id: "SOP-005", title: "VDU Heater Light-off Procedure", process: "VDU", category: "Startup/Shutdown", version: "Rev.2", status: "effective" as const, effectiveDate: "2023-03-01", pages: 15, owner: "공정기술팀", description: "VDU Heater 점화 절차서. Purging, Pilot 점화, Main Burner 점화 순서." },
  { id: "SOP-006", title: "CCR Catalyst Loading Procedure", process: "CCR", category: "Maintenance", version: "Rev.3", status: "effective" as const, effectiveDate: "2024-05-20", pages: 22, owner: "공정기술팀", description: "CCR 촉매 장입 절차. Dense Loading Method 적용." },
  { id: "SOP-007", title: "H2S Leak Emergency Response", process: "전체", category: "Emergency", version: "Rev.4", status: "effective" as const, effectiveDate: "2024-03-15", pages: 12, owner: "안전환경팀", description: "H2S 누출 시 비상 대응 절차. 풍향 확인, 대피, 차단 순서." },
  { id: "SOP-008", title: "Fire Emergency Response Procedure", process: "전체", category: "Emergency", version: "Rev.5", status: "effective" as const, effectiveDate: "2024-06-01", pages: 20, owner: "안전환경팀", description: "화재 발생 시 비상 대응 절차. 초기 소화, 통보, 대피, 진화 팀 운영." },
]

/* ── Live Documents (periodically updated, versioned) ── */
const LIVE_DOCS = [
  { id: "LD-001", title: "CDU Feed Pump Failure Contingency Plan", process: "CDU", category: "Contingency", currentVersion: "v3.2", versions: [{ ver: "v3.2", date: "2025-01-20", note: "Standby Pump 조건 추가" }, { ver: "v3.1", date: "2024-09-15", note: "감량 운전 기준 변경" }, { ver: "v3.0", date: "2024-03-01", note: "초기 등록" }], lastUpdated: "2025-01-20", updatedBy: "김철수", linkedDashboard: "/operations/health/overview", description: "CDU Feed Pump Total Failure 시 대응 컨틴젼시 플랜. Decision Tree 포함.", hasDecisionTree: true, status: "active" as const },
  { id: "LD-002", title: "Steam Header Pressure Loss Contingency", process: "Utility", category: "Contingency", currentVersion: "v2.1", versions: [{ ver: "v2.1", date: "2025-01-10", note: "Boiler 우선순위 변경" }, { ver: "v2.0", date: "2024-06-01", note: "초기 등록" }], lastUpdated: "2025-01-10", updatedBy: "박엔지니어", linkedDashboard: null, description: "40kg Steam Header Pressure Loss 시 대응 플랜.", hasDecisionTree: true, status: "active" as const },
  { id: "LD-003", title: "HCR Catalyst EOR Decision Tree", process: "HCR", category: "Decision Tree", currentVersion: "v4.0", versions: [{ ver: "v4.0", date: "2025-02-01", note: "Arabian Medium 조건 반영" }, { ver: "v3.5", date: "2024-08-10", note: "EOR 기준 온도 변경" }, { ver: "v3.0", date: "2024-01-15", note: "촉매 수명 평가 기준 변경" }, { ver: "v2.0", date: "2023-06-01", note: "초기 등록" }], lastUpdated: "2025-02-01", updatedBy: "김철수", linkedDashboard: "/operations/health/overview", description: "HCR 촉매 EOR 도달 시 의사결정 트리. TA 일정, 경제성 분석 포함.", hasDecisionTree: true, status: "active" as const },
  { id: "LD-004", title: "Opportunity Crude 도입 의사결정 가이드", process: "CDU", category: "Decision Tree", currentVersion: "v2.0", versions: [{ ver: "v2.0", date: "2024-11-01", note: "부식 기준 강화" }, { ver: "v1.0", date: "2023-08-15", note: "초기 등록" }], lastUpdated: "2024-11-01", updatedBy: "박엔지니어", linkedDashboard: null, description: "저가 Opportunity Crude 도입 시 품질/부식 리스크 평가 의사결정 가이드.", hasDecisionTree: true, status: "active" as const },
  { id: "LD-005", title: "공정 모니터링 시트 (주간)", process: "전체", category: "Monitoring Sheet", currentVersion: "v6.1", versions: [{ ver: "v6.1", date: "2025-02-03", note: "PE 공정 추가" }, { ver: "v6.0", date: "2024-12-01", note: "SRU 항목 추가" }], lastUpdated: "2025-02-03", updatedBy: "기술팀", linkedDashboard: null, description: "팀 공용 주간 공정 모니터링 시트. 각 공정 핵심 KPI 정리.", hasDecisionTree: false, status: "active" as const },
  { id: "LD-006", title: "IOW 월간 점검 체크시트", process: "전체", category: "Monitoring Sheet", currentVersion: "v3.0", versions: [{ ver: "v3.0", date: "2025-01-15", note: "IOW 항목 추가" }], lastUpdated: "2025-01-15", updatedBy: "설비팀", linkedDashboard: "/operations/health/overview", description: "전 공정 IOW 준수 현황 월간 점검 시트.", hasDecisionTree: false, status: "active" as const },
]

const PROCESSES = ["전체", "CDU", "HCR", "VDU", "FCC", "CCR", "Utility", "전체"]
const LIVE_CATEGORIES = ["전체", "Contingency", "Decision Tree", "Monitoring Sheet"]
const SOP_CATEGORIES = ["전체", "Startup/Shutdown", "Emergency", "Maintenance"]

export default function ProceduresPage() {
  const [tab, setTab] = useState("sop")
  const [search, setSearch] = useState("")
  const [processFilter, setProcessFilter] = useState("전체")
  const [selectedSop, setSelectedSop] = useState<typeof SOPS[0] | null>(null)
  const [selectedLive, setSelectedLive] = useState<typeof LIVE_DOCS[0] | null>(null)

  const dedupedProcesses = [...new Set(["전체", "CDU", "HCR", "VDU", "FCC", "CCR", "Utility"])]

  const filteredSops = SOPS.filter(s => {
    if (processFilter !== "전체" && s.process !== processFilter && s.process !== "전체") return false
    if (search && !s.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const filteredLive = LIVE_DOCS.filter(d => {
    if (processFilter !== "전체" && d.process !== processFilter && d.process !== "전체") return false
    if (search && !d.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const CAT_COLORS: Record<string, string> = {
    "Startup/Shutdown": "bg-blue-50 text-blue-700 border-blue-200",
    "Emergency": "bg-red-50 text-red-700 border-red-200",
    "Maintenance": "bg-green-50 text-green-700 border-green-200",
    "Contingency": "bg-amber-50 text-amber-700 border-amber-200",
    "Decision Tree": "bg-purple-50 text-purple-700 border-purple-200",
    "Monitoring Sheet": "bg-teal-50 text-teal-700 border-teal-200",
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="px-6 py-4">
            <h1 className="text-lg font-semibold">절차서 / 표준</h1>
            <p className="text-sm text-muted-foreground mt-1">SOP, 컨틴젼시 플랜, 디시젼 트리 등 업무 절차 문서 및 모니터링 시트</p>
          </div>
        </header>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="절차서 검색..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
            </div>
            <Select value={processFilter} onValueChange={setProcessFilter}>
              <SelectTrigger className="w-28 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>{dedupedProcesses.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="sop" className="gap-1.5"><FileText className="h-3.5 w-3.5" /> SOP (공식 절차서) <Badge variant="secondary" className="ml-1 h-5 text-[10px]">{filteredSops.length}</Badge></TabsTrigger>
              <TabsTrigger value="live" className="gap-1.5"><RefreshCw className="h-3.5 w-3.5" /> Live Document <Badge variant="secondary" className="ml-1 h-5 text-[10px]">{filteredLive.length}</Badge></TabsTrigger>
            </TabsList>

            {/* SOP Tab */}
            <TabsContent value="sop" className="mt-4 space-y-2">
              {filteredSops.map(sop => (
                <Card key={sop.id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setSelectedSop(sop)}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[11px] font-mono text-muted-foreground">{sop.id}</span>
                        <Badge variant="outline" className={cn("text-[10px] h-4", CAT_COLORS[sop.category])}>{sop.category}</Badge>
                        <Badge variant="outline" className="text-[10px] h-4">{sop.process}</Badge>
                        <span className="text-[10px] text-muted-foreground">{sop.version}</span>
                      </div>
                      <p className="text-sm font-medium truncate">{sop.title}</p>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                        <span>시행일: {sop.effectiveDate}</span>
                        <span>{sop.pages}p</span>
                        <span>관리: {sop.owner}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] h-5 bg-emerald-50 text-emerald-700 border-emerald-200 shrink-0">유효</Badge>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* Live Document Tab */}
            <TabsContent value="live" className="mt-4 space-y-2">
              {filteredLive.map(doc => (
                <Card key={doc.id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setSelectedLive(doc)}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", doc.hasDecisionTree ? "bg-purple-50" : "bg-teal-50")}>
                      {doc.hasDecisionTree ? <Shield className="h-4 w-4 text-purple-600" /> : <Layers className="h-4 w-4 text-teal-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[11px] font-mono text-muted-foreground">{doc.id}</span>
                        <Badge variant="outline" className={cn("text-[10px] h-4", CAT_COLORS[doc.category])}>{doc.category}</Badge>
                        <Badge variant="outline" className="text-[10px] h-4">{doc.process}</Badge>
                        <span className="text-[10px] text-muted-foreground">{doc.currentVersion}</span>
                      </div>
                      <p className="text-sm font-medium truncate">{doc.title}</p>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {doc.lastUpdated}</span>
                        <span>by {doc.updatedBy}</span>
                        {doc.linkedDashboard && <span className="flex items-center gap-1 text-primary"><Link2 className="h-3 w-3" /> Dashboard 연결</span>}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>

        {/* SOP Detail */}
        <Dialog open={!!selectedSop} onOpenChange={() => setSelectedSop(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle className="text-base">{selectedSop?.title}</DialogTitle></DialogHeader>
            {selectedSop && (
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/30">
                  <div><span className="text-xs text-muted-foreground">ID</span><p className="font-mono text-xs">{selectedSop.id}</p></div>
                  <div><span className="text-xs text-muted-foreground">카테고리</span><p><Badge variant="outline" className={cn("text-[10px]", CAT_COLORS[selectedSop.category])}>{selectedSop.category}</Badge></p></div>
                  <div><span className="text-xs text-muted-foreground">공정</span><p>{selectedSop.process}</p></div>
                  <div><span className="text-xs text-muted-foreground">버전</span><p>{selectedSop.version}</p></div>
                  <div><span className="text-xs text-muted-foreground">시행일</span><p>{selectedSop.effectiveDate}</p></div>
                  <div><span className="text-xs text-muted-foreground">페이지</span><p>{selectedSop.pages}p</p></div>
                </div>
                <div><span className="text-xs font-medium">설명</span><p className="mt-1 text-xs text-muted-foreground leading-relaxed">{selectedSop.description}</p></div>
                <div className="p-2.5 rounded-lg bg-muted/30 border border-border text-[11px] text-muted-foreground flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  SOP는 공식 문서로 시스템 내에서 수정이 불가합니다. 변경 시 관리 부서에 요청하세요.
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs"><Eye className="h-3 w-3" /> 문서 보기</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Live Doc Detail */}
        <Dialog open={!!selectedLive} onOpenChange={() => setSelectedLive(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle className="text-base">{selectedLive?.title}</DialogTitle></DialogHeader>
            {selectedLive && (
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/30">
                  <div><span className="text-xs text-muted-foreground">ID</span><p className="font-mono text-xs">{selectedLive.id}</p></div>
                  <div><span className="text-xs text-muted-foreground">카테고리</span><p><Badge variant="outline" className={cn("text-[10px]", CAT_COLORS[selectedLive.category])}>{selectedLive.category}</Badge></p></div>
                  <div><span className="text-xs text-muted-foreground">공정</span><p>{selectedLive.process}</p></div>
                  <div><span className="text-xs text-muted-foreground">현재 버전</span><p className="font-semibold">{selectedLive.currentVersion}</p></div>
                </div>
                <div><span className="text-xs font-medium">설명</span><p className="mt-1 text-xs text-muted-foreground leading-relaxed">{selectedLive.description}</p></div>
                {/* Version history */}
                <div>
                  <span className="text-xs font-medium">버전 이력</span>
                  <div className="mt-2 space-y-1.5">
                    {selectedLive.versions.map((v, i) => (
                      <div key={v.ver} className={cn("flex items-center gap-3 p-2 rounded text-xs", i === 0 ? "bg-primary/5 border border-primary/10" : "bg-muted/30")}>
                        <Badge variant="outline" className={cn("text-[10px] h-5 shrink-0", i === 0 && "border-primary/30 text-primary")}>{v.ver}</Badge>
                        <span className="text-muted-foreground">{v.date}</span>
                        <span className="flex-1 truncate">{v.note}</span>
                        {i === 0 && <Badge variant="outline" className="text-[9px] h-4 bg-emerald-50 text-emerald-700 border-emerald-200">현재</Badge>}
                      </div>
                    ))}
                  </div>
                </div>
                {selectedLive.linkedDashboard && (
                  <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/10 flex items-center gap-2">
                    <Link2 className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="text-xs">연결된 대시보드:</span>
                    <a href={selectedLive.linkedDashboard} className="text-xs font-medium text-primary hover:underline">{selectedLive.linkedDashboard}</a>
                  </div>
                )}
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs"><Eye className="h-3 w-3" /> 문서 보기</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  )
}
