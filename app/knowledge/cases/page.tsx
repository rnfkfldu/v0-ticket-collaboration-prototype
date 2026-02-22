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
import {
  Search, FileText, Clock, CheckCircle, AlertTriangle, Calendar,
  ChevronRight, Filter, Tag, Eye, ExternalLink, Minus, Activity,
  Bell, Wrench, Users, BookOpen
} from "lucide-react"
import { cn } from "@/lib/utils"

// -- Closed Events/Alerts --
const CLOSED_EVENTS = [
  { id: "TKT-2024-0089", title: "VDU H-1001 Heater Trip 원인 분석", type: "event", process: "VDU", category: "트러블슈팅", status: "closed", severity: "critical", date: "2025-01-31", closedDate: "2025-02-04", owner: "최지훈", resolution: "Burner Tip 교체 후 정상화", hasReport: true },
  { id: "TKT-2024-0045", title: "E-101 Online Cleaning 계획 수립 및 실행", type: "event", process: "CDU", category: "정비", status: "closed", severity: "high", date: "2024-11-10", closedDate: "2024-12-05", owner: "박엔지니어", resolution: "Chemical Cleaning 실시, UA값 85% 회복", hasReport: true },
  { id: "TKT-2024-0032", title: "HCR 촉매 WABT 상승 추이 분석", type: "event", process: "HCR", category: "최적화", status: "closed", severity: "high", date: "2024-10-15", closedDate: "2024-12-20", owner: "김철수", resolution: "Arabian Medium 전환 영향 분석 완료, EOR 시점 재산정", hasReport: true },
  { id: "TKT-2024-0028", title: "CCR Regenerator Coke 분포 이상", type: "event", process: "CCR", category: "트러블슈팅", status: "closed", severity: "medium", date: "2024-09-20", closedDate: "2024-10-15", owner: "이연구원", resolution: "Air distribution 조정으로 정상화", hasReport: true },
  { id: "TKT-2024-0021", title: "FCC Slide Valve 작동 불량", type: "event", process: "FCC", category: "정비", status: "closed", severity: "high", date: "2024-08-05", closedDate: "2024-09-10", owner: "정수민", resolution: "TA 중 Valve Overhaul 완료", hasReport: false },
  { id: "TKT-2024-0015", title: "SRU Tail Gas SO2 농도 초과", type: "event", process: "SRU", category: "환경", status: "closed", severity: "critical", date: "2024-07-12", closedDate: "2024-07-20", owner: "김환경", resolution: "Catalyst bed 교체 및 Air/Acid gas ratio 조정", hasReport: true },
  { id: "ALT-2024-112", title: "CDU Overhead Corrosion Rate 상승 알림", type: "alert", process: "CDU", category: "설비건전성", status: "closed", severity: "high", date: "2024-12-01", closedDate: "2024-12-15", owner: "박엔지니어", resolution: "Neutralizer 주입량 조정", hasReport: false },
  { id: "ALT-2024-098", title: "HCR High Pressure Separator Level 이상", type: "alert", process: "HCR", category: "트러블슈팅", status: "closed", severity: "medium", date: "2024-11-15", closedDate: "2024-11-18", owner: "김철수", resolution: "LCV 재교정 완료", hasReport: false },
  { id: "TKT-2024-0008", title: "Bio-Diesel 원료 혼합 테스트", type: "event", process: "HCR", category: "최적화", status: "closed", severity: "medium", date: "2024-06-01", closedDate: "2024-07-15", owner: "박연구원", resolution: "혼합비 5% 성공, 10% 추가 테스트 필요", hasReport: true },
  { id: "TKT-2023-0112", title: "Opportunity Crude 도입 운전 영향 분석", type: "event", process: "CDU", category: "최적화", status: "closed", severity: "medium", date: "2023-07-01", closedDate: "2023-08-15", owner: "김철수", resolution: "Crude Blend Matrix 업데이트 완료", hasReport: true },
]

