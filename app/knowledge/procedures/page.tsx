"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Search, FileText, Shield, BookOpen, Clock, ChevronRight, Eye,
  ExternalLink, GitBranch, History, AlertTriangle, Link2, Columns3,
  CheckCircle
} from "lucide-react"
import { cn } from "@/lib/utils"

// -- SOP (정적, 업데이트 안됨) --
const SOP_DOCS = [
  { id: "SOP-001", title: "CDU Emergency Shutdown Procedure", process: "CDU", category: "비상정지", version: "Rev.3", approvedDate: "2023-06-15", owner: "공장장", status: "approved", description: "CDU 비상정지 절차서. ESB 작동 시 순차적 셧다운 절차 및 체크리스트." },
  { id: "SOP-002", title: "HCR Reactor Temperature Runaway Response", process: "HCR", category: "비상대응", version: "Rev.4", approvedDate: "2023-06-15", owner: "공장장", status: "approved", description: "HCR Reactor 온도 폭주 시 비상 대응 절차. Emergency Depressuring 포함." },
  { id: "SOP-003", title: "FCC Slide Valve Manual Operation", process: "FCC", category: "비상조작", version: "Rev.2", approvedDate: "2023-06-15", owner: "공장장", status: "approved", description: "FCC Slide Valve 자동제어 불능 시 수동 조작 절차." },
  { id: "SOP-004", title: "Unit Startup General Procedure", process: "공통", category: "기동", version: "Rev.5", approvedDate: "2024-01-20", owner: "공장장", status: "approved", description: "공정 Unit 기동 시 일반 절차. 유틸리티 확인부터 정상 운전 진입까지." },
  { id: "SOP-005", title: "Unit Shutdown General Procedure", process: "공통", category: "정지", version: "Rev.5", approvedDate: "2024-01-20", owner: "공장장", status: "approved", description: "공정 Unit 정상 정지 절차. 감량 → 순환 → 정지 순서." },
  { id: "SOP-006", title: "VDU Vacuum System Loss Response", process: "VDU", category: "비상대응", version: "Rev.2", approvedDate: "2023-06-15", owner: "공장장", status: "approved", description: "VDU 진공 시스템 손실 시 비상 대응 절차." },
  { id: "SOP-007", title: "SRU Emergency Flare Procedure", process: "SRU", category: "비상대응", version: "Rev.3", approvedDate: "2023-06-15", owner: "공장장", status: "approved", description: "SRU 비상 시 Flare Stack 연소 절차." },
  { id: "SOP-008", title: "CCR Catalyst Circulation Loss Response", process: "CCR", category: "비상대응", version: "Rev.2", approvedDate: "2023-06-15", owner: "공장장", status: "approved", description: "CCR 촉매 순환 정지 시 비상 대응 절차." },
]

