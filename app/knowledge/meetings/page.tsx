"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search, Users, Calendar, ChevronRight, ArrowLeft, Clock, CheckCircle, AlertTriangle
} from "lucide-react"
import { cn } from "@/lib/utils"

/* ========= Meetings / TOB ========= */
const MEETINGS = [
  { id: "MTG-0204", date: "2025-02-04", type: "Daily TOB" as const, title: "2/4 생산 TOB 회의", process: "전체", attendees: ["김철수", "박민수", "이연구원", "최지훈", "정수민", "한엔지니어", "이영희", "박팀장", "기술파트장", "생산파트장", "안전담당", "환경담당"],
    summary: "전 공정 정상 운전. HCR Feed Sulfur 모니터링 지속. CDU Blend 비율 안정화 확인.",
    agenda: ["1. 전일 운전 현황 보고", "2. HCR Feed Sulfur 트렌드 검토", "3. CDU Crude Blend 변경 결과", "4. 금일 작업 계획"],
    decisions: ["HCR: Feed Sulfur 0.95% 초과 시 Blend 조정 즉시 시행", "CDU: 신규 Crude 도입 2월 중순 계획 - 사전 Assay 분석 요청"],
    actionItems: [{ assignee: "김철수", item: "HCR Feed Sulfur 모니터링 주기 유지 (1hr)" }, { assignee: "박민수", item: "신규 Crude Assay 요청 (Lab)" }],
    duration: "30분" },
  { id: "MTG-0203", date: "2025-02-03", type: "Daily TOB" as const, title: "2/3 생산 TOB 회의", process: "전체", attendees: ["김철수", "박민수", "이연구원", "최지훈", "정수민", "한엔지니어", "박팀장", "기술파트장", "생산파트장", "안전담당"],
    summary: "VDU Heater Trip 복구 상황 공유. HCR TI-2001 온도 추세 논의.",
    agenda: ["1. VDU Heater Trip 복구 브리핑", "2. HCR 온도 트렌드 분석", "3. FCC 촉매 보충 계획", "4. 안전 사항"],
    decisions: ["VDU: Flame Scanner PM 주기 단축 (분기 -> 월)", "HCR: WABT 383도 초과 시 Alert 설정 완료 확인"],
    actionItems: [{ assignee: "최지훈", item: "Flame Scanner PM 절차서 업데이트" }, { assignee: "김철수", item: "WABT AI 모델 결과 주간 리뷰 보고 시 포함" }],
    duration: "45분" },
  { id: "MTG-0131", date: "2025-01-31", type: "Weekly Review" as const, title: "1월 5주차 주간 운전 리뷰", process: "전체", attendees: ["김철수", "박민수", "이연구원", "최지훈", "정수민", "한엔지니어", "이영희", "박팀장", "기술파트장", "생산파트장", "안전담당", "환경담당", "정비파트장", "Lab팀장", "기획담당"],
    summary: "월간 KPI 중간 점검. FCC 수율 목표 대비 -1.2% 분석. CCR Catalyst 재생 결과 공유.",
    agenda: ["1. 주간 운전 실적 요약", "2. KPI 점검 (EII, OA, 수율)", "3. FCC 수율 Gap 분석", "4. CCR 촉매 재생 결과", "5. 안전/환경 사항", "6. 차주 계획"],
    decisions: ["FCC: C/O Ratio 최적화 스터디 착수 (이연구원)", "CCR: 재생 주기 2주 연장 시험 (정수민)", "차주 CDU Crude Blend 변경 확정"],
    actionItems: [{ assignee: "이연구원", item: "FCC C/O 최적화 스터디 계획서 제출 (2/7까지)" }, { assignee: "정수민", item: "CCR 재생 주기 연장 모니터링 계획" }],
    duration: "1시간" },
  { id: "MTG-0128", date: "2025-01-28", type: "Daily TOB" as const, title: "1/28 생산 TOB 회의", process: "전체", attendees: ["김철수", "박민수", "이연구원", "최지훈", "정수민", "한엔지니어", "박팀장", "생산파트장", "안전담당"],
    summary: "전 공정 정상. SRU Analyzer 이상 후속 조치 완료 확인.",
    agenda: ["1. 운전 현황", "2. SRU Analyzer 복구 확인", "3. 동절기 관리 현황"],
    decisions: ["SRU: Heat Tracing 동절기 관리 강화 - 주간 점검 추가"],
    actionItems: [{ assignee: "한엔지니어", item: "Heat Tracing 점검 체크리스트 배포" }],
    duration: "25분" },
  { id: "MTG-0124", date: "2025-01-24", type: "Weekly Review" as const, title: "1월 4주차 주간 운전 리뷰", process: "전체", attendees: ["김철수", "박민수", "이연구원", "최지훈", "정수민", "한엔지니어", "이영희", "박팀장", "기술파트장", "생산파트장", "안전담당", "정비파트장", "Lab팀장"],
    summary: "HCR HP Sep Level 이상 종결 브리핑. CDU 펌프 교체 결과.",
    agenda: ["1. HCR Level 이상 종결 보고", "2. CDU Pump 교체 결과", "3. 주간 KPI", "4. 차주 계획"],
    decisions: ["HCR: Level Transmitter 이중화 TA Scope 반영 확정", "CDU: 예비 펌프 정비 계획 수립 (2월 중)"],
    actionItems: [{ assignee: "김철수", item: "LT 이중화 설계 검토 요청 (계장팀)" }, { assignee: "박민수", item: "예비 펌프 정비 일정 수립" }],
    duration: "50분" },
  { id: "MTG-0120-SP", date: "2025-01-20", type: "Special" as const, title: "HCR 온도 이상 긴급 회의", process: "HCR", attendees: ["김철수", "이영희", "박팀장", "기술파트장", "생산파트장", "Lab팀장", "김지수(AI)", "공장장"],
    summary: "HCR Reactor 온도 이상 상승 원인 분석 및 대응 방안 논의.",
    agenda: ["1. 상황 브리핑", "2. Feed 분석 결과", "3. AI 모델 예측 결과", "4. 대응 방안 논의", "5. 향후 모니터링 계획"],
    decisions: ["Feed Blend 즉시 조정 (Arab Medium 60% -> 45%)", "WABT 모니터링 주기 1시간 -> 30분 전환", "AI 모델 Feed Quality 변수 추가 검토 착수"],
    actionItems: [{ assignee: "김철수", item: "Feed Blend 조정 즉시 시행" }, { assignee: "김지수", item: "AI 모델 Feed Quality 반영 검토 (1주 내)" }, { assignee: "Lab팀장", item: "Feed Sulfur 분석 주기 강화 (4hr -> 2hr)" }],
    duration: "1시간 30분" },
  { id: "MTG-0117", date: "2025-01-17", type: "Weekly Review" as const, title: "1월 3주차 주간 운전 리뷰", process: "전체", attendees: ["김철수", "박민수", "이연구원", "최지훈", "정수민", "한엔지니어", "박팀장", "기술파트장", "생산파트장", "안전담당", "정비파트장", "Lab팀장"],
    summary: "CDU E-101 세정 결과 공유. FCC Regenerator 온도 편차 조사 진행 현황.",
    agenda: ["1. CDU 세정 결과 보고", "2. FCC 온도 편차 조사 현황", "3. 주간 KPI", "4. 차주 계획"],
    decisions: ["CDU: 세정 주기 4개월 -> 3개월 단축 확정", "FCC: Air Grid TA 점검 Scope 확정"],
    actionItems: [{ assignee: "박민수", item: "세정 주기 변경 반복성 가이드 업데이트" }, { assignee: "이연구원", item: "Air Grid 교체 사양 검토" }],
    duration: "55분" },
]

