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
  Search, FileBarChart, FileText, Calendar, Tag, ChevronRight, Download,
  ExternalLink, Eye, CheckCircle, Clock, User, Star
} from "lucide-react"
import { cn } from "@/lib/utils"

interface FinalReport {
  id: string
  title: string
  type: "ticket-closure" | "exception"
  subType: string
  process: string
  category: string
  date: string
  year: number
  author: string
  approver: string
  relatedTicketId?: string
  tags: string[]
  summary: string
  assetValue: "high" | "medium"
}

const TICKET_REPORTS: FinalReport[] = [
  { id: "RPT-001", title: "HCR WABT 상승 원인 분석 및 EOR 시점 예측", type: "ticket-closure", subType: "종료 Report", process: "HCR", category: "촉매 관리", date: "2024-12-22", year: 2024, author: "김철수", approver: "박팀장", relatedTicketId: "TKT-2024-0120", tags: ["WABT", "촉매수명", "EOR"], summary: "Arabian Medium 전환 후 HCR 촉매 WABT 상승 추이 분석. 기존 대비 약 15% 빠른 Aging 속도 확인. EOR 시점 2025년 8월로 예측.", assetValue: "high" },
  { id: "RPT-002", title: "E-101 화학 세정 전후 UA값 비교 분석", type: "ticket-closure", subType: "종료 Report", process: "CDU", category: "설비 정비", date: "2024-11-18", year: 2024, author: "박민수", approver: "박팀장", relatedTicketId: "TKT-2024-0108", tags: ["Fouling", "화학세정", "UA값"], summary: "E-101 열교환기 화학 세정 효과 분석. 세정 전 UA 320 -> 세정 후 UA 485로 회복(회복률 85%). 세정 주기 3개월 권고.", assetValue: "high" },
  { id: "RPT-003", title: "CCR 촉매 재생 조건 최적화 결과", type: "ticket-closure", subType: "종료 Report", process: "CCR", category: "촉매 관리", date: "2024-09-25", year: 2024, author: "이연구원", approver: "박팀장", relatedTicketId: "TKT-2024-0092", tags: ["촉매재생", "Coke", "에너지절감"], summary: "재생 온도 520->510도 하향 시 Coke 잔류량 0.05% 증가하나 에너지 15% 절감 확인. 촉매 수명 영향 미미.", assetValue: "high" },
  { id: "RPT-004", title: "VDU Heater Coking 진행률 분석 및 Decoking 시점 권고", type: "ticket-closure", subType: "분석 Report", process: "VDU", category: "설비건전성", date: "2024-08-15", year: 2024, author: "최지훈", approver: "박팀장", relatedTicketId: "TKT-2024-0085", tags: ["Coking", "Heater", "TMT"], summary: "VDU Heater TMT 상승 추이로부터 Coking 진행률 산출. 현재 65% 수준, 2025년 TA까지 운전 가능하나 TMT 관리 필요.", assetValue: "high" },
  { id: "RPT-005", title: "FCC 신규 촉매 후보 3종 Pilot 평가", type: "ticket-closure", subType: "분석 Report", process: "FCC", category: "촉매 관리", date: "2023-11-25", year: 2023, author: "이엔지니어", approver: "박팀장", relatedTicketId: "TKT-2023-0156", tags: ["FCC", "Pilot", "촉매선정"], summary: "Grace, BASF, Albemarle 3사 촉매 Pilot 비교. Grace 촉매 가솔린 수율 +1.2%, Bottoms 감소 -0.8%로 최적.", assetValue: "high" },
  { id: "RPT-006", title: "Opportunity Crude 도입 운전 영향 및 Blending 최적화", type: "ticket-closure", subType: "종료 Report", process: "CDU", category: "최적화", date: "2023-08-10", year: 2023, author: "김철수", approver: "박팀장", relatedTicketId: "TKT-2023-0098", tags: ["Opportunity Crude", "Blending", "부식"], summary: "Basrah Heavy 30% Blending 시 Desalter 효율 5% 저하, 상압탑 상부 부식 지표 정상 범위. 최대 35%까지 허용 가능.", assetValue: "medium" },
  { id: "RPT-007", title: "HCR 수율 최적화 LP Vector 업데이트", type: "ticket-closure", subType: "분석 Report", process: "HCR", category: "최적화", date: "2021-05-15", year: 2021, author: "박엔지니어", approver: "김팀장(전)", relatedTicketId: "TKT-2021-0034", tags: ["수율", "LP", "Vector"], summary: "HCR LP Vector 재산출. 경유/등유 비율 변경에 따른 마진 최적화 방안 도출. 연간 약 12억원 마진 개선 예상.", assetValue: "high" },
  { id: "RPT-008", title: "Bio Diesel 원료 혼합비 최적화 테스트", type: "ticket-closure", subType: "종료 Report", process: "HCR", category: "최적화", date: "2024-06-20", year: 2024, author: "박연구원", approver: "박팀장", relatedTicketId: "TKT-2024-0072", tags: ["Bio Diesel", "혼합비", "품질"], summary: "Bio Feed 5/10/15% 혼합 시 제품 품질 및 촉매 영향 평가. 10%까지 무리 없음 확인.", assetValue: "medium" },
  { id: "RPT-009", title: "SRU Tail Gas Analyzer 결빙 방지 대책", type: "ticket-closure", subType: "종료 Report", process: "SRU", category: "설비 정비", date: "2024-12-31", year: 2024, author: "한엔지니어", approver: "박팀장", relatedTicketId: "TKT-2024-0130", tags: ["Analyzer", "동절기", "Heat Tracing"], summary: "Sample Line 결빙 원인(Heat Tracing 불량) 및 재발 방지 대책. 동절기 관리 체크리스트 수립.", assetValue: "medium" },
  { id: "RPT-010", title: "HCR HP Separator Level 계기 오류 분석", type: "ticket-closure", subType: "종료 Report", process: "HCR", category: "계장", date: "2024-12-22", year: 2024, author: "김철수", approver: "박팀장", relatedTicketId: "TKT-2024-0125", tags: ["Level", "계기", "이중화"], summary: "LT Drift 원인 분석(Sensing Line 막힘). 백업 LT 설치 및 교정 주기 변경 권고.", assetValue: "medium" },
  { id: "RPT-011", title: "CDU Crude Feed Pump Impeller 마모 원인 분석", type: "ticket-closure", subType: "종료 Report", process: "CDU", category: "설비 정비", date: "2024-12-15", year: 2024, author: "박민수", approver: "박팀장", relatedTicketId: "TKT-2024-0118", tags: ["펌프", "Impeller", "마모"], summary: "Crude 내 Sand 함량 증가에 의한 Impeller 침식 마모. Sand Filter 설치 검토.", assetValue: "medium" },
  { id: "RPT-012", title: "FCC Regenerator Air Grid 불균일 연소 분석", type: "ticket-closure", subType: "분석 Report", process: "FCC", category: "설비건전성", date: "2025-01-15", year: 2025, author: "이연구원", approver: "박팀장", relatedTicketId: "TKT-2025-0005", tags: ["Air Grid", "Regenerator", "온도편차"], summary: "Air Distributor 부분 막힘에 의한 국부 과열. TA Scope에 Grid 교체 반영.", assetValue: "high" },
  { id: "RPT-013", title: "VDU HVGO Stripper Control Valve 이상 분석", type: "ticket-closure", subType: "종료 Report", process: "VDU", category: "계장", date: "2024-12-08", year: 2024, author: "최지훈", approver: "박팀장", relatedTicketId: "TKT-2024-0115", tags: ["Control Valve", "포지셔너", "Level"], summary: "CV 포지셔너 고장 원인(진동에 의한 피로 파괴) 및 예비품 관리 개선.", assetValue: "medium" },
  { id: "RPT-014", title: "FCC Slide Valve Actuator 유압 누설 원인 및 대책", type: "ticket-closure", subType: "종료 Report", process: "FCC", category: "설비 정비", date: "2024-12-01", year: 2024, author: "이연구원", approver: "박팀장", relatedTicketId: "TKT-2024-0110", tags: ["Slide Valve", "유압", "O-ring"], summary: "O-ring 재질 부적합에 의한 열화. 내열 소재(Viton -> Kalrez) 변경 결정.", assetValue: "high" },
  { id: "RPT-015", title: "CCR Net Gas Compressor 진동 원인 분석", type: "ticket-closure", subType: "종료 Report", process: "CCR", category: "회전기계", date: "2025-01-08", year: 2025, author: "정수민", approver: "박팀장", relatedTicketId: "TKT-2025-0003", tags: ["진동", "Bearing", "PM"], summary: "Bearing 마모 진행률 분석 및 PM 주기 12개월->9개월 변경 권고.", assetValue: "medium" },
]

