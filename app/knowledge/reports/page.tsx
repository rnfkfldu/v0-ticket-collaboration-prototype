"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Search, FileBarChart, Download, Eye, ChevronRight,
  CheckCircle, Tag, ExternalLink
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Report {
  id: string
  title: string
  type: "closure" | "ta-summary" | "oop-monthly" | "analysis"
  process: string
  category: string
  date: string
  year: number
  author: string
  approver: string
  approvedDate: string
  ticketId?: string
  tags: string[]
  summary?: string
}

/* ── Ticket-based closure reports (자산화 가치 있음 판정) ── */
const TICKET_REPORTS: Report[] = [
  { id: "RPT-001", title: "HCR WABT 상승 원인 분석 및 EOR 예측", type: "closure", process: "HCR", category: "최적화", date: "2024-12-20", year: 2024, author: "김철수", approver: "이팀장", approvedDate: "2024-12-22", ticketId: "EVT-2024-0156", tags: ["촉매", "WABT", "수명예측"], summary: "HCR 촉매 WABT 상승 추이 분석 및 EOR 시점 예측. Arabian Medium 전환에 따른 영향도 평가 포함." },
  { id: "RPT-002", title: "E-101 Fouling 세정 효과 분석", type: "closure", process: "CDU", category: "정비", date: "2024-11-15", year: 2024, author: "박엔지니어", approver: "이팀장", approvedDate: "2024-11-18", ticketId: "EVT-2025-0009", tags: ["Fouling", "열교환기", "세정"], summary: "E-101 화학 세정 전후 UA값 비교 분석. 세정 주기 최적화 제안." },
  { id: "RPT-003", title: "VDU Heater H-1001 Trip 원인분석 및 재발방지", type: "closure", process: "VDU", category: "트러블슈팅", date: "2025-01-28", year: 2025, author: "최지훈", approver: "이팀장", approvedDate: "2025-01-30", ticketId: "EVT-2025-0008", tags: ["Heater", "Trip", "Flame Scanner"], summary: "Flame Scanner 오작동 원인 분석. PM 주기 단축 및 Spare Parts 확보 권고." },
  { id: "RPT-004", title: "CCR Catalyst Regeneration 최적화", type: "closure", process: "CCR", category: "최적화", date: "2024-09-22", year: 2024, author: "이연구원", approver: "이팀장", approvedDate: "2024-09-25", tags: ["촉매재생", "Coke", "에너지"], summary: "CCR 촉매 재생 조건 최적화를 통한 촉매 수명 연장 및 에너지 절감 달성." },
  { id: "RPT-005", title: "VDU Heater Coking 진행 추이 분석", type: "analysis", process: "VDU", category: "설비건전성", date: "2024-08-10", year: 2024, author: "김철수", approver: "이팀장", approvedDate: "2024-08-12", tags: ["Coking", "Heater", "건전성"], summary: "Heater Tube 내부 Coking 진행률 분석 및 잔여 수명 예측." },
  { id: "RPT-006", title: "FCC Riser 온도 불균일 원인 및 조치", type: "closure", process: "FCC", category: "트러블슈팅", date: "2024-12-05", year: 2024, author: "이엔지니어", approver: "이팀장", approvedDate: "2024-12-08", ticketId: "EVT-2024-0148", tags: ["FCC", "Riser", "Feed Nozzle"], summary: "Feed Nozzle 패턴 비균일로 인한 Riser 온도 편차 분석 및 조치." },
  { id: "RPT-007", title: "Bio Diesel 원료 혼합 테스트 결과", type: "closure", process: "HCR", category: "최적화", date: "2024-06-15", year: 2024, author: "박연구원", approver: "이팀장", approvedDate: "2024-06-18", tags: ["Bio Diesel", "혼합비", "품질"], summary: "Bio Diesel 5% 혼합 시 제품 품질 영향 평가 및 최적 혼합비 도출." },
  { id: "RPT-008", title: "FCC 신규 촉매 Pilot 평가", type: "analysis", process: "FCC", category: "최적화", date: "2023-11-20", year: 2023, author: "이엔지니어", approver: "이팀장", approvedDate: "2023-11-25", tags: ["FCC", "촉매", "Pilot"], summary: "신규 FCC 촉매 Pilot 테스트 결과. Activity/Selectivity 비교 평가." },
  { id: "RPT-009", title: "Opportunity Crude 도입 운전 영향 분석", type: "closure", process: "CDU", category: "최적화", date: "2023-08-05", year: 2023, author: "김철수", approver: "이팀장", approvedDate: "2023-08-10", tags: ["Opportunity Crude", "원유", "부식"], summary: "저가 원유 도입 시 CDU 부식 영향 및 운전 조건 최적화 방안." },
  { id: "RPT-010", title: "HCR 수율 최적화 LP Vector 분석", type: "analysis", process: "HCR", category: "최적화", date: "2021-05-12", year: 2021, author: "박엔지니어", approver: "이팀장", approvedDate: "2021-05-15", ticketId: "EVT-2021-0045", tags: ["수율", "LP", "최적화"], summary: "HCR 수율 최적화를 위한 LP Vector 분석 및 운전 조건 제안." },
  { id: "RPT-011", title: "SRU Claus 촉매 재생 효과 평가", type: "closure", process: "SRU", category: "정비", date: "2024-11-15", year: 2024, author: "정민아", approver: "이팀장", approvedDate: "2024-11-18", ticketId: "EVT-2024-0135", tags: ["Claus", "촉매", "재생"] },
  { id: "RPT-012", title: "KD Column Flooding 원인분석", type: "closure", process: "KD", category: "트러블슈팅", date: "2024-11-01", year: 2024, author: "김철수", approver: "이팀장", approvedDate: "2024-11-03", ticketId: "EVT-2024-0130", tags: ["Flooding", "Column", "Hydraulics"], summary: "Feed Rate 과부하로 인한 Column Flooding 원인 분석 및 운전 기준 재설정." },
  { id: "RPT-013", title: "CDU Desalter 전압 이상 원인분석", type: "closure", process: "CDU", category: "트러블슈팅", date: "2024-10-18", year: 2024, author: "박엔지니어", approver: "이팀장", approvedDate: "2024-10-20", ticketId: "EVT-2024-0122", tags: ["Desalter", "전기", "Wash Water"] },
  { id: "RPT-014", title: "PE Reactor 온도 프로파일 최적화", type: "closure", process: "PE", category: "최적화", date: "2024-10-08", year: 2024, author: "이영수", approver: "이팀장", approvedDate: "2024-10-10", tags: ["PE", "온도프로파일", "Grade전환"], summary: "Grade 전환 시 온도 프로파일 최적화를 통한 Off-Spec 시간 단축." },
  { id: "RPT-015", title: "HCR Feed Pump P-201 Seal Leak 분석", type: "closure", process: "HCR", category: "정비", date: "2024-04-12", year: 2024, author: "박정비", approver: "이팀장", approvedDate: "2024-04-15", ticketId: "EVT-2024-0065", tags: ["Pump", "Seal", "Leak"], summary: "Mechanical Seal 마모 원인 분석 및 개선형 Seal 적용 검토." },
  { id: "RPT-016", title: "CDU Overhead Corrosion 모니터링 분석", type: "analysis", process: "CDU", category: "설비건전성", date: "2024-03-20", year: 2024, author: "김철수", approver: "이팀장", approvedDate: "2024-03-22", tags: ["부식", "Overhead", "Coupon"], summary: "Overhead 계통 부식 쿠폰 분석 결과 및 Neutralizer 주입량 최적화." },
  { id: "RPT-017", title: "FCC Cyclone 효율 저하 분석", type: "closure", process: "FCC", category: "설비건전성", date: "2023-12-15", year: 2023, author: "이엔지니어", approver: "이팀장", approvedDate: "2023-12-18", tags: ["Cyclone", "Catalyst Loss", "효율"], summary: "Cyclone 내부 마모로 인한 촉매 손실 증가 분석." },
  { id: "RPT-018", title: "VDU LVGO 품질 이상 원인 분석", type: "closure", process: "VDU", category: "최적화", date: "2023-09-25", year: 2023, author: "최지훈", approver: "이팀장", approvedDate: "2023-09-28", tags: ["LVGO", "품질", "Flash Zone"] },
  { id: "RPT-019", title: "CCR Chloride 관리 최적화", type: "analysis", process: "CCR", category: "최적화", date: "2023-06-10", year: 2023, author: "이연구원", approver: "이팀장", approvedDate: "2023-06-13", tags: ["Chloride", "촉매", "Reforming"] },
  { id: "RPT-020", title: "HCR Recycle Gas Compressor 진동 분석", type: "closure", process: "HCR", category: "정비", date: "2022-11-08", year: 2022, author: "박정비", approver: "이팀장", approvedDate: "2022-11-12", ticketId: "EVT-2022-0189", tags: ["Compressor", "진동", "Bearing"] },
]

