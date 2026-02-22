"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Search, FileText, AlertTriangle, CheckCircle, Calendar, Clock, User,
  ChevronRight, ExternalLink, Tag, Filter, Layers, Users, MessageSquare
} from "lucide-react"
import { cn } from "@/lib/utils"

/* ========= Closed Events / Alerts ========= */
const CLOSED_EVENTS = [
  { id: "EVT-2024-0089", title: "VDU H-1001 Heater Trip", process: "VDU", severity: "high", date: "2025-01-31", closedDate: "2025-02-02", rootCause: "Flame Scanner 오작동으로 인한 Heater Trip. 수동 Reset 후 정상 복구.", resolution: "Flame Scanner 교체 및 Logic 보완 조치", operator: "최지훈", tags: ["Heater Trip", "Flame Scanner", "VDU"] },
  { id: "EVT-2024-0085", title: "HCR Reactor 온도 이상 상승", process: "HCR", severity: "high", date: "2025-01-20", closedDate: "2025-01-25", rootCause: "Feed Sulfur 함량 급등에 따른 발열 반응 증가", resolution: "Feed 블렌딩 비율 조정 및 WABT 모니터링 강화", operator: "김철수", tags: ["WABT", "촉매", "온도"] },
  { id: "EVT-2024-0081", title: "CDU E-101 UA값 급격 저하", process: "CDU", severity: "medium", date: "2025-01-15", closedDate: "2025-01-18", rootCause: "Shell Side Fouling 가속화 (Crude Blend 변경 영향)", resolution: "Chemical Cleaning 실시, 세정 주기 단축 결정", operator: "박민수", tags: ["Fouling", "열교환기", "세정"] },
  { id: "EVT-2024-0078", title: "FCC Regenerator 온도 편차", process: "FCC", severity: "medium", date: "2025-01-10", closedDate: "2025-01-13", rootCause: "Air Distributor 부분 막힘으로 인한 불균일 연소", resolution: "Air Grid 점검 및 TA Scope 반영", operator: "이연구원", tags: ["FCC", "Regenerator", "온도편차"] },
  { id: "EVT-2024-0075", title: "CCR Net Gas Compressor 진동 상승", process: "CCR", severity: "low", date: "2025-01-05", closedDate: "2025-01-07", rootCause: "Bearing 마모에 의한 진동 Level 상승", resolution: "Bearing 교체 (예비품 사용), PM 주기 변경", operator: "정수민", tags: ["회전기계", "진동", "Bearing"] },
  { id: "EVT-2024-0070", title: "SRU Tail Gas Analyzer 이상", process: "SRU", severity: "medium", date: "2024-12-28", closedDate: "2024-12-30", rootCause: "Analyzer Sample Line 결빙", resolution: "Heat Tracing 보강 및 동절기 관리 절차 수정", operator: "한엔지니어", tags: ["Analyzer", "동절기", "SRU"] },
  { id: "EVT-2024-0065", title: "HCR HP Separator Level 이상", process: "HCR", severity: "high", date: "2024-12-15", closedDate: "2024-12-20", rootCause: "Level Transmitter Drift로 실제 Level 과대 표시", resolution: "LT 교정 및 백업 LT 설치 완료", operator: "김철수", tags: ["Level", "계기", "HCR"] },
  { id: "EVT-2024-0060", title: "CDU Crude Feed Pump 성능 저하", process: "CDU", severity: "low", date: "2024-12-10", closedDate: "2024-12-12", rootCause: "Impeller 마모에 의한 Head 감소", resolution: "예비 펌프 전환 후 임펠러 교체", operator: "박민수", tags: ["펌프", "회전기계", "CDU"] },
  { id: "EVT-2024-0055", title: "VDU HVGO Stripper Level 변동", process: "VDU", severity: "medium", date: "2024-12-01", closedDate: "2024-12-04", rootCause: "Control Valve 포지셔너 불량", resolution: "CV 포지셔너 교체 및 튜닝", operator: "최지훈", tags: ["Control Valve", "Level", "VDU"] },
  { id: "EVT-2024-0050", title: "FCC Slide Valve 동작 지연", process: "FCC", severity: "high", date: "2024-11-20", closedDate: "2024-11-28", rootCause: "Slide Valve Actuator 유압 누설", resolution: "Actuator O-ring 교체 및 유압 시스템 정비", operator: "이연구원", tags: ["FCC", "Slide Valve", "유압"] },
]