const EXCEPTION_REPORTS: FinalReport[] = [
  { id: "EXP-001", title: "2024 TA 종합 요약 레포트", type: "exception", subType: "TA 요약", process: "전체", category: "TA", date: "2024-07-30", year: 2024, author: "기술팀", approver: "공장장", tags: ["TA", "정비", "종합"], summary: "2024년 정기보수 전체 요약. 총 352개 작업 항목 중 347개 완료(98.6%). 주요 발견사항 15건.", assetValue: "high" },
  { id: "EXP-002", title: "2024 12월 OOP 월간 요약 레포트", type: "exception", subType: "OOP 월간", process: "전체", category: "월간리뷰", date: "2025-01-10", year: 2025, author: "기술팀", approver: "박팀장", tags: ["월간", "KPI", "운전실적"], summary: "2024년 12월 운전 실적. EII 97.2%, OA 98.1%. 주요 이벤트 8건 종결.", assetValue: "medium" },
  { id: "EXP-003", title: "2024 11월 OOP 월간 요약 레포트", type: "exception", subType: "OOP 월간", process: "전체", category: "월간리뷰", date: "2024-12-08", year: 2024, author: "기술팀", approver: "박팀장", tags: ["월간", "KPI"], summary: "2024년 11월 운전 실적. EII 96.8%, OA 97.5%. CDU E-101 세정 성공.", assetValue: "medium" },
  { id: "EXP-004", title: "2024 10월 OOP 월간 요약 레포트", type: "exception", subType: "OOP 월간", process: "전체", category: "월간리뷰", date: "2024-11-10", year: 2024, author: "기술팀", approver: "박팀장", tags: ["월간", "KPI"], summary: "2024년 10월 운전 실적. EII 97.5%, OA 98.3%. 안정 운전.", assetValue: "medium" },
  { id: "EXP-005", title: "2024 3Q 분기 운전 리뷰", type: "exception", subType: "분기 리뷰", process: "전체", category: "분기리뷰", date: "2024-10-15", year: 2024, author: "기술팀", approver: "공장장", tags: ["분기", "KPI", "마진"], summary: "3분기 종합 운전 리뷰. Gross Margin 전분기 대비 +2.3%. 에너지 원단위 개선 1.5%.", assetValue: "high" },
  { id: "EXP-006", title: "2023 TA 종합 요약 레포트", type: "exception", subType: "TA 요약", process: "전체", category: "TA", date: "2023-08-20", year: 2023, author: "기술팀", approver: "공장장", tags: ["TA", "정비"], summary: "2023년 정기보수 종합 요약. 총 310개 항목 완료. VDU Heater Decoking 성공.", assetValue: "high" },
  { id: "EXP-007", title: "2025 1월 OOP 월간 요약 레포트", type: "exception", subType: "OOP 월간", process: "전체", category: "월간리뷰", date: "2025-02-05", year: 2025, author: "기술팀", approver: "박팀장", tags: ["월간", "KPI"], summary: "2025년 1월 실적. EII 96.5%, OA 97.8%. VDU Heater Trip 1건, HCR 온도 이상 1건.", assetValue: "medium" },
  { id: "EXP-008", title: "2024 에너지 절감 연간 실적 보고서", type: "exception", subType: "연간 보고", process: "전체", category: "에너지", date: "2025-01-20", year: 2025, author: "기술팀", approver: "공장장", tags: ["에너지", "절감", "연간"], summary: "2024년 에너지 절감 활동 총괄. 연간 38억원 절감 달성(목표 35억 대비 109%).", assetValue: "high" },
  { id: "EXP-009", title: "2024 2Q 분기 운전 리뷰", type: "exception", subType: "분기 리뷰", process: "전체", category: "분기리뷰", date: "2024-07-10", year: 2024, author: "기술팀", approver: "공장장", tags: ["분기", "KPI"], summary: "2분기 종합 운전 리뷰. TA 기간 제외 OA 99.2%. 안전 무사고 달성.", assetValue: "medium" },
  { id: "EXP-010", title: "2024 1Q 분기 운전 리뷰", type: "exception", subType: "분기 리뷰", process: "전체", category: "분기리뷰", date: "2024-04-12", year: 2024, author: "기술팀", approver: "공장장", tags: ["분기", "KPI"], summary: "1분기 운전 리뷰. Feed 품질 변동에 따른 수율 영향 분석 포함.", assetValue: "medium" },
]