const MEETING_TYPES = ["전체", "Daily TOB", "Weekly Review", "Special"]

const typeColors: Record<string, string> = {
  "Daily TOB": "bg-blue-100 text-blue-700 border-blue-200",
  "Weekly Review": "bg-purple-100 text-purple-700 border-purple-200",
  "Special": "bg-red-100 text-red-700 border-red-200"
}

export default function MeetingsPage() {
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("전체")
  const [selectedMeeting, setSelectedMeeting] = useState<typeof MEETINGS[0] | null>(null)

  const filteredMeetings = MEETINGS.filter(m => {
    if (search && !m.title.toLowerCase().includes(search.toLowerCase()) && !m.summary.toLowerCase().includes(search.toLowerCase())) return false
    if (typeFilter !== "전체" && m.type !== typeFilter) return false
    return true
  })

  // Detail view
  if (selectedMeeting) {
    return (
      <AppShell>
        <div className="min-h-screen bg-background">
          <header className="border-b border-border bg-card">
            <div className="px-6 py-4">
              <Button variant="ghost" size="sm" className="gap-1.5 mb-2 -ml-2" onClick={() => setSelectedMeeting(null)}>
                <ArrowLeft className="h-4 w-4" />뒤로
              </Button>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground">{selectedMeeting.id}</span>
                <Badge className={cn("text-[10px]", typeColors[selectedMeeting.type])}>{selectedMeeting.type}</Badge>
              </div>
              <h1 className="text-lg font-bold mt-1">{selectedMeeting.title}</h1>
              <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{selectedMeeting.date}</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{selectedMeeting.duration}</span>
                <span className="flex items-center gap-1"><Users className="h-3 w-3" />{selectedMeeting.attendees.length}명</span>
              </div>
            </div>
          </header>

          <main className="p-6 space-y-4">
            {/* Summary */}
            <Card>
              <CardContent className="pt-4">
                <h3 className="text-xs font-semibold text-muted-foreground mb-2">회의 요약</h3>
                <p className="text-sm">{selectedMeeting.summary}</p>
              </CardContent>
            </Card>

            {/* Agenda */}
            <Card>
              <CardContent className="pt-4">
                <h3 className="text-xs font-semibold text-muted-foreground mb-2">안건</h3>
                <ul className="text-sm space-y-1">
                  {selectedMeeting.agenda.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              </CardContent>
            </Card>

            {/* Decisions */}
            <Card>
              <CardContent className="pt-4">
                <h3 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />결정 사항
                </h3>
                <ul className="text-sm space-y-1.5">
                  {selectedMeeting.decisions.map((d, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-500">✓</span>{d}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Action Items */}
            <Card>
              <CardContent className="pt-4">
                <h3 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />Action Items
                </h3>
                <div className="space-y-2">
                  {selectedMeeting.actionItems.map((ai, i) => (
                    <div key={i} className="flex items-start gap-3 p-2 rounded-lg bg-amber-50 border border-amber-100">
                      <Badge variant="outline" className="text-[10px] shrink-0">{ai.assignee}</Badge>
                      <p className="text-sm">{ai.item}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Attendees */}
            <Card>
              <CardContent className="pt-4">
                <h3 className="text-xs font-semibold text-muted-foreground mb-2">참석자</h3>
                <div className="flex flex-wrap gap-1.5">
                  {selectedMeeting.attendees.map(a => (
                    <Badge key={a} variant="secondary" className="text-xs">{a}</Badge>
                  ))}
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
          <h1 className="text-lg font-bold">회의록/TOB</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Daily TOB, 주간 리뷰, 특별 회의의 기록을 관리합니다</p>
        </header>

        <main className="p-6 space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="회의 검색..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEETING_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-3">
            <Card className={cn("cursor-pointer hover:bg-muted/30", typeFilter === "전체" && "ring-2 ring-primary")} onClick={() => setTypeFilter("전체")}>
              <CardContent className="py-3 text-center">
                <p className="text-xs text-muted-foreground">전체</p>
                <p className="text-2xl font-bold mt-1">{MEETINGS.length}</p>
              </CardContent>
            </Card>
            {["Daily TOB", "Weekly Review", "Special"].map(type => (
              <Card key={type} className={cn("cursor-pointer hover:bg-muted/30", typeFilter === type && "ring-2 ring-primary")} onClick={() => setTypeFilter(type)}>
                <CardContent className="py-3 text-center">
                  <p className="text-xs text-muted-foreground">{type}</p>
                  <p className="text-2xl font-bold mt-1">{MEETINGS.filter(m => m.type === type).length}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Meeting List */}
          <div className="space-y-2">
            {filteredMeetings.map(meeting => (
              <Card key={meeting.id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setSelectedMeeting(meeting)}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground">{meeting.id}</span>
                        <Badge className={cn("text-[10px]", typeColors[meeting.type])}>{meeting.type}</Badge>
                        <span className="text-sm font-medium truncate">{meeting.title}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                        <span>{meeting.date}</span>
                        <span>{meeting.duration}</span>
                        <span>{meeting.attendees.length}명 참석</span>
                      </div>
                    </div>
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