// -- Operation Logs --
const OP_LOGS = [
  { id: "LOG-0204-D", date: "2025-02-04", shift: "주간", process: "HCR", operator: "김철수", summary: "정상 운전 유지. WABT 386C 안정.", details: "모든 운전 변수 정상 범위 내. Feed rate 285 m3/h." },
  { id: "LOG-0204-N", date: "2025-02-04", shift: "야간", process: "CDU", operator: "박민수", summary: "Crude 전환 진행 중 (Arab Light -> Arab Medium)", details: "전환 시작 22:00. Column profile 안정적." },
  { id: "LOG-0203-D", date: "2025-02-03", shift: "주간", process: "VDU", operator: "최지훈", summary: "Heater Trip 복구 후 안정 운전", details: "H-1001 정상 가동 확인. Vacuum 780mmHg 유지." },
  { id: "LOG-0203-N", date: "2025-02-03", shift: "야간", process: "HCR", operator: "이영희", summary: "Reactor Inlet Temp 상승 추세 주의", details: "TI-2001 392C 기록. Quench 조정 실시." },
  { id: "LOG-0202-D", date: "2025-02-02", shift: "주간", process: "CCR", operator: "정수민", summary: "촉매 재생 사이클 완료", details: "재생 후 활성도 회복 양호. RON 확인 예정." },
  { id: "LOG-0202-N", date: "2025-02-02", shift: "야간", process: "FCC", operator: "한기술", summary: "Riser Outlet Temp 조정", details: "ROT 525C->528C. Gasoline yield 소폭 증가 확인." },
  { id: "LOG-0201-D", date: "2025-02-01", shift: "주간", process: "SRU", operator: "김환경", summary: "Tail Gas 농도 정상 범위", details: "SO2 12ppm. Catalyst 교체 후 안정." },
  { id: "LOG-0201-N", date: "2025-02-01", shift: "야간", process: "CDU", operator: "박민수", summary: "정상 운전 유지", details: "Feed 305 m3/h. 제품 Spec 충족." },
  { id: "LOG-0131-D", date: "2025-01-31", shift: "주간", process: "HCR", operator: "김철수", summary: "Feed Sulfur 변동 모니터링", details: "Feed S 1.8%->2.1%. H2/HC ratio 유지." },
  { id: "LOG-0131-N", date: "2025-01-31", shift: "야간", process: "VDU", operator: "최지훈", summary: "H-1001 Heater Trip 발생", details: "22:30 Trip. 원인 조사 착수. 감량운전 개시." },
]

// -- Meetings/TOB --
const MEETINGS = [
  { id: "MTG-0204", date: "2025-02-04", type: "TOB", title: "2/4 생산 TOB", process: "공통", attendees: 12, summary: "HCR WABT 주의, VDU Heater 복구 확인, CDU Crude 전환 D+1", decisions: ["HCR Quench 추가 조정 승인", "VDU Heater 정밀 점검 일정 확정"], keyItems: "HCR 모니터링 강화 지시" },
  { id: "MTG-0203", date: "2025-02-03", type: "TOB", title: "2/3 생산 TOB", process: "공통", attendees: 11, summary: "VDU Heater Trip 후속 조치, CCR 재생 결과 공유", decisions: ["VDU Heater Trip 원인 분석 TF 구성"], keyItems: "Heater Trip 원인 규명 지시" },
  { id: "MTG-0201-W", date: "2025-02-01", type: "주간회의", title: "2월 1주차 공정기술 주간회의", process: "공통", attendees: 15, summary: "월간 KPI 리뷰, 장기건전성 Red 항목 공유, 개선과제 진행 점검", decisions: ["F-E102A Cleaning 계획 수립 지시", "HCR 촉매 수명 예측 재검토"], keyItems: "Fouling Red 항목 즉시 조치" },
  { id: "MTG-0128", date: "2025-01-28", type: "TOB", title: "1/28 생산 TOB", process: "공통", attendees: 10, summary: "일상 운전 현황 공유. 특이사항 없음.", decisions: [], keyItems: "" },
  { id: "MTG-0127-M", date: "2025-01-27", type: "월간리뷰", title: "1월 월간 운전 리뷰", process: "공통", attendees: 20, summary: "1월 운전 실적 종합 리뷰. EII 목표 대비 -2.1. OA 96.5%.", decisions: ["CDU Preheat Train 최적화 프로젝트 착수", "FCC Catalyst 사용량 절감 목표 설정"], keyItems: "에너지 효율 개선 중점 추진" },
  { id: "MTG-0121-W", date: "2025-01-21", type: "주간회의", title: "1월 4주차 공정기술 주간회의", process: "공통", attendees: 14, summary: "SRU Catalyst 교체 결과, Bio-Diesel 추가 테스트 계획", decisions: ["Bio-Diesel 10% 혼합 테스트 승인"], keyItems: "" },
]

