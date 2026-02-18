"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import {
  Search,
  Plus,
  BookOpen,
  Tag,
  Factory,
  Edit2,
  Trash2,
  ChevronRight,
  Info,
  FileText,
  Sparkles,
} from "lucide-react"

// Types
interface Term {
  id: string
  term: string
  abbreviation?: string
  definition: string
  category: string
  unit?: string
  relatedTerms?: string[]
  synonyms?: string[]
  source?: string
  ragNote?: string
  createdDate: string
  updatedDate: string
  createdBy: string
}

const CATEGORIES = [
  { value: "all", label: "전체" },
  { value: "process", label: "공정 용어" },
  { value: "equipment", label: "장치/설비" },
  { value: "catalyst", label: "촉매" },
  { value: "parameter", label: "운전 변수" },
  { value: "kpi", label: "KPI/지표" },
  { value: "safety", label: "안전/환경" },
  { value: "chemistry", label: "화학/반응" },
  { value: "maintenance", label: "정비" },
  { value: "abbreviation", label: "약어" },
]

const INITIAL_TERMS: Term[] = [
  {
    id: "T-001",
    term: "WABT",
    abbreviation: "WABT",
    definition: "Weighted Average Bed Temperature. 촉매층의 가중 평균 온도로, 촉매 활성도와 반응 진행 정도를 나타내는 핵심 지표. HCR/HDS 등 수소화 반응 공정에서 촉매 수명 관리의 기준이 된다.",
    category: "parameter",
    unit: "HCR",
    relatedTerms: ["EOR", "SOR", "촉매 활성도", "Deactivation Rate"],
    synonyms: ["가중평균층온도"],
    source: "Chevron Lummus Global License Manual",
    ragNote: "WABT는 반드시 촉매 bed별 온도 데이터와 연계하여 해석해야 함. 단순 평균이 아닌 촉매 분포 가중치 적용.",
    createdDate: "2024-01-15",
    updatedDate: "2025-01-20",
    createdBy: "김철수",
  },
  {
    id: "T-002",
    term: "EOR",
    abbreviation: "EOR",
    definition: "End of Run. 촉매 수명의 마지막 시점을 의미하며, WABT가 설계 상한 온도에 도달한 상태. 이 시점에서 촉매 교체 또는 재생이 필요하다.",
    category: "catalyst",
    unit: "HCR",
    relatedTerms: ["WABT", "SOR", "촉매 교체", "Turnaround"],
    source: "내부 운전 매뉴얼",
    ragNote: "EOR 판단 시 WABT 외에 제품 품질 Spec 충족 여부도 함께 고려해야 함.",
    createdDate: "2024-01-15",
    updatedDate: "2024-06-10",
    createdBy: "김철수",
  },
  {
    id: "T-003",
    term: "EII",
    abbreviation: "EII",
    definition: "Energy Intensity Index. Solomon Associates에서 정의한 에너지 집약도 지표로, 공장의 에너지 효율을 업계 표준 대비 평가한다. 100 기준으로 낮을수록 효율적.",
    category: "kpi",
    relatedTerms: ["Operating Cost", "에너지 효율", "Solomon"],
    source: "Solomon Associates EII Methodology",
    ragNote: "EII 계산 시 DR 데이터, ROMYS 데이터, OOP 변수 데이터가 필요. 공정별 가중치가 다르므로 주의.",
    createdDate: "2024-02-01",
    updatedDate: "2025-02-01",
    createdBy: "이영희",
  },
  {
    id: "T-004",
    term: "Fouling Factor",
    definition: "열교환기 내부 오염에 의한 열전달 저항 증가를 나타내는 계수. UA값 감소로 간접 측정하며, 세정 시기 판단의 기준이 된다.",
    category: "equipment",
    unit: "CDU",
    relatedTerms: ["UA값", "열교환기", "세정", "CIP"],
    synonyms: ["오염계수", "Rf"],
    source: "TEMA Standards",
    ragNote: "Fouling Factor는 설계 기준값과 운전 중 실측값을 비교하여 세정 필요성을 판단.",
    createdDate: "2024-03-10",
    updatedDate: "2024-11-15",
    createdBy: "박안전",
  },
  {
    id: "T-005",
    term: "Severity",
    definition: "FCC/Reformer 등 반응 공정에서 반응 조건의 가혹도를 나타내는 지표. 온도, 공간속도(LHSV), 수소분압 등의 조합으로 결정된다.",
    category: "process",
    unit: "FCC",
    relatedTerms: ["Conversion", "LHSV", "ROT"],
    source: "UOP License Manual",
    ragNote: "공정별로 Severity 정의가 다름. FCC는 Riser 출구 온도, Reformer는 WAIT 기준.",
    createdDate: "2024-04-20",
    updatedDate: "2024-09-08",
    createdBy: "이영희",
  },
  {
    id: "T-006",
    term: "DR",
    abbreviation: "DR",
    definition: "Daily Report. 일일 운전 보고서로, 각 공정의 운전 변수 실적을 기록한 문서. OOP에서 RTDB와 정합성이 검증된다.",
    category: "abbreviation",
    relatedTerms: ["RTDB", "OOP", "Operating Cost"],
    source: "내부 절차서",
    ragNote: "DR 데이터는 OOP의 RTDB로 정합성이 백업되는 구조. SSoT 관리 대상.",
    createdDate: "2024-01-01",
    updatedDate: "2025-01-01",
    createdBy: "김철수",
  },
  {
    id: "T-007",
    term: "RTDB",
    abbreviation: "RTDB",
    definition: "Real-Time Database. PI System 등 실시간 데이터 수집 시스템의 데이터베이스. DCS에서 수집된 태그 데이터를 시계열로 저장.",
    category: "abbreviation",
    relatedTerms: ["DCS", "PI System", "Tag", "DR"],
    source: "OSIsoft PI System Documentation",
    ragNote: "RTDB 데이터는 OOP의 SSoT에서 DR 변수 정합성 백업에 활용됨.",
    createdDate: "2024-01-01",
    updatedDate: "2024-12-01",
    createdBy: "정설비",
  },
  {
    id: "T-008",
    term: "OA",
    abbreviation: "OA",
    definition: "Operational Availability. 설비 가동률을 나타내는 KPI로, 계획 정비 시간을 제외한 실제 운전 가능 시간 대비 운전 시간의 비율.",
    category: "kpi",
    relatedTerms: ["MTBF", "MTTR", "가동률"],
    source: "Solomon Associates",
    ragNote: "OA 산출 시 계획정지(TA, SD)와 비계획정지를 구분해야 함.",
    createdDate: "2024-05-01",
    updatedDate: "2025-01-15",
    createdBy: "최정비",
  },
  {
    id: "T-009",
    term: "NECC",
    abbreviation: "NECC",
    definition: "Net Energy Cost of Conversion. 정유공장에서 원유를 제품으로 전환하는 데 소요되는 순에너지 비용. Operating Cost의 주요 구성요소.",
    category: "kpi",
    relatedTerms: ["Operating Cost", "EII", "에너지 효율"],
    source: "내부 KPI 정의서",
    ragNote: "NECC는 Operating Cost 하위 지표로, Price Data(PDP)와 연계 계산됨.",
    createdDate: "2024-06-01",
    updatedDate: "2025-02-01",
    createdBy: "이영희",
  },
]

