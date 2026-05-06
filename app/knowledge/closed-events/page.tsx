"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search, FileText, AlertTriangle, CheckCircle, ChevronRight,
  ArrowLeft, Tag, Clock, User, ExternalLink
} from "lucide-react"
import { cn } from "@/lib/utils"

/* ========= Closed Events / Alerts ========= */
const CLOSED_EVENTS = [
  { id: "EVT-2024-0089", title: "VDU H-1001 Heater Trip", process: "VDU", severity: "high" as const, date: "2025-01-31", closedDate: "2025-02-02", operator: "최지훈",
    rootCause: "Flame Scanner 오작동으로 인한 Heater Trip. 수동 Reset 후 정상 복구.",
    resolution: "Flame Scanner 교체 및 Logic 보완 조치",
    tags: ["Heater Trip", "Flame Scanner", "VDU"],
    timeline: [
      { time: "09:30", action: "H-1001 Heater Trip 발생. Flame Scanner #2 오작동 감지." },
      { time: "09:35", action: "비상 감량 시작 (80% -> 60%). 운전팀 현장 출동." },
      { time: "09:50", action: "Flame Scanner #2 상태 확인 - Lens Fouling 발견." },
      { time: "10:15", action: "Flame Scanner Lens 세정 후 수동 Reset 시도." },
      { time: "10:45", action: "Heater 재점화 성공. 정상 운전 복구 시작." },
      { time: "12:00", action: "Feed 100% 복구 완료." },
    ],
    impactAnalysis: "비계획 감량 4시간. 생산 손실 약 1,200만원. 제품 Off-spec 발생 없음.",
    preventiveMeasures: ["Flame Scanner Lens 주기 점검 추가 (월 1회)", "Flame Scanner Logic에 Time Delay 추가 (3초)", "예비 Flame Scanner 확보 (2set)"],
    relatedReport: "RPT-T01" },
  { id: "EVT-2024-0085", title: "HCR Reactor 온도 이상 상승", process: "HCR", severity: "high" as const, date: "2025-01-20", closedDate: "2025-01-25", operator: "김철수",
    rootCause: "Feed Sulfur 함량 급등에 따른 발열 반응 증가",
    resolution: "Feed 블렌딩 비율 조정 및 WABT 모니터링 강화",
    tags: ["WABT", "촉매", "온도"],
    timeline: [
      { time: "Day 1 06:00", action: "TI-2101 온도 Alert 발생 (380도 -> 388도, 8시간 상승)." },
      { time: "Day 1 08:00", action: "Feed 분석 결과: Sulfur 0.85% -> 1.05% 급등 확인." },
      { time: "Day 1 10:00", action: "Feed Blend 비율 긴급 조정 (Arab Medium 60% -> 45%)." },
      { time: "Day 2 14:00", action: "Reactor 온도 안정화 확인 (382도)." },
      { time: "Day 5", action: "모니터링 종료. 이벤트 종결." },
    ],
    impactAnalysis: "촉매 Aging 가속 약 2주분 추정. 정상 운전 복구 5일 소요.",
    preventiveMeasures: ["Feed Sulfur 실시간 분석기 설치 검토", "WABT Alert 기준 강화 (385도 -> 383도)", "AI 모델 Feed Quality 변수 반영"],
    relatedReport: "RPT-T03" },
  { id: "EVT-2024-0081", title: "CDU E-101 UA값 급격 저하", process: "CDU", severity: "medium" as const, date: "2025-01-15", closedDate: "2025-01-18", operator: "박민수",
    rootCause: "Shell Side Fouling 가속화 (Crude Blend 변경 영향)",
    resolution: "Chemical Cleaning 실시, 세정 주기 단축 결정",
    tags: ["Fouling", "열교환기", "세정"],
    timeline: [
      { time: "Day 1", action: "UA 모니터링에서 급격 저하 감지 (485 -> 380, 2주간)." },
      { time: "Day 2", action: "Crude Blend 변경(Arab Heavy 도입) 시점과 상관관계 확인." },
      { time: "Day 3", action: "Chemical Cleaning 실시 (12시간). UA 485 회복." },
    ],
    impactAnalysis: "Heater Duty 12% 증가. 연료 추가 비용 약 800만원/월.",
    preventiveMeasures: ["세정 주기 4개월 -> 3개월 단축", "Crude Blend 변경 시 Fouling Rate 사전 예측"],
    relatedReport: "RPT-T02" },
  { id: "EVT-2024-0078", title: "FCC Regenerator 온도 편차", process: "FCC", severity: "medium" as const, date: "2025-01-10", closedDate: "2025-01-13", operator: "이연구원",
    rootCause: "Air Distributor 부분 막힘으로 인한 불균일 연소",
    resolution: "Air Grid 점검 및 TA Scope 반영",
    tags: ["FCC", "Regenerator", "온도편차"],
    timeline: [
      { time: "Day 1", action: "다점 온도 편차 35도 확인 (정상 15도 이내)." },
      { time: "Day 2", action: "Air Flow 분석: 특정 Zone 유량 부족 확인." },
      { time: "Day 3", action: "Air Flow 재분배 수행. 편차 20도로 감소." },
    ],
    impactAnalysis: "촉매 국부 과열에 의한 수명 단축 우려. TA Scope 반영.",
    preventiveMeasures: ["Air Grid TA 교체 Scope 확정", "Thermocouple 추가 설치 (2점)"] },
  { id: "EVT-2024-0075", title: "CCR Net Gas Compressor 진동 상승", process: "CCR", severity: "low" as const, date: "2025-01-05", closedDate: "2025-01-07", operator: "정수민",
    rootCause: "Bearing 마모에 의한 진동 Level 상승",
    resolution: "Bearing 교체 (예비품 사용), PM 주기 변경",
    tags: ["회전기계", "진동", "Bearing"],
    timeline: [
      { time: "Day 1 14:00", action: "진동 Alert 발생 (5.2 -> 7.5 mm/s)." },
      { time: "Day 1 16:00", action: "Bearing Temp 동반 상승 확인. Standby 전환 결정." },
      { time: "Day 2", action: "Bearing 분해 검사. Inner Race 마모 확인." },
      { time: "Day 2 22:00", action: "Bearing 교체 완료. 시운전 정상." },
    ],
    impactAnalysis: "Standby 전환으로 생산 영향 없음. 정비 비용 약 500만원.",
    preventiveMeasures: ["PM 주기 12개월 -> 9개월 변경", "Vibration 연속 모니터링 시스템 도입 검토"],
    relatedReport: "RPT-T09" },
]