// -- Live Documents (Notice 통해 업데이트, 버전관리) --
const LIVE_DOCS = [
  { id: "LIVE-001", title: "CDU Feed Pump Total Failure Contingency Plan", process: "CDU", category: "컨틴전시 플랜", version: "v3.2", lastUpdated: "2025-01-15", updatedBy: "이팀장", status: "active", history: [{ ver: "v3.2", date: "2025-01-15", note: "Standby Pump 기동 시간 기준 업데이트" }, { ver: "v3.1", date: "2024-09-10", note: "감량운전 기준 50%->40% 변경" }, { ver: "v3.0", date: "2024-06-15", note: "최초 승인" }], linkedDashboard: "/operations/health/overview", description: "CDU Feed Pump Trip 시 대응 절차. Decision Tree 포함." },
  { id: "LIVE-002", title: "Steam Header Pressure Loss Contingency Plan", process: "Utility", category: "컨틴전시 플랜", version: "v2.1", lastUpdated: "2025-01-10", updatedBy: "이팀장", status: "active", history: [{ ver: "v2.1", date: "2025-01-10", note: "Boiler 기동 시간 업데이트" }, { ver: "v2.0", date: "2024-06-15", note: "최초 승인" }], linkedDashboard: null, description: "Steam Header 압력 손실 시 대응 절차." },
  { id: "LIVE-003", title: "HCR Compressor Trip Contingency Plan", process: "HCR", category: "컨틴전시 플랜", version: "v2.0", lastUpdated: "2024-12-20", updatedBy: "이팀장", status: "active", history: [{ ver: "v2.0", date: "2024-12-20", note: "Auto Restart 조건 업데이트" }, { ver: "v1.0", date: "2024-03-10", note: "최초 승인" }], linkedDashboard: null, description: "HCR Compressor Trip 시 Auto/Manual 대응 절차." },
  { id: "LIVE-004", title: "HCR WABT Limit Decision Tree", process: "HCR", category: "디시전 트리", version: "v4.1", lastUpdated: "2025-02-03", updatedBy: "김철수", status: "active", history: [{ ver: "v4.1", date: "2025-02-03", note: "Feed 품질별 WABT Limit 추가" }, { ver: "v4.0", date: "2024-11-20", note: "EOR 기준 업데이트" }, { ver: "v3.0", date: "2024-06-15", note: "Arabian Medium 케이스 추가" }], linkedDashboard: "/operations/process/hcr", description: "HCR WABT 한계 도달 시 의사결정 트리. 감량/Feed 변경/TA 결정 기준." },
  { id: "LIVE-005", title: "일일 운전 현황 모니터링 시트", process: "공통", category: "모니터링 시트", version: "v5.3", lastUpdated: "2025-02-04", updatedBy: "기술팀", status: "active", history: [{ ver: "v5.3", date: "2025-02-04", note: "SRU 항목 추가" }, { ver: "v5.2", date: "2025-01-15", note: "건전성 항목 연계" }], linkedDashboard: "/operations/overview", description: "팀 공용 일일 운전 현황 체크리스트. 교대 인수인계 시 사용." },
  { id: "LIVE-006", title: "VDU Heater Coking 관리 시트", process: "VDU", category: "모니터링 시트", version: "v2.1", lastUpdated: "2025-01-28", updatedBy: "최지훈", status: "active", history: [{ ver: "v2.1", date: "2025-01-28", note: "Decoking 기준 업데이트" }, { ver: "v2.0", date: "2024-09-10", note: "최초 승인" }], linkedDashboard: "/operations/health/overview", description: "VDU Heater Coking 진행률 추적 시트." },
  { id: "LIVE-007", title: "CDU Crude Blend Matrix", process: "CDU", category: "디시전 트리", version: "v6.0", lastUpdated: "2025-02-01", updatedBy: "김철수", status: "active", history: [{ ver: "v6.0", date: "2025-02-01", note: "Opportunity Crude 3종 추가" }, { ver: "v5.0", date: "2024-08-15", note: "기존 Matrix 전면 개정" }], linkedDashboard: null, description: "CDU 투입 원유 Blend 조합별 운전 조건 Matrix." },
]

const PROCESSES = ["전체", "CDU", "VDU", "HCR", "CCR", "FCC", "SRU", "Utility", "공통"]