export default function TerminologyPage() {
  const [terms, setTerms] = useState<Term[]>(INITIAL_TERMS)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [selectedTerm, setSelectedTerm] = useState<Term | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newTerm, setNewTerm] = useState({ term: "", abbreviation: "", definition: "", category: "process", unit: "", ragNote: "", source: "" })

  const filteredTerms = terms.filter(t => {
    const matchesSearch = !searchQuery ||
      t.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.definition.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.abbreviation && t.abbreviation.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.synonyms && t.synonyms.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())))
    const matchesCategory = categoryFilter === "all" || t.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const handleAddTerm = () => {
    if (!newTerm.term.trim() || !newTerm.definition.trim()) return
    const id = `T-${String(terms.length + 1).padStart(3, "0")}`
    const now = new Date().toISOString().split("T")[0]
    setTerms([...terms, { id, ...newTerm, relatedTerms: [], createdDate: now, updatedDate: now, createdBy: "김철수" }])
    setNewTerm({ term: "", abbreviation: "", definition: "", category: "process", unit: "", ragNote: "", source: "" })
    setShowAddDialog(false)
  }

  const categoryCounts = CATEGORIES.slice(1).map(c => ({
    ...c,
    count: terms.filter(t => t.category === c.value).length
  }))

  return (
    <AppShell>
      <div className="flex flex-col h-full">
        {/* Header */}
        <header className="border-b bg-background/95 backdrop-blur px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground text-balance">용어 관리</h1>
              <p className="text-sm text-muted-foreground">공정 전용 용어 관리 - RAG 구성 시 참조 사전으로 활용됩니다</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <BookOpen className="h-3 w-3" />
                {terms.length}개 용어
              </Badge>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-1.5" />
                용어 등록
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <div className="flex gap-6">
            {/* Left: List */}
            <div className="w-96 shrink-0 space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="용어, 약어, 정의 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Category Filter */}
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map(c => (
                  <Button
                    key={c.value}
                    variant={categoryFilter === c.value ? "default" : "outline"}
                    size="sm"
                    className={cn("text-xs h-7", categoryFilter !== c.value && "bg-transparent")}
                    onClick={() => setCategoryFilter(c.value)}
                  >
                    {c.label}
                    {c.value !== "all" && (
                      <Badge variant="secondary" className="ml-1 text-xs h-4 px-1">
                        {c.value === "all" ? terms.length : terms.filter(t => t.category === c.value).length}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>

              {/* Term List */}
              <div className="space-y-1.5 max-h-[calc(100vh-320px)] overflow-y-auto">
                {filteredTerms.map(term => (
                  <button
                    key={term.id}
                    onClick={() => setSelectedTerm(term)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg border transition-colors",
                      selectedTerm?.id === term.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{term.term}</span>
                      {term.abbreviation && term.abbreviation !== term.term && (
                        <Badge variant="outline" className="text-xs">{term.abbreviation}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{term.definition}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant="secondary" className="text-xs">
                        {CATEGORIES.find(c => c.value === term.category)?.label || term.category}
                      </Badge>
                      {term.unit && <span className="text-xs text-muted-foreground">{term.unit}</span>}
                    </div>
                  </button>
                ))}
                {filteredTerms.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    검색 결과가 없습니다
                  </div>
                )}
              </div>
            </div>

            {/* Right: Detail */}
            <div className="flex-1 min-w-0">
              {selectedTerm ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl flex items-center gap-3">
                          {selectedTerm.term}
                          {selectedTerm.abbreviation && selectedTerm.abbreviation !== selectedTerm.term && (
                            <Badge variant="outline">{selectedTerm.abbreviation}</Badge>
                          )}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary">
                            {CATEGORIES.find(c => c.value === selectedTerm.category)?.label}
                          </Badge>
                          {selectedTerm.unit && (
                            <Badge variant="outline" className="gap-1">
                              <Factory className="h-3 w-3" />{selectedTerm.unit}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        <Button variant="outline" size="sm" className="bg-transparent gap-1">
                          <Edit2 className="h-3.5 w-3.5" />수정
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Definition */}
                    <div>
                      <Label className="text-xs text-muted-foreground font-medium">정의</Label>
                      <p className="text-sm leading-relaxed mt-1">{selectedTerm.definition}</p>
                    </div>

                    {/* Synonyms */}
                    {selectedTerm.synonyms && selectedTerm.synonyms.length > 0 && (
                      <div>
                        <Label className="text-xs text-muted-foreground font-medium">동의어</Label>
                        <div className="flex gap-1.5 mt-1">
                          {selectedTerm.synonyms.map(s => (
                            <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Related Terms */}
                    {selectedTerm.relatedTerms && selectedTerm.relatedTerms.length > 0 && (
                      <div>
                        <Label className="text-xs text-muted-foreground font-medium">관련 용어</Label>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {selectedTerm.relatedTerms.map(rt => {
                            const linked = terms.find(t => t.term === rt || t.abbreviation === rt)
                            return linked ? (
                              <button
                                key={rt}
                                onClick={() => setSelectedTerm(linked)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-xs hover:bg-primary/20 transition-colors"
                              >
                                <ChevronRight className="h-3 w-3" />{rt}
                              </button>
                            ) : (
                              <Badge key={rt} variant="secondary" className="text-xs">{rt}</Badge>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    <Separator />

                    {/* RAG Note */}
                    {selectedTerm.ragNote && (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="h-4 w-4 text-amber-600" />
                          <Label className="text-xs font-semibold text-amber-800">RAG 참고사항</Label>
                        </div>
                        <p className="text-sm text-amber-900 leading-relaxed">{selectedTerm.ragNote}</p>
                      </div>
                    )}

                    {/* Source */}
                    {selectedTerm.source && (
                      <div>
                        <Label className="text-xs text-muted-foreground font-medium">출처</Label>
                        <p className="text-sm mt-1 flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                          {selectedTerm.source}
                        </p>
                      </div>
                    )}

                    {/* Meta */}
                    <div className="grid grid-cols-3 gap-4 p-3 bg-muted/30 rounded-lg">
                      <div>
                        <Label className="text-xs text-muted-foreground">등록일</Label>
                        <p className="text-xs font-medium mt-0.5">{selectedTerm.createdDate}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">최종 수정</Label>
                        <p className="text-xs font-medium mt-0.5">{selectedTerm.updatedDate}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">등록자</Label>
                        <p className="text-xs font-medium mt-0.5">{selectedTerm.createdBy}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-20">
                  <BookOpen className="h-12 w-12 mb-4 opacity-30" />
                  <p className="text-sm">좌측에서 용어를 선택하세요</p>
                  <p className="text-xs mt-1">등록된 용어의 정의, 관련 용어, RAG 참고사항을 확인할 수 있습니다</p>
                </div>
              )}

              {/* Category Statistics */}
              {!selectedTerm && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">카테고리별 현황</h3>
                  <div className="grid grid-cols-5 gap-3">
                    {categoryCounts.map(c => (
                      <button
                        key={c.value}
                        onClick={() => setCategoryFilter(c.value)}
                        className="p-3 border rounded-lg text-center hover:bg-muted/50 transition-colors"
                      >
                        <div className="text-lg font-bold">{c.count}</div>
                        <p className="text-xs text-muted-foreground">{c.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Add Term Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>용어 등록</DialogTitle>
            <DialogDescription>새로운 공정 용어를 등록합니다. RAG 참고사항은 추후 AI가 이 용어를 올바르게 해석하는 데 활용됩니다.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">용어명 *</Label>
                <Input value={newTerm.term} onChange={e => setNewTerm({ ...newTerm, term: e.target.value })} placeholder="예: WABT" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">약어</Label>
                <Input value={newTerm.abbreviation} onChange={e => setNewTerm({ ...newTerm, abbreviation: e.target.value })} placeholder="예: WABT" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">정의 *</Label>
              <Textarea value={newTerm.definition} onChange={e => setNewTerm({ ...newTerm, definition: e.target.value })} placeholder="용어의 정의를 상세하게 작성하세요..." className="min-h-20" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">카테고리</Label>
                <Select value={newTerm.category} onValueChange={v => setNewTerm({ ...newTerm, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.slice(1).map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">관련 공정</Label>
                <Input value={newTerm.unit} onChange={e => setNewTerm({ ...newTerm, unit: e.target.value })} placeholder="예: HCR, CDU" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">출처</Label>
              <Input value={newTerm.source} onChange={e => setNewTerm({ ...newTerm, source: e.target.value })} placeholder="예: License Manual, 내부 매뉴얼" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                RAG 참고사항
              </Label>
              <Textarea value={newTerm.ragNote} onChange={e => setNewTerm({ ...newTerm, ragNote: e.target.value })} placeholder="AI가 이 용어를 해석할 때 주의해야 할 점을 작성하세요..." className="min-h-16" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="bg-transparent" onClick={() => setShowAddDialog(false)}>취소</Button>
            <Button disabled={!newTerm.term.trim() || !newTerm.definition.trim()} onClick={handleAddTerm}>등록</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