/* ========= Operation Logs ========= */
const OP_LOGS = [
  { id: "LOG-0204-D", date: "2025-02-04", shift: "주간", process: "HCR", operator: "김철수", summary: "정상 운전 유지. Feed Sulfur 0.85% 안정. WABT 380 deg.C 유지.", highlights: ["촉매 활성도 양호", "Feed 변동 없음"], weather: "맑음 -2도" },
  { id: "LOG-0204-N", date: "2025-02-04", shift: "야간", process: "CDU", operator: "박민수", summary: "Crude Blend 비율 변경 (Arab Medium 60% -> 55%). E-101 UA 모니터링 중.", highlights: ["Blend 변경", "UA 추이 관찰"], weather: "맑음 -5도" },
  { id: "LOG-0203-D", date: "2025-02-03", shift: "주간", process: "HCR", operator: "이영희", summary: "TI-2001 온도 1.5도 상승 추세. Feed Sulfur 소폭 증가(0.85->0.92%). 모니터링 강화.", highlights: ["온도 상승 추세", "Feed 황 증가"], weather: "흐림 0도" },
  { id: "LOG-0203-N", date: "2025-02-03", shift: "야간", process: "VDU", operator: "최지훈", summary: "정상 운전. HVGO Stripper Level 안정. Heater TMT 정상 범위.", highlights: ["안정 운전"], weather: "흐림 -3도" },
  { id: "LOG-0202-D", date: "2025-02-02", shift: "주간", process: "CDU", operator: "박민수", summary: "정상 운전. Crude Blend 변경 완료(Arab Heavy 도입). 운전 안정.", highlights: ["Crude 변경 완료"], weather: "눈 -1도" },
  { id: "LOG-0202-N", date: "2025-02-02", shift: "야간", process: "FCC", operator: "이연구원", summary: "Cat/Oil Ratio 소폭 조정. Regenerator 온도 안정. Fresh Catalyst 보충 2톤.", highlights: ["C/O 조정", "촉매 보충"], weather: "눈 -4도" },
  { id: "LOG-0201-D", date: "2025-02-01", shift: "주간", process: "VDU", operator: "최지훈", summary: "H-1001 Trip 발생 (09:30). Feed 감량 80% -> 60% 운전. 10:45 복구 완료.", highlights: ["Heater Trip", "감량 운전", "복구"], weather: "흐림 1도" },
  { id: "LOG-0201-N", date: "2025-02-01", shift: "야간", process: "CCR", operator: "정수민", summary: "촉매 재생 완료. Regenerator 안정. Chloride Balance 정상.", highlights: ["촉매 재생 완료"], weather: "맑음 -3도" },
  { id: "LOG-0131-D", date: "2025-01-31", shift: "주간", process: "HCR", operator: "김철수", summary: "Feed Sulfur 함량 증가 추세 관찰 (0.80->0.85%). WABT 모니터링 강화.", highlights: ["Feed 황 증가", "모니터링 강화"], weather: "맑음 -2도" },
  { id: "LOG-0131-N", date: "2025-01-31", shift: "야간", process: "SRU", operator: "한엔지니어", summary: "정상 운전. SO2 Emission 정상 범위. Tail Gas 분석 정상.", highlights: ["환경 수치 정상"], weather: "맑음 -6도" },
]

/* ========= Meetings / TOB ========= */
const MEETINGS = [
  { id: "MTG-0204", date: "2025-02-04", type: "Daily TOB", title: "2/4 생산 TOB 회의", process: "전체", attendees: 12, summary: "전 공정 정상 운전. HCR Feed Sulfur 모니터링 지속. CDU Blend 비율 안정화 확인.", decisions: ["HCR: Feed Sulfur 0.95% 초과 시 Blend 조정", "CDU: 신규 Crude 도입 2월 중순 계획"], duration: "30분" },
  { id: "MTG-0203", date: "2025-02-03", type: "Daily TOB", title: "2/3 생산 TOB 회의", process: "전체", attendees: 11, summary: "VDU Heater Trip 복구 상황 공유. HCR TI-2001 온도 추세 논의.", decisions: ["VDU: Flame Scanner PM 주기 단축 결정", "HCR: WABT 385도 초과 시 Alert 설정"], duration: "45분" },
  { id: "MTG-0131", date: "2025-01-31", type: "Weekly Review", title: "1월 5주차 주간 운전 리뷰", process: "전체", attendees: 15, summary: "월간 KPI 중간 점검. FCC 수율 목표 대비 -1.2% 분석. CCR Catalyst 재생 결과 공유.", decisions: ["FCC: C/O Ratio 최적화 스터디 착수", "CCR: 재생 주기 2주 연장 시험"], duration: "1시간" },
  { id: "MTG-0128", date: "2025-01-28", type: "Daily TOB", title: "1/28 생산 TOB 회의", process: "전체", attendees: 10, summary: "전 공정 정상. SRU Analyzer 이상 후속 조치 완료 확인.", decisions: ["SRU: Heat Tracing 동절기 관리 강화"], duration: "25분" },
  { id: "MTG-0124", date: "2025-01-24", type: "Weekly Review", title: "1월 4주차 주간 운전 리뷰", process: "전체", attendees: 14, summary: "HCR HP Sep Level 이상 종결 브리핑. CDU 펌프 교체 결과.", decisions: ["HCR: Level Transmitter 이중화 TA Scope 반영", "CDU: 예비 펌프 정비 계획 수립"], duration: "50분" },
  { id: "MTG-0120-SP", date: "2025-01-20", type: "Special", title: "HCR 온도 이상 긴급 회의", process: "HCR", attendees: 8, summary: "HCR Reactor 온도 이상 상승 원인 분석 및 대응 방안 논의.", decisions: ["Feed Blend 즉시 조정", "WABT 모니터링 주기 1시간 -> 30분"], duration: "1시간 30분" },
  { id: "MTG-0117", date: "2025-01-17", type: "Weekly Review", title: "1월 3주차 주간 운전 리뷰", process: "전체", attendees: 13, summary: "CDU E-101 세정 결과 공유. FCC Regenerator 온도 편차 조사 진행 현황.", decisions: ["CDU: 세정 주기 4개월 -> 3개월 단축", "FCC: Air Grid TA 점검 Scope 확정"], duration: "55분" },
]