/* ── Exception reports (non-ticket) ── */
const EXCEPTION_REPORTS: Report[] = [
  { id: "RPT-E01", title: "2024 TA 종합 요약 레포트", type: "ta-summary", process: "전체", category: "TA", date: "2024-07-30", year: 2024, author: "기술팀", approver: "공장장", approvedDate: "2024-08-05", tags: ["TA", "종합", "Scope"], summary: "2024 TA 전체 Scope 14건, 일정 vs 계획 비교, 주요 이슈 및 Lessons Learned 종합." },
  { id: "RPT-E02", title: "2025 1Q OOP 월간 종합 레포트", type: "oop-monthly", process: "전체", category: "리뷰", date: "2025-02-05", year: 2025, author: "기술팀", approver: "이팀장", approvedDate: "2025-02-07", tags: ["월간리뷰", "KPI", "운전실적"], summary: "2025년 1월 운전 실적 종합. EII 98.5%, OA 97.8%." },
  { id: "RPT-E03", title: "2024 4Q OOP 월간 종합 레포트", type: "oop-monthly", process: "전체", category: "리뷰", date: "2025-01-10", year: 2025, author: "기술팀", approver: "이팀장", approvedDate: "2025-01-12", tags: ["월간리뷰", "KPI", "운전실적"], summary: "2024년 4분기 운전 실적 종합. EII, OA, Operating Cost 분석." },
  { id: "RPT-E04", title: "2024 3Q OOP 월간 종합 레포트", type: "oop-monthly", process: "전체", category: "리뷰", date: "2024-10-08", year: 2024, author: "기술팀", approver: "이팀장", approvedDate: "2024-10-10", tags: ["월간리뷰", "KPI"] },
  { id: "RPT-E05", title: "2024 2Q OOP 월간 종합 레포트", type: "oop-monthly", process: "전체", category: "리뷰", date: "2024-07-05", year: 2024, author: "기술팀", approver: "이팀장", approvedDate: "2024-07-08", tags: ["월간리뷰", "KPI"] },
  { id: "RPT-E06", title: "2024 1Q OOP 월간 종합 레포트", type: "oop-monthly", process: "전체", category: "리뷰", date: "2024-04-05", year: 2024, author: "기술팀", approver: "이팀장", approvedDate: "2024-04-08", tags: ["월간리뷰", "KPI"] },
  { id: "RPT-E07", title: "2023 TA 종합 요약 레포트", type: "ta-summary", process: "전체", category: "TA", date: "2023-08-15", year: 2023, author: "기술팀", approver: "공장장", approvedDate: "2023-08-20", tags: ["TA", "종합"] },
  { id: "RPT-E08", title: "2023 4Q OOP 월간 종합 레포트", type: "oop-monthly", process: "전체", category: "리뷰", date: "2024-01-08", year: 2024, author: "기술팀", approver: "이팀장", approvedDate: "2024-01-10", tags: ["월간리뷰", "KPI"] },
  { id: "RPT-E09", title: "2023 3Q OOP 월간 종합 레포트", type: "oop-monthly", process: "전체", category: "리뷰", date: "2023-10-05", year: 2023, author: "기술팀", approver: "이팀장", approvedDate: "2023-10-08", tags: ["월간리뷰", "KPI"] },
  { id: "RPT-E10", title: "2022 TA 종합 요약 레포트", type: "ta-summary", process: "전체", category: "TA", date: "2022-08-20", year: 2022, author: "기술팀", approver: "공장장", approvedDate: "2022-08-25", tags: ["TA", "종합"] },
]