const PROCESSES = ["전체", "CDU", "VDU", "HCR", "CCR", "FCC", "SRU"]

export default function ClosedEventsPage() {
  const [search, setSearch] = useState("")
  const [processFilter, setProcessFilter] = useState("전체")
  const [selectedEvent, setSelectedEvent] = useState<typeof CLOSED_EVENTS[0] | null>(null)

  const filteredEvents = CLOSED_EVENTS.filter(e => {
    if (search && !e.title.toLowerCase().includes(search.toLowerCase()) && !e.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))) return false
    if (processFilter !== "전체" && e.process !== processFilter) return false
    return true
  })

  // Detail view
  if (selectedEvent) {
    return (
      <AppShell>
        <div className="min-h-screen bg-background">
          <header className="border-b border-border bg-card">
            <div className="px-6 py-4">
              <Button variant="ghost" size="sm" className="gap-1.5 mb-2 -ml-2" onClick={() => setSelectedEvent(null)}>
                <ArrowLeft className="h-4 w-4" />뒤로
              </Button>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground">{selectedEvent.id}</span>
                  <Badge className={cn("text-[10px]",
                    selectedEvent.severity === "high" && "bg-red-100 text-red-700 border-red-200",
                    selectedEvent.severity === "medium" && "bg-amber-100 text-amber-700 border-amber-200",
                    selectedEvent.severity === "low" && "bg-blue-100 text-blue-700 border-blue-200"
                  )}>
                    {selectedEvent.severity === "high" ? "High" : selectedEvent.severity === "medium" ? "Medium" : "Low"}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                    <CheckCircle className="h-3 w-3 mr-1" />종결
                  </Badge>
                </div>
                <h1 className="text-lg font-bold mt-1">{selectedEvent.title}</h1>
                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{selectedEvent.date} ~ {selectedEvent.closedDate}</span>
                  <span className="flex items-center gap-1"><User className="h-3 w-3" />{selectedEvent.operator}</span>
                  <span>{selectedEvent.process}</span>
                </div>
              </div>
            </div>
          </header>

          <main className="p-6 space-y-4">
            {/* Root Cause & Resolution */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <h3 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />원인 분석
                  </h3>
                  <p className="text-sm">{selectedEvent.rootCause}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <h3 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />조치 사항
                  </h3>
                  <p className="text-sm">{selectedEvent.resolution}</p>
                </CardContent>
              </Card>
            </div>

            {/* Timeline */}
            <Card>
              <CardContent className="pt-4">
                <h3 className="text-xs font-semibold text-muted-foreground mb-3">타임라인</h3>
                <div className="space-y-3">
                  {selectedEvent.timeline.map((t, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="text-[10px] text-muted-foreground w-20 shrink-0 pt-0.5">{t.time}</div>
                      <div className="flex-1 text-sm border-l-2 border-primary/30 pl-3">{t.action}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Impact & Prevention */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <h3 className="text-xs font-semibold text-muted-foreground mb-2">영향 분석</h3>
                  <p className="text-sm">{selectedEvent.impactAnalysis}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <h3 className="text-xs font-semibold text-muted-foreground mb-2">재발 방지 대책</h3>
                  <ul className="text-sm space-y-1">
                    {selectedEvent.preventiveMeasures.map((m, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-primary">•</span>{m}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Tags & Related */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                    {selectedEvent.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                  {selectedEvent.relatedReport && (
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                      <ExternalLink className="h-3 w-3" />관련 레포트: {selectedEvent.relatedReport}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </AppShell>
    )
  }

  // List view
  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card px-6 py-4">
          <h1 className="text-lg font-bold">종결 이벤트/Alert</h1>
          <p className="text-sm text-muted-foreground mt-0.5">종결된 이벤트 및 Alert의 원인 분석, 조치 사항, 재발 방지 대책을 확인합니다</p>
        </header>

        <main className="p-6 space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="이벤트 검색..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={processFilter} onValueChange={setProcessFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROCESSES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-3">
            <Card className="cursor-pointer hover:bg-muted/30" onClick={() => setProcessFilter("전체")}>
              <CardContent className="py-3 text-center">
                <p className="text-xs text-muted-foreground">전체</p>
                <p className="text-2xl font-bold mt-1">{CLOSED_EVENTS.length}</p>
              </CardContent>
            </Card>
            {["high", "medium", "low"].map(sev => (
              <Card key={sev} className="cursor-pointer hover:bg-muted/30">
                <CardContent className="py-3 text-center">
                  <p className={cn("text-xs", sev === "high" && "text-red-600", sev === "medium" && "text-amber-600", sev === "low" && "text-blue-600")}>
                    {sev === "high" ? "High" : sev === "medium" ? "Medium" : "Low"}
                  </p>
                  <p className="text-2xl font-bold mt-1">{CLOSED_EVENTS.filter(e => e.severity === sev).length}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Event List */}
          <div className="space-y-2">
            {filteredEvents.map(event => (
              <Card key={event.id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setSelectedEvent(event)}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                      event.severity === "high" && "bg-red-100",
                      event.severity === "medium" && "bg-amber-100",
                      event.severity === "low" && "bg-blue-100"
                    )}>
                      <AlertTriangle className={cn("h-4 w-4",
                        event.severity === "high" && "text-red-600",
                        event.severity === "medium" && "text-amber-600",
                        event.severity === "low" && "text-blue-600"
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground">{event.id}</span>
                        <span className="text-sm font-medium truncate">{event.title}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                        <span>{event.process}</span>
                        <span>{event.date} ~ {event.closedDate}</span>
                        <span>{event.operator}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 shrink-0">
                      <CheckCircle className="h-3 w-3 mr-1" />종결
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </AppShell>
  )
}