const PROCESSES = ["전체", "CDU", "VDU", "HCR", "CCR", "FCC", "SRU"]

export default function CasesPage() {
  const searchParams = useSearchParams()
  const initialTab = searchParams.get("tab") || "events"
  const [activeTab, setActiveTab] = useState(initialTab)
  const [search, setSearch] = useState("")
  const [processFilter, setProcessFilter] = useState("전체")
  const [selectedEvent, setSelectedEvent] = useState<typeof CLOSED_EVENTS[0] | null>(null)
  const [selectedLog, setSelectedLog] = useState<typeof OP_LOGS[0] | null>(null)
  const [selectedMeeting, setSelectedMeeting] = useState<typeof MEETINGS[0] | null>(null)

  const filteredEvents = CLOSED_EVENTS.filter(e => {
    if (search && !e.title.toLowerCase().includes(search.toLowerCase()) && !e.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))) return false
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
    if (processFilter !== "전체" && m.process !== processFilter && m.process !== "전체") return false
    return true
  })

  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="px-6 py-4">
            <h1 className="text-lg font-semibold">운영사례 / 케이스</h1>
            <p className="text-sm text-muted-foreground mt-1">종결 이벤트, 운영 로그, 생산 TOB, 회의록 등 자산화된 업무 내역을 조회합니다</p>
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

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="events" className="gap-1.5"><AlertTriangle className="h-3.5 w-3.5" />종결 이벤트/Alert <Badge variant="secondary" className="ml-1 text-[10px] h-4">{filteredEvents.length}</Badge></TabsTrigger>
              <TabsTrigger value="logs" className="gap-1.5"><Layers className="h-3.5 w-3.5" />운영 로그 <Badge variant="secondary" className="ml-1 text-[10px] h-4">{filteredLogs.length}</Badge></TabsTrigger>
              <TabsTrigger value="meetings" className="gap-1.5"><Users className="h-3.5 w-3.5" />회의록/TOB <Badge variant="secondary" className="ml-1 text-[10px] h-4">{filteredMeetings.length}</Badge></TabsTrigger>
            </TabsList>

            <TabsContent value="events" className="mt-4 space-y-2">
              {filteredEvents.map(evt => (
                <Card key={evt.id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setSelectedEvent(evt)}>
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground">{evt.id}</span>
                          <span className="text-sm font-medium truncate">{evt.title}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{evt.rootCause}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0">{evt.process}</Badge>
                      <Badge className={cn("text-[10px] shrink-0",
                        evt.severity === "high" && "bg-red-100 text-red-700 border-red-200",
                        evt.severity === "medium" && "bg-amber-100 text-amber-700 border-amber-200",
                        evt.severity === "low" && "bg-emerald-100 text-emerald-700 border-emerald-200",
                      )} variant="outline">{evt.severity === "high" ? "상" : evt.severity === "medium" ? "중" : "하"}</Badge>
                      <span className="text-[10px] text-muted-foreground shrink-0 w-20 text-right">{evt.closedDate}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="logs" className="mt-4 space-y-2">
              {filteredLogs.map(log => (
                <Card key={log.id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setSelectedLog(log)}>
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground">{log.id}</span>
                          <Badge variant="outline" className="text-[10px]">{log.shift}</Badge>
                          <Badge variant="outline" className="text-[10px]">{log.process}</Badge>
                          <span className="text-xs text-muted-foreground">{log.operator}</span>
                        </div>
                        <p className="text-sm mt-0.5 truncate">{log.summary}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">{log.date}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="meetings" className="mt-4 space-y-2">
              {filteredMeetings.map(mtg => (
                <Card key={mtg.id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setSelectedMeeting(mtg)}>
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge className={cn("text-[10px]",
                            mtg.type === "Daily TOB" && "bg-blue-50 text-blue-700 border-blue-200",
                            mtg.type === "Weekly Review" && "bg-indigo-50 text-indigo-700 border-indigo-200",
                            mtg.type === "Special" && "bg-red-50 text-red-700 border-red-200",
                          )} variant="outline">{mtg.type}</Badge>
                          <span className="text-sm font-medium truncate">{mtg.title}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{mtg.summary}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">{mtg.attendees}명</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">{mtg.duration}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0 w-20 text-right">{mtg.date}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Event Detail Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle className="text-base">{selectedEvent?.id} - {selectedEvent?.title}</DialogTitle></DialogHeader>
          {selectedEvent && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground text-xs">공정</span><p className="font-medium">{selectedEvent.process}</p></div>
                <div><span className="text-muted-foreground text-xs">중요도</span><p className="font-medium">{selectedEvent.severity === "high" ? "상" : selectedEvent.severity === "medium" ? "중" : "하"}</p></div>
                <div><span className="text-muted-foreground text-xs">발생일</span><p className="font-medium">{selectedEvent.date}</p></div>
                <div><span className="text-muted-foreground text-xs">종결일</span><p className="font-medium">{selectedEvent.closedDate}</p></div>
              </div>
              <div><span className="text-muted-foreground text-xs">근본 원인</span><p className="mt-1 p-3 bg-muted/40 rounded-lg">{selectedEvent.rootCause}</p></div>
              <div><span className="text-muted-foreground text-xs">조치 내역</span><p className="mt-1 p-3 bg-emerald-50 rounded-lg text-emerald-800 border border-emerald-100">{selectedEvent.resolution}</p></div>
              <div className="flex items-center gap-2 flex-wrap">{selectedEvent.tags.map(t => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Log Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="text-base">{selectedLog?.id} - {selectedLog?.date} {selectedLog?.shift}</DialogTitle></DialogHeader>
          {selectedLog && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-3 gap-3">
                <div><span className="text-muted-foreground text-xs">공정</span><p className="font-medium">{selectedLog.process}</p></div>
                <div><span className="text-muted-foreground text-xs">교대</span><p className="font-medium">{selectedLog.shift}</p></div>
                <div><span className="text-muted-foreground text-xs">운전원</span><p className="font-medium">{selectedLog.operator}</p></div>
              </div>
              <div><span className="text-muted-foreground text-xs">운전 요약</span><p className="mt-1 p-3 bg-muted/40 rounded-lg">{selectedLog.summary}</p></div>
              <div><span className="text-muted-foreground text-xs">주요 사항</span>
                <div className="mt-1 flex flex-wrap gap-1.5">{selectedLog.highlights.map(h => <Badge key={h} variant="outline" className="text-[10px]">{h}</Badge>)}</div>
              </div>
              <div className="text-xs text-muted-foreground">날씨: {selectedLog.weather}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Meeting Detail Dialog */}
      <Dialog open={!!selectedMeeting} onOpenChange={() => setSelectedMeeting(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle className="text-base">{selectedMeeting?.title}</DialogTitle></DialogHeader>
          {selectedMeeting && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-3 gap-3">
                <div><span className="text-muted-foreground text-xs">유형</span><p className="font-medium">{selectedMeeting.type}</p></div>
                <div><span className="text-muted-foreground text-xs">참석</span><p className="font-medium">{selectedMeeting.attendees}명</p></div>
                <div><span className="text-muted-foreground text-xs">소요시간</span><p className="font-medium">{selectedMeeting.duration}</p></div>
              </div>
              <div><span className="text-muted-foreground text-xs">회의 요약</span><p className="mt-1 p-3 bg-muted/40 rounded-lg">{selectedMeeting.summary}</p></div>
              <div><span className="text-muted-foreground text-xs">주요 결정사항</span>
                <div className="mt-1 space-y-1.5">
                  {selectedMeeting.decisions.map((d, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 bg-blue-50 rounded border border-blue-100">
                      <Badge variant="outline" className="text-[10px] h-4 shrink-0 mt-0.5">{i + 1}</Badge>
                      <span className="text-xs text-blue-800">{d}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
