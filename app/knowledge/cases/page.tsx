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
  Search, FileText, AlertTriangle, CheckCircle, Clock, Calendar, Filter,
  ChevronRight, Eye, Activity, Users, Layers, XCircle, Minus
} from "lucide-react"
import { cn } from "@/lib/utils"

/* ── Closed events/alerts ── */
const CLOSED_EVENTS = [
  { id: "EVT-2025-0012", title: "HCR Reactor Inlet 온도 이상 상승", process: "HCR", type: "alert", severity: "high", closedDate: "2025-02-01", duration: "3일", resolution: "Quench Rate 조정으로 정상화", handler: "김철수", tags: ["온도이상", "Reactor"] },
  { id: "EVT-2025-0009", title: "CDU E-101 UA값 급격 하락", process: "CDU", type: "event", severity: "medium", closedDate: "2025-01-28", duration: "5일", resolution: "Online Chemical Cleaning 실시", handler: "박엔지니어", tags: ["Fouling", "열교환기"] },
  { id: "EVT-2025-0008", title: "VDU Heater H-1001 Trip", process: "VDU", type: "alert", severity: "critical", closedDate: "2025-01-25", duration: "1일", resolution: "Burner 재점화 후 정상화, 원인: Flame Scanner 오작동", handler: "최지훈", tags: ["Trip", "Heater"] },
  { id: "EVT-2024-0156", title: "HCR 촉매 교체 시기 검토", process: "HCR", type: "event", severity: "medium", closedDate: "2024-12-15", duration: "14일", resolution: "EOR 8개월 잔여 확인, TA 반영 결정", handler: "김철수", tags: ["촉매", "WABT"] },
  { id: "EVT-2024-0148", title: "FCC Riser 온도 불균일", process: "FCC", type: "alert", severity: "high", closedDate: "2024-12-02", duration: "2일", resolution: "Feed Nozzle 패턴 조정", handler: "이엔지니어", tags: ["Riser", "온도"] },
  { id: "EVT-2024-0142", title: "CCR Regenerator 차압 상승", process: "CCR", type: "event", severity: "medium", closedDate: "2024-11-20", duration: "7일", resolution: "Screen 교체 및 Fines 제거", handler: "박연구원", tags: ["차압", "Regenerator"] },
  { id: "EVT-2024-0135", title: "SRU Claus 반응기 활성도 저하", process: "SRU", type: "event", severity: "low", closedDate: "2024-11-10", duration: "10일", resolution: "촉매 재생 실시", handler: "정민아", tags: ["Claus", "촉매"] },
  { id: "EVT-2024-0130", title: "KD Column Flooding 발생", process: "KD", type: "alert", severity: "critical", closedDate: "2024-10-28", duration: "1일", resolution: "Feed Rate 감량 후 정상화", handler: "김철수", tags: ["Flooding", "Column"] },
  { id: "EVT-2024-0122", title: "CDU Desalter 전압 이상", process: "CDU", type: "alert", severity: "medium", closedDate: "2024-10-15", duration: "4일", resolution: "Wash Water 주입량 조정", handler: "박엔지니어", tags: ["Desalter", "전기"] },
  { id: "EVT-2024-0118", title: "PE 반응기 온도 프로파일 변경", process: "PE", type: "event", severity: "low", closedDate: "2024-10-05", duration: "6일", resolution: "Grade 변경에 따른 정상 조치", handler: "이영수", tags: ["PE", "온도프로파일"] },
]

