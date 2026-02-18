"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import {
  Search, FileText, FileBarChart, Calendar, Filter, Tag,
  Folder, ExternalLink, Link, Layers, Clock, Users, Eye, Download, ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"

interface KnowledgeAsset {
  id: string
  title: string
  type: "ticket-report" | "closure-report" | "monthly-report" | "analysis" | "review" | "attachment"
  process: string
  category: string
  date: string
  year: number
  author: string
  relatedTicketId?: string
  relatedTicketTitle?: string
  tags: string[]
  status: "approved" | "pending-review" | "draft"
  summary?: string
}

const ASSETS: KnowledgeAsset[] = [
  { id: "KA-001", title: "HCR WABT 상승 원인 분석 보고서", type: "closure-report", process: "HCR", category: "최적화", date: "2024-12-20", year: 2024, author: "김철수", relatedTicketId: "1", relatedTicketTitle: "HCR 촉매 교체 검토", tags: ["촉매", "WABT", "수명예측"], status: "approved", summary: "HCR 촉매 WABT 상승 추이 분석 및 EOR 시점 예측. Arabian Medium 전환에 따른 영향도 평가 포함." },
  { id: "KA-002", title: "E-101 Fouling 세정 효과 분석", type: "analysis", process: "CDU", category: "정비", date: "2024-11-15", year: 2024, author: "박엔지니어", relatedTicketId: "2", relatedTicketTitle: "E-101 세정 계획", tags: ["Fouling", "열교환기", "세정"], status: "approved", summary: "E-101 화학 세정 전후 UA값 비교 분석. 세정 주기 최적화 제안." },
  { id: "KA-003", title: "2024 4Q Monthly Operation Review", type: "monthly-report", process: "공통", category: "리뷰", date: "2025-01-10", year: 2025, author: "기술팀", tags: ["월간리뷰", "KPI", "운전실적"], status: "approved", summary: "2024년 4분기 운전 실적 종합 리뷰. EII, OA, Operating Cost 분석." },
  { id: "KA-004", title: "CCR Catalyst Regeneration 최적화", type: "closure-report", process: "CCR", category: "최적화", date: "2024-09-22", year: 2024, author: "이연구원", tags: ["촉매재생", "Coke", "최적화"], status: "approved", summary: "CCR 촉매 재생 조건 최적화를 통한 촉매 수명 연장 및 에너지 절감." },
  { id: "KA-005", title: "VDU Heater Coking 진행 추이 분석", type: "analysis", process: "VDU", category: "설비건전성", date: "2024-08-10", year: 2024, author: "김철수", tags: ["Coking", "Heater", "건전성"], status: "approved" },
  { id: "KA-006", title: "Bio Diesel 원료 혼합 테스트 결과", type: "closure-report", process: "HCR", category: "최적화", date: "2024-06-15", year: 2024, author: "박연구원", tags: ["Bio Diesel", "혼합비", "품질"], status: "approved" },
  { id: "KA-007", title: "FCC 신규 촉매 Pilot 평가 보고서", type: "analysis", process: "FCC", category: "최적화", date: "2023-11-20", year: 2023, author: "이엔지니어", tags: ["FCC", "촉매", "Pilot"], status: "approved" },
  { id: "KA-008", title: "Opportunity Crude 도입 운전 영향 분석", type: "closure-report", process: "CDU", category: "최적화", date: "2023-08-05", year: 2023, author: "김철수", tags: ["Opportunity Crude", "원유", "부식"], status: "approved" },
  { id: "KA-009", title: "HCR 수율 최적화 LP Vector 분석", type: "analysis", process: "HCR", category: "최적화", date: "2021-05-12", year: 2021, author: "박엔지니어", relatedTicketId: "5", relatedTicketTitle: "HCR 수율 개선", tags: ["수율", "LP", "최적화"], status: "approved", summary: "HCR 수율 최적화를 위한 LP Vector 분석 및 운전 조건 제안." },
  { id: "KA-010", title: "2025 1Q 월간 리포트 (초안)", type: "monthly-report", process: "공통", category: "리뷰", date: "2025-02-01", year: 2025, author: "기술팀", tags: ["월간리뷰"], status: "pending-review" },
]

const PROCESSES = ["전체", "CDU", "VDU", "HCR", "CCR", "FCC", "공통"]
const YEARS = ["전체", "2025", "2024", "2023", "2022", "2021"]
const CATEGORIES = ["전체", "최적화", "정비", "설비건전성", "리뷰", "트러블슈팅"]
const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  "closure-report": { label: "종료 Report", color: "bg-blue-50 text-blue-700 border-blue-200" },
  "monthly-report": { label: "월간 Report", color: "bg-green-50 text-green-700 border-green-200" },
  "analysis": { label: "분석", color: "bg-purple-50 text-purple-700 border-purple-200" },
  "ticket-report": { label: "티켓 Report", color: "bg-amber-50 text-amber-700 border-amber-200" },
  "review": { label: "리뷰", color: "bg-teal-50 text-teal-700 border-teal-200" },
  "attachment": { label: "첨부파일", color: "bg-gray-50 text-gray-700 border-gray-200" },
}

