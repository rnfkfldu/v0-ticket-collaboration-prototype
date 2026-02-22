"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Search, FileText, FileBarChart, Download, Eye, Tag,
  ChevronRight, CheckCircle, Calendar, ExternalLink
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Report {
  id: string
  title: string
  type: "closure-report" | "analysis" | "ta-summary" | "monthly-oop" | "quarterly-review"
  process: string
  category: string
  date: string
  year: number
  author: string
  approvedBy: string
  relatedTicketId?: string
  tags: string[]
  summary?: string
}

const REPORTS: Report[] = [
  // -- Ticket closure reports (자산화 가치 있음 판정) --
  { id: "RPT-001", title: "HCR WABT 상승 원인 분석 보고서", type: "closure-report", process: "HCR", category: "최적화", date: "2024-12-20", year: 2024, author: "김철수", approvedBy: "이팀장", relatedTicketId: "TKT-2024-0032", tags: ["촉매", "WABT", "수명예측"], summary: "HCR 촉매 WABT 상승 추이 분석 및 EOR 시점 예측. Arabian Medium 전환에 따른 영향도 평가 포함." },
  { id: "RPT-002", title: "E-101 Fouling 세정 효과 분석", type: "closure-report", process: "CDU", category: "정비", date: "2024-12-05", year: 2024, author: "박엔지니어", approvedBy: "이팀장", relatedTicketId: "TKT-2024-0045", tags: ["Fouling", "열교환기", "세정"], summary: "E-101 화학 세정 전후 UA값 비교 분석. 세정 주기 최적화 제안." },
  { id: "RPT-003", title: "VDU H-1001 Heater Trip 원인분석 보고서", type: "closure-report", process: "VDU", category: "트러블슈팅", date: "2025-02-04", year: 2025, author: "최지훈", approvedBy: "이팀장", relatedTicketId: "TKT-2024-0089", tags: ["Heater", "Trip", "Burner"], summary: "Burner Tip 열화로 인한 화염 불안정 -> Trip. Tip 교체 후 정상화." },
  { id: "RPT-004", title: "CCR Catalyst Regeneration 최적화 보고서", type: "closure-report", process: "CCR", category: "최적화", date: "2024-10-15", year: 2024, author: "이연구원", approvedBy: "이팀장", relatedTicketId: "TKT-2024-0028", tags: ["촉매재생", "Coke", "최적화"], summary: "CCR 촉매 재생 조건 최적화를 통한 촉매 수명 연장 및 에너지 절감." },
  { id: "RPT-005", title: "SRU Tail Gas SO2 초과 원인 및 대응 보고서", type: "closure-report", process: "SRU", category: "환경", date: "2024-07-20", year: 2024, author: "김환경", approvedBy: "이팀장", relatedTicketId: "TKT-2024-0015", tags: ["SO2", "환경", "촉매교체"], summary: "Tail Gas SO2 농도 초과 원인 분석. Catalyst bed 교체 및 Air/Acid ratio 조정." },
  { id: "RPT-006", title: "Bio-Diesel 원료 혼합 테스트 결과", type: "closure-report", process: "HCR", category: "최적화", date: "2024-07-15", year: 2024, author: "박연구원", approvedBy: "이팀장", relatedTicketId: "TKT-2024-0008", tags: ["Bio Diesel", "혼합비", "품질"], summary: "Bio-Diesel 5% 혼합 성공. 품질 Spec 충족. 10% 추가 테스트 계획." },
  { id: "RPT-007", title: "Opportunity Crude 도입 운전 영향 분석", type: "closure-report", process: "CDU", category: "최적화", date: "2023-08-15", year: 2023, author: "김철수", approvedBy: "이팀장", relatedTicketId: "TKT-2023-0112", tags: ["Opportunity Crude", "원유", "부식"], summary: "기회 원유 처리 시 운전 영향 평가. Crude Blend Matrix 업데이트." },
  { id: "RPT-008", title: "FCC 신규 촉매 Pilot 평가 보고서", type: "analysis", process: "FCC", category: "최적화", date: "2023-11-20", year: 2023, author: "이엔지니어", approvedBy: "이팀장", relatedTicketId: "TKT-2023-0098", tags: ["FCC", "촉매", "Pilot"], summary: "FCC 신규 촉매 Pilot Plant 평가. Gasoline yield +1.2% 개선 확인." },
  { id: "RPT-009", title: "HCR 수율 최적화 LP Vector 분석", type: "analysis", process: "HCR", category: "최적화", date: "2021-05-12", year: 2021, author: "박엔지니어", approvedBy: "이팀장", relatedTicketId: "TKT-2021-0045", tags: ["수율", "LP", "최적화"], summary: "HCR 수율 최적화를 위한 LP Vector 분석 및 운전 조건 제안." },
  { id: "RPT-010", title: "CDU Preheat Train 최적화 Feasibility Study", type: "analysis", process: "CDU", category: "에너지", date: "2024-05-20", year: 2024, author: "김철수", approvedBy: "이팀장", relatedTicketId: "TKT-2024-0012", tags: ["Preheat", "에너지", "HEN"], summary: "CDU Preheat Train 최적화를 통한 연료 절감 가능성 분석. 연간 $1.2M 절감 예상." },
  { id: "RPT-011", title: "P-201A/B 진동 이상 분석 보고서", type: "closure-report", process: "HCR", category: "정비", date: "2025-01-30", year: 2025, author: "박정비", approvedBy: "이팀장", relatedTicketId: "TKT-2025-0005", tags: ["Pump", "진동", "Impeller"], summary: "P-201A 비정상 진동 원인: Impeller 마모. 교체 후 12.5->2.1mm/s 복귀." },
  { id: "RPT-012", title: "CDU Overhead Corrosion 원인 분석", type: "closure-report", process: "CDU", category: "설비건전성", date: "2024-06-30", year: 2024, author: "박엔지니어", approvedBy: "이팀장", relatedTicketId: "TKT-2024-0019", tags: ["Corrosion", "Overhead", "Neutralizer"], summary: "CDU Overhead system Corrosion Rate 상승 원인. Neutralizer 주입량 최적화." },
  { id: "RPT-013", title: "KD 분리탑 Flooding 원인 분석", type: "closure-report", process: "KD", category: "트러블슈팅", date: "2024-03-22", year: 2024, author: "정수민", approvedBy: "이팀장", relatedTicketId: "TKT-2024-0003", tags: ["KD", "Flooding", "Tray"], summary: "KD 분리탑 Tray Damage로 인한 Flooding. TA 시 Tray 교체." },
  { id: "RPT-014", title: "MFC Compressor Vibration 원인 및 조치", type: "closure-report", process: "MFC", category: "정비", date: "2024-02-15", year: 2024, author: "김정비", approvedBy: "이팀장", relatedTicketId: "TKT-2024-0001", tags: ["Compressor", "Vibration", "Bearing"], summary: "MFC Compressor Bearing 열화로 인한 진동 증가. Bearing 교체 완료." },
  { id: "RPT-015", title: "VDU Heater Coking 진행 추이 분석", type: "analysis", process: "VDU", category: "설비건전성", date: "2024-08-10", year: 2024, author: "김철수", approvedBy: "이팀장", relatedTicketId: "TKT-2024-0025", tags: ["Coking", "Heater", "건전성"], summary: "VDU Heater Coking 진행률 평가. Decoking 시점 예측 및 연료 효율 영향 분석." },
  { id: "RPT-016", title: "HCR Catalyst Deactivation Rate Study", type: "analysis", process: "HCR", category: "최적화", date: "2023-06-10", year: 2023, author: "김철수", approvedBy: "이팀장", relatedTicketId: "TKT-2023-0067", tags: ["촉매", "Deactivation", "수명"], summary: "HCR 촉매 비활성화 속도 모델링. Feed 품질별 수명 시나리오 비교." },
  { id: "RPT-017", title: "FCC Slide Valve 작동 불량 분석", type: "closure-report", process: "FCC", category: "정비", date: "2024-09-10", year: 2024, author: "정수민", approvedBy: "이팀장", relatedTicketId: "TKT-2024-0021", tags: ["Slide Valve", "FCC", "정비"], summary: "FCC Slide Valve 고착 원인 분석. TA 시 Overhaul 완료." },
  { id: "RPT-018", title: "CCR APC 재연결 및 성능 검증", type: "closure-report", process: "CCR", category: "제어", date: "2025-02-03", year: 2025, author: "김지수", approvedBy: "이팀장", relatedTicketId: "TKT-2025-0012", tags: ["APC", "DCS", "제어"], summary: "CCR 재기동 후 APC-DCS 연동 복구. Controller 성능 정상 확인." },

  // -- 예외 레포트: TA 요약 --
  { id: "RPT-TA-2024", title: "2024년 정기보수(TA) 종합 요약 레포트", type: "ta-summary", process: "공통", category: "TA", date: "2024-06-15", year: 2024, author: "TA TF팀", approvedBy: "공장장", tags: ["TA", "정기보수", "종합"], summary: "2024년 4월 TA 전체 실적 요약. Scope 이행율 98.2%, 추가 발견 23건, 일정 준수율 96%." },
  { id: "RPT-TA-2022", title: "2022년 정기보수(TA) 종합 요약 레포트", type: "ta-summary", process: "공통", category: "TA", date: "2022-05-20", year: 2022, author: "TA TF팀", approvedBy: "공장장", tags: ["TA", "정기보수"], summary: "2022년 3월 TA 종합 요약. 안전 무사고 달성. 총 147건 정비 완료." },
  { id: "RPT-TA-2020", title: "2020년 정기보수(TA) 종합 요약 레포트", type: "ta-summary", process: "공통", category: "TA", date: "2020-06-10", year: 2020, author: "TA TF팀", approvedBy: "공장장", tags: ["TA", "정기보수"], summary: "2020년 4월 TA 종합 요약. COVID-19 대응 특수 조건 하 수행." },

  // -- 예외 레포트: OOP 월간 요약 --
  { id: "RPT-OOP-2501", title: "2025년 1월 OOP 월간 요약 레포트", type: "monthly-oop", process: "공통", category: "월간", date: "2025-02-05", year: 2025, author: "기술팀", approvedBy: "이팀장", tags: ["월간", "OOP", "요약"], summary: "2025년 1월 OOP 활용 실적. 이벤트 처리 42건, 평균 처리 기간 6.2일. 자산화 12건." },
  { id: "RPT-OOP-2412", title: "2024년 12월 OOP 월간 요약 레포트", type: "monthly-oop", process: "공통", category: "월간", date: "2025-01-10", year: 2025, author: "기술팀", approvedBy: "이팀장", tags: ["월간", "OOP"], summary: "2024년 12월 OOP 활용 실적. 이벤트 처리 38건." },
  { id: "RPT-OOP-2411", title: "2024년 11월 OOP 월간 요약 레포트", type: "monthly-oop", process: "공통", category: "월간", date: "2024-12-10", year: 2024, author: "기술팀", approvedBy: "이팀장", tags: ["월간", "OOP"] },
  { id: "RPT-OOP-2410", title: "2024년 10월 OOP 월간 요약 레포트", type: "monthly-oop", process: "공통", category: "월간", date: "2024-11-10", year: 2024, author: "기술팀", approvedBy: "이팀장", tags: ["월간", "OOP"] },

  // -- 예외 레포트: 분기 리뷰 --
  { id: "RPT-QR-2024Q4", title: "2024 4Q 운전 실적 종합 리뷰", type: "quarterly-review", process: "공통", category: "리뷰", date: "2025-01-10", year: 2025, author: "기술팀", approvedBy: "이팀장", tags: ["월간리뷰", "KPI", "운전실적"], summary: "2024년 4분기 운전 실적 종합 리뷰. EII 목표 대비 -2.1, OA 96.5%." },
  { id: "RPT-QR-2024Q3", title: "2024 3Q 운전 실적 종합 리뷰", type: "quarterly-review", process: "공통", category: "리뷰", date: "2024-10-10", year: 2024, author: "기술팀", approvedBy: "이팀장", tags: ["월간리뷰", "KPI"] },
  { id: "RPT-QR-2024Q2", title: "2024 2Q 운전 실적 종합 리뷰", type: "quarterly-review", process: "공통", category: "리뷰", date: "2024-07-10", year: 2024, author: "기술팀", approvedBy: "이팀장", tags: ["월간리뷰", "KPI"] },
  { id: "RPT-QR-2024Q1", title: "2024 1Q 운전 실적 종합 리뷰", type: "quarterly-review", process: "공통", category: "리뷰", date: "2024-04-10", year: 2024, author: "기술팀", approvedBy: "이팀장", tags: ["월간리뷰", "KPI"] },
]

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  "closure-report": { label: "종료 Report", color: "bg-blue-50 text-blue-700 border-blue-200" },
  "analysis": { label: "분석", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  "ta-summary": { label: "TA 요약", color: "bg-red-50 text-red-700 border-red-200" },
  "monthly-oop": { label: "OOP 월간", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  "quarterly-review": { label: "분기 리뷰", color: "bg-teal-50 text-teal-700 border-teal-200" },
}
const PROCESSES = ["전체", "CDU", "VDU", "HCR", "CCR", "FCC", "SRU", "PE", "KD", "MFC", "공통"]
const YEARS = ["전체", "2025", "2024", "2023", "2022", "2021", "2020"]
const CATEGORIES = ["전체", "최적화", "정비", "트러블슈팅", "설비건전성", "환경", "에너지", "제어", "TA", "월간", "리뷰"]

export default function ReportsPage() {
  const [search, setSearch] = useState("")
  const [processF, setProcessF] = useState("전체")
  const [yearF, setYearF] = useState("전체")
  const [catF, setCatF] = useState("전체")
  const [sel, setSel] = useState<Report | null>(null)

  const filtered = REPORTS.filter(r => {
    if (search && !r.title.toLowerCase().includes(search.toLowerCase()) && !r.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))) return false
    if (processF !== "전체" && r.process !== processF) return false
    if (yearF !== "전체" && r.year !== Number(yearF)) return false
    if (catF !== "전체" && r.category !== catF) return false
    return true
  })

  const ticketReports = filtered.filter(r => r.relatedTicketId)
  const exceptionalReports = filtered.filter(r => !r.relatedTicketId)

  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="px-6 py-4">
            <h1 className="text-lg font-semibold">최종 레포트</h1>
            <p className="text-sm text-muted-foreground mt-1">팀장 승인 완료된 이벤트 종료 레포트와 TA/OOP 월간 등 예외 레포트를 조회합니다</p>
          </div>
        </header>
        <main className="p-6 space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="제목, 태그로 검색..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                </div>
                <Select value={processF} onValueChange={setProcessF}><SelectTrigger className="w-24"><SelectValue /></SelectTrigger><SelectContent>{PROCESSES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select>
                <Select value={yearF} onValueChange={setYearF}><SelectTrigger className="w-20"><SelectValue /></SelectTrigger><SelectContent>{YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent></Select>
                <Select value={catF} onValueChange={setCatF}><SelectTrigger className="w-28"><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "전체", value: filtered.length, color: "text-foreground" },
              { label: "이벤트 Report", value: ticketReports.length, color: "text-blue-600" },
              { label: "예외 Report", value: exceptionalReports.length, color: "text-emerald-600" },
              { label: "올해", value: filtered.filter(r => r.year === 2025).length, color: "text-primary" },
            ].map((s, i) => (
              <Card key={i}><CardContent className="py-3 text-center"><p className="text-[11px] text-muted-foreground">{s.label}</p><p className={cn("text-xl font-bold mt-0.5", s.color)}>{s.value}</p></CardContent></Card>
            ))}
          </div>

          {/* Ticket Reports */}
          {ticketReports.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                이벤트 종료 레포트
                <Badge variant="secondary" className="text-[10px] h-4">{ticketReports.length}</Badge>
              </h2>
              <div className="space-y-2">
                {ticketReports.map(r => {
                  const tl = TYPE_LABELS[r.type] || { label: r.type, color: "" }
                  return (
                    <Card key={r.id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setSel(r)}>
                      <CardContent className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-mono text-muted-foreground">{r.id}</span>
                              <Badge variant="outline" className={cn("text-[10px] h-4 border", tl.color)}>{tl.label}</Badge>
                              <Badge variant="outline" className="text-[10px] h-4">{r.process}</Badge>
                              <Badge variant="outline" className="text-[10px] h-4">{r.category}</Badge>
                              <CheckCircle className="h-3 w-3 text-emerald-500" />
                            </div>
                            <p className="text-sm font-medium mt-1 truncate">{r.title}</p>
                            {r.tags.length > 0 && (
                              <div className="flex items-center gap-1 mt-1 flex-wrap">
                                {r.tags.map(t => <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-muted">{t}</span>)}
                              </div>
                            )}
                          </div>
                          <div className="text-right shrink-0 text-xs text-muted-foreground">
                            <p>{r.date}</p>
                            <p>{r.author}</p>
                            <p className="text-[10px] font-mono">{r.relatedTicketId}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {/* Exceptional Reports */}
          {exceptionalReports.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <FileBarChart className="h-4 w-4" />
                TA / OOP 월간 / 분기 예외 레포트
                <Badge variant="secondary" className="text-[10px] h-4">{exceptionalReports.length}</Badge>
              </h2>
              <div className="space-y-2">
                {exceptionalReports.map(r => {
                  const tl = TYPE_LABELS[r.type] || { label: r.type, color: "" }
                  return (
                    <Card key={r.id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setSel(r)}>
                      <CardContent className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className={cn("text-[10px] h-4 border", tl.color)}>{tl.label}</Badge>
                              <Badge variant="outline" className="text-[10px] h-4">{r.process}</Badge>
                            </div>
                            <p className="text-sm font-medium mt-1 truncate">{r.title}</p>
                            {r.summary && <p className="text-xs text-muted-foreground mt-0.5 truncate">{r.summary}</p>}
                          </div>
                          <div className="text-right shrink-0 text-xs text-muted-foreground">
                            <p>{r.date}</p>
                            <p>{r.approvedBy}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}
        </main>

        {/* Detail Dialog */}
        <Dialog open={!!sel} onOpenChange={() => setSel(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="text-base">{sel?.title}</DialogTitle></DialogHeader>
            {sel && (
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div><span className="text-muted-foreground">ID:</span> {sel.id}</div>
                  <div><span className="text-muted-foreground">공정:</span> {sel.process}</div>
                  <div><span className="text-muted-foreground">카테고리:</span> {sel.category}</div>
                  <div><span className="text-muted-foreground">작성:</span> {sel.author}</div>
                  <div><span className="text-muted-foreground">승인:</span> {sel.approvedBy}</div>
                  <div><span className="text-muted-foreground">날짜:</span> {sel.date}</div>
                  {sel.relatedTicketId && <div className="col-span-2"><span className="text-muted-foreground">원본 이벤트:</span> <span className="font-mono">{sel.relatedTicketId}</span></div>}
                </div>
                {sel.summary && <div className="p-3 rounded-lg bg-muted/50"><p className="text-sm leading-relaxed">{sel.summary}</p></div>}
                <div className="flex items-center gap-1 flex-wrap">{sel.tags.map(t => <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>)}</div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 gap-1.5"><Eye className="h-4 w-4" />레포트 보기</Button>
                  <Button variant="outline" className="flex-1 gap-1.5"><Download className="h-4 w-4" />다운로드</Button>
                </div>
                {sel.relatedTicketId && (
                  <Button variant="outline" className="w-full gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50">
                    <ExternalLink className="h-4 w-4" /> 원본 이벤트 보기 ({sel.relatedTicketId})
                  </Button>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  )
}