/* ── Operation logs ── */
const OP_LOGS = [
  { id: "LOG-0401", date: "2025-02-04", shift: "주간", unit: "HCR", operator: "김철수", status: "normal" as const, summary: "정상 운전 유지. 촉매 활성도 양호", details: "WABT 372.5C, 모든 변수 정상 범위" },
  { id: "LOG-0402", date: "2025-02-04", shift: "주간", unit: "CDU", operator: "박민수", status: "normal" as const, summary: "Arabian Light 원유 운전 중", details: "Crude TBP 정상, Overhead 온도 안정" },
  { id: "LOG-0403", date: "2025-02-03", shift: "야간", unit: "HCR", operator: "이영희", status: "caution" as const, summary: "TI-2001 온도 상승 추세 감지", details: "Reactor Bed #2 온도 +2C/day 상승 추세" },
  { id: "LOG-0404", date: "2025-02-03", shift: "야간", unit: "VDU", operator: "최지훈", status: "normal" as const, summary: "정상 운전, Vacuum 유지 양호", details: "진공도 25mmHg 유지" },
  { id: "LOG-0405", date: "2025-02-02", shift: "주간", unit: "FCC", operator: "이엔지니어", status: "normal" as const, summary: "촉매 보충 완료", details: "E-Cat Activity 68 유지" },
  { id: "LOG-0406", date: "2025-02-02", shift: "주간", unit: "CCR", operator: "박연구원", status: "caution" as const, summary: "Regenerator 압력 미세 상승 관찰", details: "dP 0.05kg/cm2 상승, 모니터링 중" },
  { id: "LOG-0407", date: "2025-02-01", shift: "야간", unit: "VDU", operator: "최지훈", status: "abnormal" as const, summary: "H-1001 Trip 발생 후 복구", details: "Flame Scanner 오작동으로 Trip. 재점화 후 정상화" },
  { id: "LOG-0408", date: "2025-02-01", shift: "주간", unit: "SRU", operator: "정민아", status: "normal" as const, summary: "정상 운전 유지", details: "Tail Gas SO2 기준 이내" },
  { id: "LOG-0409", date: "2025-01-31", shift: "주간", unit: "CDU", operator: "박민수", status: "normal" as const, summary: "원유 전환 완료 (Arabian Medium -> Light)", details: "전환 완료, 2시간 내 안정화" },
  { id: "LOG-0410", date: "2025-01-31", shift: "주간", unit: "HCR", operator: "김철수", status: "normal" as const, summary: "정상 운전", details: "모드 W600N 유지" },
]

/* ── Meetings / TOB ── */
const MEETINGS = [
  { id: "MTG-001", title: "2025.02 Weekly OOP Meeting #5", date: "2025-02-04", type: "weekly" as const, attendees: 8, process: "전체", summary: "HCR 온도 상승 모니터링 현황 공유, CDU 원유 전환 후 안정화 확인, TA Scope 진행 현황 점검", decisions: ["HCR TI-2001 Standing Alert 유지", "E-101 세정 스케줄 확정 (2/10)"] },
  { id: "MTG-002", title: "2025.02 생산 TOB", date: "2025-02-03", type: "tob" as const, attendees: 12, process: "전체", summary: "2월 생산 계획 확정. HCR W600N 모드 유지. CDU Arabian Light 기본 운전. FCC 촉매 보충 완료.", decisions: ["W600N 모드 2월 말까지 유지", "FCC 촉매 추가 보충 불요"] },
  { id: "MTG-003", title: "2025.01 Monthly Review Meeting", date: "2025-01-31", type: "monthly" as const, attendees: 15, process: "전체", summary: "1월 운전 실적 리뷰. EII 98.2%, Operating Cost -2% vs Budget. 주요 이슈: VDU Heater Trip 1건", decisions: ["VDU Heater Flame Scanner PM 주기 단축", "HCR 촉매 수명 분석 보고서 작성 지시"] },
  { id: "MTG-004", title: "2025.01 Weekly OOP Meeting #4", date: "2025-01-28", type: "weekly" as const, attendees: 7, process: "전체", summary: "CDU E-101 Fouling 현황 논의, Chemical Cleaning 계획 수립", decisions: ["Chemical Cleaning 2/10 실시 확정", "세정 약품 발주 진행"] },
  { id: "MTG-005", title: "HCR 촉매 검토 TFT Meeting", date: "2025-01-25", type: "adhoc" as const, attendees: 5, process: "HCR", summary: "HCR 촉매 교체 시기 재검토. WABT 추세 기반 EOR 8개월 잔여 확인.", decisions: ["TA Scope 반영 확정", "촉매 발주 일정 협의"] },
  { id: "MTG-006", title: "2025.01 Weekly OOP Meeting #3", date: "2025-01-21", type: "weekly" as const, attendees: 8, process: "전체", summary: "FCC Riser 온도 안정화 확인, VDU Heater 복구 후 정상 운전 보고", decisions: ["FCC 정상 운전 복귀 확인"] },
  { id: "MTG-007", title: "2025.01 생산 TOB", date: "2025-01-06", type: "tob" as const, attendees: 12, process: "전체", summary: "1월 생산 계획. Crude Blend 비율 조정 (Arabian Medium 30% -> 20%).", decisions: ["원유 전환 1/28 이후 시행", "HCR 모드 유지"] },
]