export default function KnowledgeAssetsPage() {
  const [search, setSearch] = useState("")
  const [processFilter, setProcessFilter] = useState("전체")
  const [yearFilter, setYearFilter] = useState("전체")
  const [categoryFilter, setCategoryFilter] = useState("전체")
  const [selectedAsset, setSelectedAsset] = useState<KnowledgeAsset | null>(null)

  const filtered = ASSETS.filter(a => {
    if (search && !a.title.toLowerCase().includes(search.toLowerCase()) && !a.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))) return false
    if (processFilter !== "전체" && a.process !== processFilter) return false
    if (yearFilter !== "전체" && a.year !== Number(yearFilter)) return false
    if (categoryFilter !== "전체" && a.category !== categoryFilter) return false
    return true
  })

  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="px-6 py-4">
            <h1 className="text-lg font-semibold">Knowledge Asset</h1>
            <p className="text-sm text-muted-foreground mt-1">OOP에서 생성된 티켓, 레포트, 분석 자료가 체계화된 형태로 자동 저장됩니다</p>
          </div>
        </header>

        <main className="p-6 space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="제목, 태그로 검색... (예: HCR 최적화 2021)" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                </div>
                <Select value={processFilter} onValueChange={setProcessFilter}>
                  <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
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

          {/* Summary */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "전체 자산", value: ASSETS.length, color: "text-foreground" },
              { label: "종료 Report", value: ASSETS.filter(a => a.type === "closure-report").length, color: "text-blue-600" },
              { label: "분석 자료", value: ASSETS.filter(a => a.type === "analysis").length, color: "text-purple-600" },
              { label: "리뷰 대기", value: ASSETS.filter(a => a.status === "pending-review").length, color: "text-amber-600" },
            ].map(stat => (
              <Card key={stat.label}>
                <CardContent className="pt-4 pb-4 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                  <span className={cn("text-xl font-bold", stat.color)}>{stat.value}</span>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Results */}
          <Card>
            <CardContent className="pt-4 pb-2">
              <p className="text-sm text-muted-foreground mb-3">{filtered.length}건의 Knowledge Asset</p>
              <div className="divide-y">
                {filtered.map(asset => (
                  <button
                    key={asset.id}
                    onClick={() => setSelectedAsset(asset)}
                    className="w-full text-left py-3 px-2 hover:bg-muted/30 rounded transition-colors flex items-start gap-3"
                  >
                    <FileBarChart className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={cn("text-xs", TYPE_LABELS[asset.type]?.color)}>{TYPE_LABELS[asset.type]?.label}</Badge>
                        <Badge variant="outline" className="text-xs">{asset.process}</Badge>
                        {asset.status === "pending-review" && <Badge className="text-xs bg-amber-100 text-amber-700">리뷰 대기</Badge>}
                      </div>
                      <p className="text-sm font-medium truncate">{asset.title}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{asset.date}</span>
                        <span>{asset.author}</span>
                        {asset.relatedTicketId && <span className="flex items-center gap-1 text-primary"><Link className="h-3 w-3" />Ticket #{asset.relatedTicketId}</span>}
                      </div>
                      {asset.tags.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          {asset.tags.map(tag => <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>)}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                  </button>
                ))}
                {filtered.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground text-sm">검색 조건에 일치하는 Knowledge Asset이 없습니다.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Asset Detail Dialog */}
      <Dialog open={!!selectedAsset} onOpenChange={o => !o && setSelectedAsset(null)}>
        <DialogContent className="max-w-lg">
          {selectedAsset && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base">{selectedAsset.title}</DialogTitle>
                <DialogDescription className="sr-only">Knowledge Asset 상세</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className={cn("text-xs", TYPE_LABELS[selectedAsset.type]?.color)}>{TYPE_LABELS[selectedAsset.type]?.label}</Badge>
                  <Badge variant="outline" className="text-xs">{selectedAsset.process}</Badge>
                  <Badge variant="outline" className="text-xs">{selectedAsset.category}</Badge>
                  <Badge variant={selectedAsset.status === "approved" ? "secondary" : "outline"} className="text-xs">
                    {selectedAsset.status === "approved" ? "승인됨" : selectedAsset.status === "pending-review" ? "리뷰 대기" : "초안"}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-xs text-muted-foreground">작성자</span><p className="font-medium">{selectedAsset.author}</p></div>
                  <div><span className="text-xs text-muted-foreground">작성일</span><p className="font-medium">{selectedAsset.date}</p></div>
                </div>
                {selectedAsset.summary && <div className="p-3 bg-muted/30 rounded-lg text-sm">{selectedAsset.summary}</div>}
                {selectedAsset.relatedTicketId && (
                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-center gap-2 text-sm">
                    <Link className="h-4 w-4 text-primary" />
                    <span>연결 티켓: <strong className="text-primary">#{selectedAsset.relatedTicketId}</strong> {selectedAsset.relatedTicketTitle}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {selectedAsset.tags.map(tag => <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>)}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 gap-1.5 bg-transparent"><Eye className="h-3.5 w-3.5" />문서 보기</Button>
                  <Button variant="outline" className="flex-1 gap-1.5 bg-transparent"><Download className="h-3.5 w-3.5" />다운로드</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