const ALL_REPORTS = [...TICKET_REPORTS, ...EXCEPTION_REPORTS]

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  closure: { label: "종결 레포트", color: "bg-blue-50 text-blue-700 border-blue-200" },
  analysis: { label: "분석 레포트", color: "bg-purple-50 text-purple-700 border-purple-200" },
  "ta-summary": { label: "TA 요약", color: "bg-red-50 text-red-700 border-red-200" },
  "oop-monthly": { label: "OOP 월간", color: "bg-green-50 text-green-700 border-green-200" },
}

const CATEGORIES = ["전체", "최적화", "정비", "설비건전성", "트러블슈팅", "리뷰", "TA"]
const YEARS = ["전체", "2025", "2024", "2023", "2022", "2021"]

export default function ReportsPage() {
  const [search, setSearch] = useState("")
  const [processFilter, setProcessFilter] = useState("전체")
  const [yearFilter, setYearFilter] = useState("전체")
  const [categoryFilter, setCategoryFilter] = useState("전체")
  const [tab, setTab] = useState("ticket")
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)

  const uniqueProcesses = ["전체", ...new Set(ALL_REPORTS.map(r => r.process).filter(p => p !== "전체")), "전체"]
  const dedupedProcesses = [...new Set(["전체", "HCR", "CDU", "VDU", "FCC", "CCR", "SRU", "KD", "PE"])]

  const applyFilters = (list: Report[]) => list.filter(r => {
    if (search && !r.title.toLowerCase().includes(search.toLowerCase()) && !r.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))) return false
    if (processFilter !== "전체" && r.process !== processFilter) return false
    if (yearFilter !== "전체" && r.year !== Number(yearFilter)) return false
    if (categoryFilter !== "전체" && r.category !== categoryFilter) return false
    return true
  })

  const filteredTicket = applyFilters(TICKET_REPORTS)
  const filteredException = applyFilters(EXCEPTION_REPORTS)
  const filteredAll = tab === "ticket" ? filteredTicket : tab === "exception" ? filteredException : applyFilters(ALL_REPORTS)

  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-semibold">최종 레포트</h1>
                <p className="text-sm text-muted-foreground mt-1">팀장 승인 완료된 종결 레포트 및 예외 레포트 (TA 요약, OOP 월간 종합)</p>
              </div>
              <Badge variant="outline" className="text-xs gap-1.5 h-7"><CheckCircle className="h-3 w-3 text-emerald-500" /> 총 {ALL_REPORTS.length}건 등록</Badge>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-4">
          {/* Filters row */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="제목, 태그 검색..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
            </div>
            <Select value={processFilter} onValueChange={setProcessFilter}>
              <SelectTrigger className="w-28 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>{dedupedProcesses.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-32 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-24 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>{YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          {/* Tabs */}
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="ticket" className="gap-1.5">
                <FileBarChart className="h-3.5 w-3.5" /> 티켓 종결 레포트
                <Badge variant="secondary" className="ml-1 h-5 text-[10px]">{filteredTicket.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="exception" className="gap-1.5">
                <Tag className="h-3.5 w-3.5" /> 예외 레포트
                <Badge variant="secondary" className="ml-1 h-5 text-[10px]">{filteredException.length}</Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ticket" className="mt-4 space-y-2">
              {filteredTicket.map(rpt => <ReportRow key={rpt.id} report={rpt} onSelect={setSelectedReport} />)}
              {filteredTicket.length === 0 && <EmptyState />}
            </TabsContent>
            <TabsContent value="exception" className="mt-4 space-y-2">
              {filteredException.map(rpt => <ReportRow key={rpt.id} report={rpt} onSelect={setSelectedReport} />)}
              {filteredException.length === 0 && <EmptyState />}
            </TabsContent>
          </Tabs>
        </div>

        {/* Detail Dialog */}
        <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-base">{selectedReport?.title}</DialogTitle>
            </DialogHeader>
            {selectedReport && (
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/30">
                  <div><span className="text-xs text-muted-foreground">ID</span><p className="font-mono text-xs">{selectedReport.id}</p></div>
                  <div><span className="text-xs text-muted-foreground">유형</span><p><Badge variant="outline" className={cn("text-[10px]", TYPE_LABELS[selectedReport.type]?.color)}>{TYPE_LABELS[selectedReport.type]?.label}</Badge></p></div>
                  <div><span className="text-xs text-muted-foreground">공정</span><p>{selectedReport.process}</p></div>
                  <div><span className="text-xs text-muted-foreground">카테고리</span><p>{selectedReport.category}</p></div>
                  <div><span className="text-xs text-muted-foreground">작성자</span><p>{selectedReport.author}</p></div>
                  <div><span className="text-xs text-muted-foreground">작성일</span><p>{selectedReport.date}</p></div>
                  <div><span className="text-xs text-muted-foreground">승인자</span><p className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-emerald-500" /> {selectedReport.approver}</p></div>
                  <div><span className="text-xs text-muted-foreground">승인일</span><p>{selectedReport.approvedDate}</p></div>
                </div>
                {selectedReport.summary && (
                  <div>
                    <span className="text-xs font-medium">요약</span>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed p-3 rounded-lg bg-muted/20 border border-border">{selectedReport.summary}</p>
                  </div>
                )}
                {selectedReport.ticketId && (
                  <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/10 flex items-center gap-2">
                    <ExternalLink className="h-3 w-3 text-primary" />
                    <span className="text-xs text-muted-foreground">연관 티켓:</span>
                    <span className="text-xs font-medium text-primary">{selectedReport.ticketId}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {selectedReport.tags.map(t => <Badge key={t} variant="outline" className="text-[10px] h-5">{t}</Badge>)}
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs"><Eye className="h-3 w-3" /> 문서 보기</Button>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs"><Download className="h-3 w-3" /> 다운로드</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  )
}

function ReportRow({ report, onSelect }: { report: Report; onSelect: (r: Report) => void }) {
  const tp = TYPE_LABELS[report.type] || { label: report.type, color: "" }
  return (
    <Card className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => onSelect(report)}>
      <CardContent className="p-4 flex items-center gap-4">
        <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
          <FileBarChart className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-[11px] font-mono text-muted-foreground">{report.id}</span>
            <Badge variant="outline" className={cn("text-[10px] h-4", tp.color)}>{tp.label}</Badge>
            <Badge variant="outline" className="text-[10px] h-4">{report.process}</Badge>
            <Badge variant="outline" className="text-[10px] h-4">{report.category}</Badge>
          </div>
          <p className="text-sm font-medium truncate">{report.title}</p>
          <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
            <span>{report.date}</span>
            <span>작성: {report.author}</span>
            <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-emerald-500" /> {report.approver} ({report.approvedDate})</span>
            {report.ticketId && <span className="text-primary">Ticket: {report.ticketId}</span>}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </CardContent>
    </Card>
  )
}

function EmptyState() {
  return <div className="text-center py-12 text-sm text-muted-foreground">필터 조건에 맞는 레포트가 없습니다.</div>
}