const PROCESSES = ["전체", "HCR", "CDU", "VDU", "FCC", "CCR", "SRU", "KD", "PE"]
const SEV_COLORS: Record<string, string> = {
  critical: "bg-red-50 text-red-700 border-red-200",
  high: "bg-amber-50 text-amber-700 border-amber-200",
  medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
  low: "bg-blue-50 text-blue-700 border-blue-200",
}
const STATUS_ICON: Record<string, { icon: typeof CheckCircle; cls: string }> = {
  normal: { icon: CheckCircle, cls: "text-emerald-500" },
  caution: { icon: AlertTriangle, cls: "text-amber-500" },
  abnormal: { icon: XCircle, cls: "text-red-500" },
}
const MTG_COLORS: Record<string, string> = {
  weekly: "bg-blue-50 text-blue-700 border-blue-200",
  monthly: "bg-purple-50 text-purple-700 border-purple-200",
  tob: "bg-green-50 text-green-700 border-green-200",
  adhoc: "bg-amber-50 text-amber-700 border-amber-200",
}
const MTG_LABELS: Record<string, string> = { weekly: "Weekly", monthly: "Monthly", tob: "TOB", adhoc: "Ad-hoc" }

export default function CasesPage() {
  const searchParams = useSearchParams()
  const initialTab = searchParams.get("tab") === "logs" ? "logs" : searchParams.get("tab") === "meetings" ? "meetings" : "events"

  const [tab, setTab] = useState(initialTab)
  const [search, setSearch] = useState("")
  const [processFilter, setProcessFilter] = useState("전체")
  const [selectedEvent, setSelectedEvent] = useState<typeof CLOSED_EVENTS[0] | null>(null)
  const [selectedMeeting, setSelectedMeeting] = useState<typeof MEETINGS[0] | null>(null)

  const filteredEvents = CLOSED_EVENTS.filter(e => {
    if (processFilter !== "전체" && e.process !== processFilter) return false
    if (search && !e.title.toLowerCase().includes(search.toLowerCase()) && !e.id.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const filteredLogs = OP_LOGS.filter(l => {
    if (processFilter !== "전체" && l.unit !== processFilter) return false
    if (search && !l.summary.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const filteredMeetings = MEETINGS.filter(m => {
    if (processFilter !== "전체" && m.process !== processFilter && m.process !== "전체") return false
    if (search && !m.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="px-6 py-4">
            <h1 className="text-lg font-semibold">운영사례 / 케이스</h1>
            <p className="text-sm text-muted-foreground mt-1">종결된 이벤트, 운영 로그, 회의록 등 시스템에서 자산화된 업무 내역을 조회합니다</p>
          </div>
        </header>

        <div className="p-6 space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="검색..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
            </div>
            <Select value={processFilter} onValueChange={setProcessFilter}>
              <SelectTrigger className="w-32 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>{PROCESSES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          {/* Tabs */}
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="events" className="gap-1.5"><FileText className="h-3.5 w-3.5" /> 종결 이벤트/Alert <Badge variant="secondary" className="ml-1 h-5 text-[10px]">{filteredEvents.length}</Badge></TabsTrigger>
              <TabsTrigger value="logs" className="gap-1.5"><Activity className="h-3.5 w-3.5" /> 운영 로그 <Badge variant="secondary" className="ml-1 h-5 text-[10px]">{filteredLogs.length}</Badge></TabsTrigger>
              <TabsTrigger value="meetings" className="gap-1.5"><Users className="h-3.5 w-3.5" /> 회의록/TOB <Badge variant="secondary" className="ml-1 h-5 text-[10px]">{filteredMeetings.length}</Badge></TabsTrigger>
            </TabsList>

            {/* Events */}
            <TabsContent value="events" className="mt-4 space-y-2">
              {filteredEvents.map(evt => (
                <Card key={evt.id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setSelectedEvent(evt)}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-muted-foreground">{evt.id}</span>
                        <Badge variant="outline" className={cn("text-[10px] h-4", SEV_COLORS[evt.severity])}>{evt.severity}</Badge>
                        <Badge variant="outline" className="text-[10px] h-4">{evt.type === "alert" ? "Alert" : "Event"}</Badge>
                      </div>
                      <p className="text-sm font-medium truncate">{evt.title}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{evt.process}</span>
                        <span>종결: {evt.closedDate}</span>
                        <span>소요: {evt.duration}</span>
                        <span>담당: {evt.handler}</span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* Logs */}
            <TabsContent value="logs" className="mt-4 space-y-2">
              {filteredLogs.map(log => {
                const SI = STATUS_ICON[log.status] || STATUS_ICON.normal
                return (
                  <Card key={log.id}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <SI.icon className={cn("h-5 w-5 shrink-0", SI.cls)} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-mono text-muted-foreground">{log.id}</span>
                          <Badge variant="outline" className="text-[10px] h-4">{log.unit}</Badge>
                          <Badge variant="outline" className="text-[10px] h-4">{log.shift}</Badge>
                        </div>
                        <p className="text-sm font-medium">{log.summary}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>{log.date}</span>
                          <span>{log.operator}</span>
                          <span className="text-muted-foreground/50">{log.details}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </TabsContent>

            {/* Meetings */}
            <TabsContent value="meetings" className="mt-4 space-y-2">
              {filteredMeetings.map(mtg => (
                <Card key={mtg.id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setSelectedMeeting(mtg)}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={cn("text-[10px] h-4", MTG_COLORS[mtg.type])}>{MTG_LABELS[mtg.type]}</Badge>
                        <span className="text-xs text-muted-foreground">{mtg.date}</span>
                        <span className="text-xs text-muted-foreground">{mtg.attendees}명 참석</span>
                      </div>
                      <p className="text-sm font-medium">{mtg.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{mtg.summary}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>

        {/* Event Detail Dialog */}
        <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-base">{selectedEvent?.title}</DialogTitle>
            </DialogHeader>
            {selectedEvent && (
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/30">
                  <div><span className="text-xs text-muted-foreground">ID</span><p className="font-mono">{selectedEvent.id}</p></div>
                  <div><span className="text-xs text-muted-foreground">공정</span><p>{selectedEvent.process}</p></div>
                  <div><span className="text-xs text-muted-foreground">등급</span><p><Badge variant="outline" className={cn("text-[10px]", SEV_COLORS[selectedEvent.severity])}>{selectedEvent.severity}</Badge></p></div>
                  <div><span className="text-xs text-muted-foreground">종결일</span><p>{selectedEvent.closedDate}</p></div>
                  <div><span className="text-xs text-muted-foreground">소요기간</span><p>{selectedEvent.duration}</p></div>
                  <div><span className="text-xs text-muted-foreground">담당자</span><p>{selectedEvent.handler}</p></div>
                </div>
                <div>
                  <span className="text-xs font-medium">조치 결과</span>
                  <p className="mt-1 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">{selectedEvent.resolution}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {selectedEvent.tags.map(t => <Badge key={t} variant="outline" className="text-[10px] h-5">{t}</Badge>)}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Meeting Detail Dialog */}
        <Dialog open={!!selectedMeeting} onOpenChange={() => setSelectedMeeting(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-base">{selectedMeeting?.title}</DialogTitle>
            </DialogHeader>
            {selectedMeeting && (
              <div className="space-y-4 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn("text-[10px]", MTG_COLORS[selectedMeeting.type])}>{MTG_LABELS[selectedMeeting.type]}</Badge>
                  <span className="text-xs text-muted-foreground">{selectedMeeting.date}</span>
                  <span className="text-xs text-muted-foreground">{selectedMeeting.attendees}명</span>
                </div>
                <div>
                  <span className="text-xs font-medium">요약</span>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{selectedMeeting.summary}</p>
                </div>
                <div>
                  <span className="text-xs font-medium">주요 의사결정</span>
                  <div className="mt-1 space-y-1.5">
                    {selectedMeeting.decisions.map((d, i) => (
                      <div key={i} className="flex items-start gap-2 p-2 rounded bg-muted/50">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-xs">{d}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  )
}