const PROCESSES = ["전체", "CDU", "VDU", "HCR", "CCR", "FCC", "SRU", "공통"]

export default function CasesPage() {
  const searchParams = useSearchParams()
  const initialTab = searchParams.get("tab") || "events"
  const [tab, setTab] = useState(initialTab)
  const [search, setSearch] = useState("")
  const [processFilter, setProcessFilter] = useState("전체")
  const [selectedEvent, setSelectedEvent] = useState<typeof CLOSED_EVENTS[0] | null>(null)
  const [selectedMeeting, setSelectedMeeting] = useState<typeof MEETINGS[0] | null>(null)

  const filteredEvents = CLOSED_EVENTS.filter(e => {
    if (search && !e.title.toLowerCase().includes(search.toLowerCase()) && !e.id.toLowerCase().includes(search.toLowerCase())) return false
    if (processFilter !== "전체" && e.process !== processFilter) return false
    return true
  })
  const filteredLogs = OP_LOGS.filter(l => {
    if (search && !l.summary.toLowerCase().includes(search.toLowerCase())) return false
    if (processFilter !== "전체" && l.process !== processFilter) return false
    return true
  })
  const filteredMeetings = MEETINGS.filter(m => {
    if (search && !m.title.toLowerCase().includes(search.toLowerCase()) && !m.summary.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="px-6 py-4">
            <h1 className="text-lg font-semibold">운영사례 / 케이스</h1>
            <p className="text-sm text-muted-foreground mt-1">종결된 이벤트, 운영 로그, 생산 TOB, 회의록 등 시스템에서 자산화한 업무 내역을 조회합니다</p>
          </div>
        </header>

        <main className="p-6 space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="검색..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                </div>
                <Select value={processFilter} onValueChange={setProcessFilter}>
                  <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>{PROCESSES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="events" className="gap-1.5"><FileText className="h-3.5 w-3.5" />종결 이벤트/Alert <Badge variant="secondary" className="ml-1 text-[10px] h-4">{filteredEvents.length}</Badge></TabsTrigger>
              <TabsTrigger value="logs" className="gap-1.5"><Activity className="h-3.5 w-3.5" />운영 로그 <Badge variant="secondary" className="ml-1 text-[10px] h-4">{filteredLogs.length}</Badge></TabsTrigger>
              <TabsTrigger value="meetings" className="gap-1.5"><Users className="h-3.5 w-3.5" />회의록/TOB <Badge variant="secondary" className="ml-1 text-[10px] h-4">{filteredMeetings.length}</Badge></TabsTrigger>
            </TabsList>

            {/* Events tab */}
            <TabsContent value="events" className="space-y-2 mt-4">
              {filteredEvents.map(ev => (
                <Card key={ev.id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setSelectedEvent(ev)}>
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-2 h-2 rounded-full shrink-0", ev.severity === "critical" ? "bg-red-500" : ev.severity === "high" ? "bg-amber-500" : "bg-emerald-500")} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground">{ev.id}</span>
                          <Badge variant="outline" className="text-[10px] h-4">{ev.type === "event" ? "이벤트" : "Alert"}</Badge>
                          <Badge variant="outline" className="text-[10px] h-4">{ev.process}</Badge>
                          <Badge variant="outline" className="text-[10px] h-4">{ev.category}</Badge>
                          {ev.hasReport && <Badge className="text-[10px] h-4 bg-blue-100 text-blue-700 border-blue-200">Report</Badge>}
                        </div>
                        <p className="text-sm font-medium mt-1 truncate">{ev.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{ev.resolution}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[11px] text-muted-foreground">{ev.closedDate} 종결</p>
                        <p className="text-[11px] text-muted-foreground">{ev.owner}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* Logs tab */}
            <TabsContent value="logs" className="space-y-2 mt-4">
              {filteredLogs.map(log => (
                <Card key={log.id}>
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="text-center shrink-0 w-16">
                        <p className="text-xs font-semibold">{log.date.slice(5)}</p>
                        <Badge variant={log.shift === "주간" ? "secondary" : "outline"} className="text-[10px] h-4 mt-0.5">{log.shift}</Badge>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] h-4">{log.process}</Badge>
                          <span className="text-xs text-muted-foreground">{log.operator}</span>
                        </div>
                        <p className="text-sm font-medium mt-0.5">{log.summary}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{log.details}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* Meetings tab */}
            <TabsContent value="meetings" className="space-y-2 mt-4">
              {filteredMeetings.map(mtg => (
                <Card key={mtg.id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setSelectedMeeting(mtg)}>
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="text-center shrink-0 w-16">
                        <p className="text-xs font-semibold">{mtg.date.slice(5)}</p>
                        <Badge variant={mtg.type === "TOB" ? "secondary" : mtg.type === "주간회의" ? "outline" : "default"} className="text-[10px] h-4 mt-0.5">{mtg.type}</Badge>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{mtg.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{mtg.summary}</p>
                        {mtg.decisions.length > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <CheckCircle className="h-3 w-3 text-emerald-500 shrink-0" />
                            <span className="text-[11px] text-emerald-700">의결 {mtg.decisions.length}건</span>
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{mtg.attendees}명</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </main>

        {/* Event Detail Dialog */}
        <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="text-base">{selectedEvent?.title}</DialogTitle></DialogHeader>
            {selectedEvent && (
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div><span className="text-muted-foreground">ID:</span> <span className="font-mono">{selectedEvent.id}</span></div>
                  <div><span className="text-muted-foreground">공정:</span> {selectedEvent.process}</div>
                  <div><span className="text-muted-foreground">카테고리:</span> {selectedEvent.category}</div>
                  <div><span className="text-muted-foreground">담당:</span> {selectedEvent.owner}</div>
                  <div><span className="text-muted-foreground">발생:</span> {selectedEvent.date}</div>
                  <div><span className="text-muted-foreground">종결:</span> {selectedEvent.closedDate}</div>
                </div>
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                  <p className="text-xs font-medium text-emerald-800 mb-1">최종 조치 결과</p>
                  <p className="text-sm text-emerald-700">{selectedEvent.resolution}</p>
                </div>
                {selectedEvent.hasReport && (
                  <Button variant="outline" className="w-full gap-2 text-blue-600 border-blue-200 hover:bg-blue-50">
                    <FileText className="h-4 w-4" /> 최종 레포트 보기
                  </Button>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Meeting Detail Dialog */}
        <Dialog open={!!selectedMeeting} onOpenChange={() => setSelectedMeeting(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="text-base">{selectedMeeting?.title}</DialogTitle></DialogHeader>
            {selectedMeeting && (
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div><span className="text-muted-foreground">일자:</span> {selectedMeeting.date}</div>
                  <div><span className="text-muted-foreground">유형:</span> {selectedMeeting.type}</div>
                  <div><span className="text-muted-foreground">참석:</span> {selectedMeeting.attendees}명</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs font-medium mb-1">회의 요약</p>
                  <p className="text-sm">{selectedMeeting.summary}</p>
                </div>
                {selectedMeeting.decisions.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium">의결 사항</p>
                    {selectedMeeting.decisions.map((d, i) => (
                      <div key={i} className="flex items-start gap-2 p-2 rounded bg-emerald-50 border border-emerald-100">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-xs">{d}</span>
                      </div>
                    ))}
                  </div>
                )}
                {selectedMeeting.keyItems && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <p className="text-xs font-medium text-amber-800 mb-1">핵심 지시사항</p>
                    <p className="text-sm text-amber-700">{selectedMeeting.keyItems}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  )
}