const ALL_REPORTS = [...TICKET_REPORTS, ...EXCEPTION_REPORTS]
const PROCESSES = ["전체", "CDU", "VDU", "HCR", "CCR", "FCC", "SRU", "전체(공통)"]
const YEARS = ["전체", "2025", "2024", "2023", "2022", "2021"]
const CATEGORIES = ["전체", "촉매 관리", "설비 정비", "설비건전성", "최적화", "계장", "회전기계", "TA", "월간리뷰", "분기리뷰", "에너지"]

export default function FinalReportsPage() {
  const [activeTab, setActiveTab] = useState("all")
  const [search, setSearch] = useState("")
  const [processFilter, setProcessFilter] = useState("전체")
  const [yearFilter, setYearFilter] = useState("전체")
  const [categoryFilter, setCategoryFilter] = useState("전체")
  const [selectedReport, setSelectedReport] = useState<FinalReport | null>(null)

  const getFiltered = (list: FinalReport[]) => list.filter(r => {
    if (search && !r.title.toLowerCase().includes(search.toLowerCase()) && !r.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))) return false
    if (processFilter !== "전체" && r.process !== processFilter && !(processFilter === "전체(공통)" && r.process === "전체")) return false
    if (yearFilter !== "전체" && r.year !== Number(yearFilter)) return false
    if (categoryFilter !== "전체" && r.category !== categoryFilter) return false
    return true
  })

  const currentList = activeTab === "all" ? getFiltered(ALL_REPORTS) : activeTab === "ticket" ? getFiltered(TICKET_REPORTS) : getFiltered(EXCEPTION_REPORTS)

  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="px-6 py-4">
            <h1 className="text-lg font-semibold">최종 레포트</h1>
            <p className="text-sm text-muted-foreground mt-1">팀장 승인 완료된 자산화 레포트 및 TA/OOP 월간 예외 레포트를 조회합니다</p>
          </div>
        </header>

        <main className="p-6 space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-4 gap-3">
            <Card><CardContent className="pt-4 pb-3"><div className="text-xs text-muted-foreground">전체 레포트</div><p className="text-2xl font-bold mt-1">{ALL_REPORTS.length}</p></CardContent></Card>
            <Card><CardContent className="pt-4 pb-3"><div className="text-xs text-muted-foreground">티켓 종결 레포트</div><p className="text-2xl font-bold mt-1 text-blue-600">{TICKET_REPORTS.length}</p></CardContent></Card>
            <Card><CardContent className="pt-4 pb-3"><div className="text-xs text-muted-foreground">예외 레포트</div><p className="text-2xl font-bold mt-1 text-indigo-600">{EXCEPTION_REPORTS.length}</p></CardContent></Card>
            <Card><CardContent className="pt-4 pb-3"><div className="text-xs text-muted-foreground">높은 자산가치</div><p className="text-2xl font-bold mt-1 text-amber-600">{ALL_REPORTS.filter(r => r.assetValue === "high").length}</p></CardContent></Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="제목, 태그로 검색..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                </div>
                <Select value={processFilter} onValueChange={setProcessFilter}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>{PROCESSES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                  <SelectContent>{YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">전체 <Badge variant="secondary" className="ml-1 text-[10px] h-4">{getFiltered(ALL_REPORTS).length}</Badge></TabsTrigger>
              <TabsTrigger value="ticket">티켓 종결 <Badge variant="secondary" className="ml-1 text-[10px] h-4">{getFiltered(TICKET_REPORTS).length}</Badge></TabsTrigger>
              <TabsTrigger value="exception">예외 레포트 <Badge variant="secondary" className="ml-1 text-[10px] h-4">{getFiltered(EXCEPTION_REPORTS).length}</Badge></TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4 space-y-2">
              {currentList.length === 0 ? (
                <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">검색 결과가 없습니다.</CardContent></Card>
              ) : currentList.map(r => (
                <Card key={r.id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setSelectedReport(r)}>
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {r.assetValue === "high" ? <Star className="h-4 w-4 text-amber-500 shrink-0" /> : <FileText className="h-4 w-4 text-muted-foreground shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground">{r.id}</span>
                          <Badge className={cn("text-[10px]",
                            r.type === "ticket-closure" && "bg-blue-50 text-blue-700 border-blue-200",
                            r.type === "exception" && "bg-indigo-50 text-indigo-700 border-indigo-200",
                          )} variant="outline">{r.subType}</Badge>
                          <span className="text-sm font-medium truncate">{r.title}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{r.summary}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0">{r.process}</Badge>
                      <Badge variant="outline" className="text-[10px] shrink-0">{r.category}</Badge>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0 w-20 text-right">
                        <CheckCircle className="h-3 w-3 text-emerald-500" />
                        {r.date}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Report Detail Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              {selectedReport?.assetValue === "high" && <Star className="h-4 w-4 text-amber-500" />}
              {selectedReport?.id} - {selectedReport?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={cn("text-[10px]",
                  selectedReport.type === "ticket-closure" && "bg-blue-50 text-blue-700 border-blue-200",
                  selectedReport.type === "exception" && "bg-indigo-50 text-indigo-700 border-indigo-200",
                )} variant="outline">{selectedReport.subType}</Badge>
                <Badge variant="outline" className="text-[10px]">{selectedReport.process}</Badge>
                <Badge variant="outline" className="text-[10px]">{selectedReport.category}</Badge>
                <Badge variant={selectedReport.assetValue === "high" ? "default" : "secondary"} className="text-[10px]">
                  자산가치: {selectedReport.assetValue === "high" ? "높음" : "보통"}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground text-xs">작성자</span><p className="font-medium">{selectedReport.author}</p></div>
                <div><span className="text-muted-foreground text-xs">승인자</span><p className="font-medium flex items-center gap-1"><CheckCircle className="h-3 w-3 text-emerald-500" />{selectedReport.approver}</p></div>
                <div><span className="text-muted-foreground text-xs">작성일</span><p className="font-medium">{selectedReport.date}</p></div>
                {selectedReport.relatedTicketId && (
                  <div><span className="text-muted-foreground text-xs">관련 티켓</span><p className="font-medium text-blue-600">{selectedReport.relatedTicketId}</p></div>
                )}
              </div>
              <div>
                <span className="text-muted-foreground text-xs">요약</span>
                <p className="mt-1 p-3 bg-muted/40 rounded-lg leading-relaxed">{selectedReport.summary}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {selectedReport.tags.map(t => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <Button variant="outline" size="sm" className="gap-1.5"><Eye className="h-3.5 w-3.5" />원문 보기</Button>
                <Button variant="outline" size="sm" className="gap-1.5"><Download className="h-3.5 w-3.5" />다운로드</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