export default function ProceduresPage() {
  const router = useRouter()
  const [tab, setTab] = useState("sop")
  const [search, setSearch] = useState("")
  const [processF, setProcessF] = useState("전체")
  const [selSop, setSelSop] = useState<typeof SOP_DOCS[0] | null>(null)
  const [selLive, setSelLive] = useState<typeof LIVE_DOCS[0] | null>(null)

  const filteredSop = SOP_DOCS.filter(s => {
    if (search && !s.title.toLowerCase().includes(search.toLowerCase())) return false
    if (processF !== "전체" && s.process !== processF) return false
    return true
  })
  const filteredLive = LIVE_DOCS.filter(d => {
    if (search && !d.title.toLowerCase().includes(search.toLowerCase())) return false
    if (processF !== "전체" && d.process !== processF) return false
    return true
  })

  const contingencies = filteredLive.filter(d => d.category === "컨틴전시 플랜")
  const decisionTrees = filteredLive.filter(d => d.category === "디시전 트리")
  const monitorSheets = filteredLive.filter(d => d.category === "모니터링 시트")

  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="px-6 py-4">
            <h1 className="text-lg font-semibold">절차서 / 표준</h1>
            <p className="text-sm text-muted-foreground mt-1">SOP, 컨틴전시 플랜, 디시전 트리, 모니터링 시트 등 공식 문서를 관리합니다</p>
          </div>
        </header>
        <main className="p-6 space-y-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="절차서 검색..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                </div>
                <Select value={processF} onValueChange={setProcessF}><SelectTrigger className="w-28"><SelectValue /></SelectTrigger><SelectContent>{PROCESSES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select>
              </div>
            </CardContent>
          </Card>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="sop" className="gap-1.5"><FileText className="h-3.5 w-3.5" />SOP (공식 매뉴얼) <Badge variant="secondary" className="ml-1 text-[10px] h-4">{filteredSop.length}</Badge></TabsTrigger>
              <TabsTrigger value="live" className="gap-1.5"><GitBranch className="h-3.5 w-3.5" />Live Document <Badge variant="secondary" className="ml-1 text-[10px] h-4">{filteredLive.length}</Badge></TabsTrigger>
            </TabsList>

            {/* SOP Tab */}
            <TabsContent value="sop" className="space-y-2 mt-4">
              <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5 p-2 rounded bg-muted/30">
                <FileText className="h-3.5 w-3.5" />
                SOP는 공식 승인된 절차서로, 온라인 수정이 불가합니다. 개정이 필요한 경우 공식 변경관리 절차를 따르세요.
              </div>
              {filteredSop.map(s => (
                <Card key={s.id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setSelSop(s)}>
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                        <Shield className="h-5 w-5 text-red-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground">{s.id}</span>
                          <Badge variant="outline" className="text-[10px] h-4">{s.process}</Badge>
                          <Badge variant="outline" className="text-[10px] h-4">{s.category}</Badge>
                          <Badge variant="outline" className="text-[10px] h-4">{s.version}</Badge>
                        </div>
                        <p className="text-sm font-medium mt-0.5">{s.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{s.description}</p>
                      </div>
                      <div className="text-right shrink-0 text-xs text-muted-foreground">
                        <p>{s.approvedDate}</p>
                        <p>{s.owner}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* Live Documents Tab */}
            <TabsContent value="live" className="space-y-4 mt-4">
              <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5 p-2 rounded bg-blue-50 border border-blue-100">
                <GitBranch className="h-3.5 w-3.5 text-blue-600" />
                <span className="text-blue-700">Live Document는 Notice를 통해 주기적으로 업데이트되며, 버전 이력이 관리됩니다.</span>
              </div>

              {/* Contingency Plans */}
              {contingencies.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold mb-2 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> 컨틴전시 플랜</h2>
                  <div className="space-y-2">
                    {contingencies.map(d => (
                      <Card key={d.id} className="cursor-pointer hover:bg-muted/30 transition-colors border-amber-100" onClick={() => setSelLive(d)}>
                        <CardContent className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                              <AlertTriangle className="h-5 w-5 text-amber-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px] h-4">{d.process}</Badge>
                                <Badge className="text-[10px] h-4 bg-blue-50 text-blue-700 border-blue-200">{d.version}</Badge>
                                <span className="text-[10px] text-muted-foreground">갱신: {d.lastUpdated}</span>
                                {d.linkedDashboard && <Link2 className="h-3 w-3 text-blue-500" />}
                              </div>
                              <p className="text-sm font-medium mt-0.5">{d.title}</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Decision Trees */}
              {decisionTrees.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold mb-2 flex items-center gap-2"><GitBranch className="h-4 w-4" /> 디시전 트리</h2>
                  <div className="space-y-2">
                    {decisionTrees.map(d => (
                      <Card key={d.id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setSelLive(d)}>
                        <CardContent className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                              <GitBranch className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px] h-4">{d.process}</Badge>
                                <Badge className="text-[10px] h-4 bg-blue-50 text-blue-700 border-blue-200">{d.version}</Badge>
                                <span className="text-[10px] text-muted-foreground">갱신: {d.lastUpdated}</span>
                                {d.linkedDashboard && <Link2 className="h-3 w-3 text-blue-500" />}
                              </div>
                              <p className="text-sm font-medium mt-0.5">{d.title}</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Monitoring Sheets */}
              {monitorSheets.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold mb-2 flex items-center gap-2"><Columns3 className="h-4 w-4" /> 모니터링 시트</h2>
                  <div className="space-y-2">
                    {monitorSheets.map(d => (
                      <Card key={d.id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setSelLive(d)}>
                        <CardContent className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                              <Columns3 className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px] h-4">{d.process}</Badge>
                                <Badge className="text-[10px] h-4 bg-blue-50 text-blue-700 border-blue-200">{d.version}</Badge>
                                <span className="text-[10px] text-muted-foreground">갱신: {d.lastUpdated}</span>
                                {d.linkedDashboard && <Link2 className="h-3 w-3 text-blue-500" />}
                              </div>
                              <p className="text-sm font-medium mt-0.5">{d.title}</p>
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
          </Tabs>
        </main>

        {/* SOP Detail */}
        <Dialog open={!!selSop} onOpenChange={() => setSelSop(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="text-base">{selSop?.title}</DialogTitle></DialogHeader>
            {selSop && (
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div><span className="text-muted-foreground">ID:</span> {selSop.id}</div>
                  <div><span className="text-muted-foreground">공정:</span> {selSop.process}</div>
                  <div><span className="text-muted-foreground">버전:</span> {selSop.version}</div>
                  <div><span className="text-muted-foreground">승인일:</span> {selSop.approvedDate}</div>
                  <div><span className="text-muted-foreground">승인자:</span> {selSop.owner}</div>
                  <div><span className="text-muted-foreground">카테고리:</span> {selSop.category}</div>
                </div>
                <p className="text-sm text-muted-foreground">{selSop.description}</p>
                <div className="p-2 rounded bg-amber-50 border border-amber-200 text-xs text-amber-700 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> 공식 SOP는 변경관리 절차 없이 수정할 수 없습니다.
                </div>
                <Button variant="outline" className="w-full gap-1.5"><Eye className="h-4 w-4" /> 전체 절차서 보기</Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Live Doc Detail */}
        <Dialog open={!!selLive} onOpenChange={() => setSelLive(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="text-base">{selLive?.title}</DialogTitle></DialogHeader>
            {selLive && (
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div><span className="text-muted-foreground">ID:</span> {selLive.id}</div>
                  <div><span className="text-muted-foreground">공정:</span> {selLive.process}</div>
                  <div><span className="text-muted-foreground">현재 버전:</span> <span className="font-semibold">{selLive.version}</span></div>
                  <div><span className="text-muted-foreground">최종 갱신:</span> {selLive.lastUpdated}</div>
                  <div><span className="text-muted-foreground">갱신자:</span> {selLive.updatedBy}</div>
                  <div><span className="text-muted-foreground">유형:</span> {selLive.category}</div>
                </div>
                <p className="text-sm text-muted-foreground">{selLive.description}</p>

                {/* Version History */}
                <div>
                  <p className="text-xs font-semibold mb-2 flex items-center gap-1.5"><History className="h-3.5 w-3.5" /> 버전 이력</p>
                  <div className="space-y-1.5">
                    {selLive.history.map((h, i) => (
                      <div key={i} className={cn("flex items-start gap-3 p-2 rounded text-xs", i === 0 ? "bg-blue-50 border border-blue-100" : "bg-muted/30")}>
                        <Badge variant="outline" className={cn("text-[10px] h-4 shrink-0", i === 0 && "bg-blue-100 text-blue-700 border-blue-200")}>{h.ver}</Badge>
                        <div className="flex-1 min-w-0">
                          <p className={cn(i === 0 ? "font-medium" : "text-muted-foreground")}>{h.note}</p>
                        </div>
                        <span className="text-muted-foreground shrink-0">{h.date}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 gap-1.5"><Eye className="h-4 w-4" /> 문서 보기</Button>
                  {selLive.linkedDashboard && (
                    <Button variant="outline" className="flex-1 gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => { setSelLive(null); router.push(selLive.linkedDashboard!) }}>
                      <ExternalLink className="h-4 w-4" /> 연계 대시보드
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  )
}
