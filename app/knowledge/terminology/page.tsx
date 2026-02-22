"use client"

import { useState, useMemo } from "react"
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
  Search, Plus, BookOpen, Tag, Factory, Edit2, ChevronRight, Info,
  FileText, Sparkles, Network, Layers, Eye, GitBranch, ArrowRight
} from "lucide-react"

// ============= Types =============
interface Term {
  id: string; term: string; abbreviation?: string; definition: string
  category: string; unit?: string; relatedTerms?: string[]; synonyms?: string[]
  source?: string; ragNote?: string; createdDate: string; updatedDate: string; createdBy: string
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
  { id: "T-001", term: "WABT", abbreviation: "WABT", definition: "Weighted Average Bed Temperature. 촉매층의 가중 평균 온도로, 촉매 활성도와 반응 진행 정도를 나타내는 핵심 지표.", category: "parameter", unit: "HCR", relatedTerms: ["EOR", "SOR", "촉매 활성도", "Deactivation Rate"], synonyms: ["가중평균층온도"], source: "Chevron Lummus Global License Manual", ragNote: "WABT는 반드시 촉매 bed별 온도 데이터와 연계하여 해석해야 함.", createdDate: "2024-01-15", updatedDate: "2025-01-20", createdBy: "김철수" },
  { id: "T-002", term: "EOR", abbreviation: "EOR", definition: "End of Run. 촉매 수명의 마지막 시점을 의미하며, WABT가 설계 상한 온도에 도달한 상태.", category: "catalyst", unit: "HCR", relatedTerms: ["WABT", "SOR", "촉매 교체", "Turnaround"], source: "내부 운전 매뉴얼", ragNote: "EOR 판단 시 WABT 외에 제품 품질 Spec 충족 여부도 함께 고려해야 함.", createdDate: "2024-01-15", updatedDate: "2024-06-10", createdBy: "김철수" },
  { id: "T-003", term: "EII", abbreviation: "EII", definition: "Energy Intensity Index. Solomon Associates에서 정의한 에너지 집약도 지표.", category: "kpi", relatedTerms: ["Operating Cost", "에너지 효율", "Solomon"], source: "Solomon Associates EII Methodology", ragNote: "EII 계산 시 DR 데이터, ROMYS 데이터, OOP 변수 데이터가 필요.", createdDate: "2024-02-01", updatedDate: "2025-02-01", createdBy: "이영희" },
  { id: "T-004", term: "Fouling Factor", definition: "열교환기 내부 오염에 의한 열전달 저항 증가를 나타내는 계수.", category: "equipment", unit: "CDU", relatedTerms: ["UA값", "열교환기", "세정", "CIP"], synonyms: ["오염계수", "Rf"], source: "TEMA Standards", ragNote: "Fouling Factor는 설계 기준값과 운전 중 실측값을 비교하여 세정 필요성을 판단.", createdDate: "2024-03-10", updatedDate: "2024-11-15", createdBy: "박안전" },
  { id: "T-005", term: "Severity", definition: "FCC/Reformer 등 반응 공정에서 반응 조건의 가혹도를 나타내는 지표.", category: "process", unit: "FCC", relatedTerms: ["Conversion", "LHSV", "ROT"], source: "UOP License Manual", ragNote: "공정별로 Severity 정의가 다름.", createdDate: "2024-04-20", updatedDate: "2024-09-08", createdBy: "이영희" },
  { id: "T-006", term: "DR", abbreviation: "DR", definition: "Daily Report. 일일 운전 보고서.", category: "abbreviation", relatedTerms: ["RTDB", "OOP", "Operating Cost"], source: "내부 절차서", ragNote: "DR 데이터는 OOP의 RTDB로 정합성이 백업되는 구조.", createdDate: "2024-01-01", updatedDate: "2025-01-01", createdBy: "김철수" },
  { id: "T-007", term: "RTDB", abbreviation: "RTDB", definition: "Real-Time Database. PI System 등 실시간 데이터 수집 시스템의 데이터베이스.", category: "abbreviation", relatedTerms: ["DCS", "PI System", "Tag", "DR"], source: "OSIsoft PI System Documentation", ragNote: "RTDB 데이터는 OOP의 SSoT에서 DR 변수 정합성 백업에 활용됨.", createdDate: "2024-01-01", updatedDate: "2024-12-01", createdBy: "정설비" },
  { id: "T-008", term: "OA", abbreviation: "OA", definition: "Operational Availability. 설비 가동률을 나타내는 KPI.", category: "kpi", relatedTerms: ["MTBF", "MTTR", "가동률"], source: "Solomon Associates", ragNote: "OA 산출 시 계획정지(TA, SD)와 비계획정지를 구분해야 함.", createdDate: "2024-05-01", updatedDate: "2025-01-15", createdBy: "최정비" },
  { id: "T-009", term: "NECC", abbreviation: "NECC", definition: "Net Energy Cost of Conversion. 원유를 제품으로 전환하는 데 소요되는 순에너지 비용.", category: "kpi", relatedTerms: ["Operating Cost", "EII", "에너지 효율"], source: "내부 KPI 정의서", ragNote: "NECC는 Operating Cost 하위 지표.", createdDate: "2024-06-01", updatedDate: "2025-02-01", createdBy: "이영희" },
  { id: "T-010", term: "LHSV", abbreviation: "LHSV", definition: "Liquid Hourly Space Velocity. 시간당 액체 공간속도로 촉매 용적 대비 액체 투입량.", category: "parameter", unit: "HCR", relatedTerms: ["Severity", "Conversion", "촉매 활성도"], source: "License Manual", createdDate: "2024-02-15", updatedDate: "2024-11-01", createdBy: "김철수" },
  { id: "T-011", term: "SOR", abbreviation: "SOR", definition: "Start of Run. 촉매 교체 후 운전 개시 시점.", category: "catalyst", unit: "HCR", relatedTerms: ["EOR", "WABT", "Deactivation Rate"], source: "License Manual", createdDate: "2024-01-15", updatedDate: "2024-06-10", createdBy: "김철수" },
  { id: "T-012", term: "Flash Zone", definition: "상압증류탑(CDU) 내 원유가 기화되어 분리가 시작되는 영역.", category: "process", unit: "CDU", relatedTerms: ["CDU", "증류탑", "Over Flash"], source: "Process Engineering Manual", createdDate: "2024-04-10", updatedDate: "2024-10-15", createdBy: "이영희" },
  { id: "T-013", term: "Turnaround", abbreviation: "TA", definition: "정기보수. 공장 전체 또는 Unit 단위의 계획 정지 후 정비/개선 작업.", category: "maintenance", relatedTerms: ["EOR", "Catalyst Change", "OA"], source: "내부 절차서", ragNote: "TA 기간 중 촉매 교체, 열교환기 세정, 설비 교체 등이 수행됨.", createdDate: "2024-01-01", updatedDate: "2025-02-01", createdBy: "최정비" },
  { id: "T-014", term: "H/C Ratio", definition: "Hydrogen to Carbon Ratio. 수소화 반응 공정에서의 수소 대 탄화수소 몰비.", category: "parameter", unit: "HCR", relatedTerms: ["WABT", "Severity", "H2 Purity"], source: "License Manual", createdDate: "2024-03-20", updatedDate: "2024-08-15", createdBy: "김철수" },
  { id: "T-015", term: "CIP", abbreviation: "CIP", definition: "Clean in Place. 설비를 분해하지 않고 Chemical 순환으로 세정하는 방법.", category: "maintenance", unit: "CDU", relatedTerms: ["Fouling Factor", "열교환기", "Online Cleaning"], source: "Maintenance Manual", createdDate: "2024-06-01", updatedDate: "2025-01-10", createdBy: "정설비" },
]

// ============= Ontology Data =============
interface OntologyNode { id: string; label: string; type: "process" | "equipment" | "tag" | "parameter" | "product"; children?: string[] }

const ONTOLOGY_PROCESSES: { id: string; label: string; equipments: { id: string; label: string; tags: { id: string; label: string; type: string }[] }[] }[] = [
  { id: "CDU", label: "CDU (상압증류)", equipments: [
    { id: "CDU-T-001", label: "CDU 상압탑", tags: [{ id: "TI-1001", label: "Flash Zone Temp", type: "온도" }, { id: "PI-1001", label: "Top Pressure", type: "압력" }, { id: "FI-1001", label: "Feed Flow", type: "유량" }, { id: "AI-1001", label: "Overhead pH", type: "분석" }]},
    { id: "CDU-E-001", label: "CDU 예열 HEX Train", tags: [{ id: "TI-1010", label: "Crude In Temp", type: "온도" }, { id: "TI-1011", label: "Crude Out Temp", type: "온도" }, { id: "PDI-1001", label: "dP", type: "차압" }]},
    { id: "CDU-H-001", label: "CDU Fired Heater", tags: [{ id: "TI-1020", label: "COT", type: "온도" }, { id: "TI-1021", label: "Bridge Wall Temp", type: "온도" }, { id: "FI-1010", label: "Fuel Gas Flow", type: "유량" }]},
    { id: "CDU-P-001", label: "CDU Feed Pump", tags: [{ id: "PI-1010", label: "Discharge Press", type: "압력" }, { id: "II-1001", label: "Motor Current", type: "전류" }]},
  ]},
  { id: "HCR", label: "HCR (수소화분해)", equipments: [
    { id: "HCR-R-001", label: "1st Stage Reactor", tags: [{ id: "TI-2001", label: "Inlet Temp", type: "온도" }, { id: "TI-2002", label: "Bed1 Temp", type: "온도" }, { id: "TI-2003", label: "Bed2 Temp", type: "온도" }, { id: "PDI-2001", label: "Bed dP", type: "차압" }]},
    { id: "HCR-R-002", label: "2nd Stage Reactor", tags: [{ id: "TI-2010", label: "Inlet Temp", type: "온도" }, { id: "TI-2011", label: "Outlet Temp", type: "온도" }]},
    { id: "HCR-E-001", label: "Feed/Effluent HEX", tags: [{ id: "TI-2020", label: "Shell In", type: "온도" }, { id: "TI-2021", label: "Shell Out", type: "온도" }, { id: "PDI-2010", label: "Shell dP", type: "차압" }]},
    { id: "HCR-C-001", label: "Recycle Compressor", tags: [{ id: "PI-2001", label: "Suction Press", type: "압력" }, { id: "PI-2002", label: "Discharge Press", type: "압력" }, { id: "FI-2001", label: "Recycle Gas Flow", type: "유량" }]},
    { id: "HCR-T-001", label: "Fractionator", tags: [{ id: "TI-2030", label: "Top Temp", type: "온도" }, { id: "PI-2010", label: "Top Press", type: "압력" }, { id: "LI-2001", label: "Bottom Level", type: "레벨" }]},
  ]},
  { id: "FCC", label: "FCC (유동층촉매분해)", equipments: [
    { id: "FCC-R-001", label: "Riser Reactor", tags: [{ id: "TI-3001", label: "Riser Outlet Temp", type: "온도" }, { id: "FI-3001", label: "Feed Flow", type: "유량" }]},
    { id: "FCC-G-001", label: "Regenerator", tags: [{ id: "TI-3010", label: "Dense Bed Temp", type: "온도" }, { id: "AI-3001", label: "Flue Gas O2", type: "분석" }, { id: "PDI-3001", label: "Cyclone dP", type: "차압" }]},
    { id: "FCC-T-001", label: "Main Fractionator", tags: [{ id: "TI-3020", label: "Top Temp", type: "온도" }, { id: "PI-3001", label: "Top Press", type: "압력" }]},
    { id: "FCC-B-001", label: "Gas Con. Unit", tags: [{ id: "TI-3030", label: "Absorber Top", type: "온도" }, { id: "PI-3010", label: "Absorber Press", type: "압력" }]},
  ]},
  { id: "VDU", label: "VDU (감압증류)", equipments: [
    { id: "VDU-T-001", label: "Vacuum Tower", tags: [{ id: "TI-4001", label: "Flash Zone Temp", type: "온도" }, { id: "PI-4001", label: "Top Vacuum", type: "압력" }]},
    { id: "VDU-H-001", label: "VDU Heater", tags: [{ id: "TI-4010", label: "COT", type: "온도" }, { id: "TI-4011", label: "Tube Skin Temp", type: "온도" }]},
  ]},
  { id: "SRU", label: "SRU (황회수)", equipments: [
    { id: "SRU-R-001", label: "Claus Reactor", tags: [{ id: "TI-5001", label: "Inlet Temp", type: "온도" }, { id: "AI-5001", label: "Tail Gas H2S", type: "분석" }]},
    { id: "SRU-F-001", label: "Reaction Furnace", tags: [{ id: "TI-5010", label: "Furnace Temp", type: "온도" }, { id: "FI-5001", label: "Air Flow", type: "유량" }]},
  ]},
]

const TAG_TYPE_COLORS: Record<string, string> = { "온도": "bg-red-100 text-red-700", "압력": "bg-blue-100 text-blue-700", "유량": "bg-emerald-100 text-emerald-700", "차압": "bg-amber-100 text-amber-700", "분석": "bg-purple-100 text-purple-700", "레벨": "bg-cyan-100 text-cyan-700", "전류": "bg-orange-100 text-orange-700" }

export default function TerminologyPage() {
  const [terms, setTerms] = useState<Term[]>(INITIAL_TERMS)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [selectedTerm, setSelectedTerm] = useState<Term | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newTerm, setNewTerm] = useState({ term: "", abbreviation: "", definition: "", category: "process", unit: "", ragNote: "", source: "" })
  const [mainTab, setMainTab] = useState("dictionary")

  // Ontology state
  const [ontoSearch, setOntoSearch] = useState("")
  const [ontoExpandedProc, setOntoExpandedProc] = useState<string | null>("CDU")
  const [ontoExpandedEquip, setOntoExpandedEquip] = useState<string | null>(null)

  const filteredTerms = terms.filter(t => {
    const matchesSearch = !searchQuery || t.term.toLowerCase().includes(searchQuery.toLowerCase()) || t.definition.toLowerCase().includes(searchQuery.toLowerCase()) || (t.abbreviation && t.abbreviation.toLowerCase().includes(searchQuery.toLowerCase())) || (t.synonyms && t.synonyms.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())))
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

  const filteredOntology = useMemo(() => {
    if (!ontoSearch) return ONTOLOGY_PROCESSES
    const q = ontoSearch.toLowerCase()
    return ONTOLOGY_PROCESSES.map(p => ({
      ...p,
      equipments: p.equipments.map(e => ({
        ...e,
        tags: e.tags.filter(t => t.id.toLowerCase().includes(q) || t.label.toLowerCase().includes(q))
      })).filter(e => e.tags.length > 0 || e.label.toLowerCase().includes(q) || e.id.toLowerCase().includes(q))
    })).filter(p => p.equipments.length > 0 || p.label.toLowerCase().includes(q))
  }, [ontoSearch])

  const totalTags = ONTOLOGY_PROCESSES.reduce((a, p) => a + p.equipments.reduce((b, e) => b + e.tags.length, 0), 0)
  const totalEquip = ONTOLOGY_PROCESSES.reduce((a, p) => a + p.equipments.length, 0)

  return (
    <AppShell>
      <div className="flex flex-col h-full">
        <header className="border-b bg-background/95 backdrop-blur px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-foreground text-balance">학습 / 용어</h1>
              <p className="text-sm text-muted-foreground">공정 용어 사전, 태그/설비/공정 온톨로지 맵 (읽기 전용)</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1"><BookOpen className="h-3 w-3" />{terms.length}개 용어</Badge>
              <Badge variant="outline" className="gap-1"><Network className="h-3 w-3" />{ONTOLOGY_PROCESSES.length} 공정 / {totalEquip} 설비 / {totalTags} 태그</Badge>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-hidden">
          <Tabs value={mainTab} onValueChange={setMainTab} className="flex flex-col h-full">
            <div className="border-b px-6 pt-2">
              <TabsList>
                <TabsTrigger value="dictionary" className="gap-1.5"><BookOpen className="h-3.5 w-3.5" />용어 사전</TabsTrigger>
                <TabsTrigger value="ontology" className="gap-1.5"><Network className="h-3.5 w-3.5" />온톨로지 뷰</TabsTrigger>
              </TabsList>
            </div>

            {/* ============= 용어 사전 탭 ============= */}
            <TabsContent value="dictionary" className="flex-1 overflow-auto p-6 mt-0">
              <div className="flex gap-6">
                {/* Left: List */}
                <div className="w-96 shrink-0 space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="용어, 약어, 정의 검색..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORIES.map(c => (
                      <Button key={c.value} variant={categoryFilter === c.value ? "default" : "outline"} size="sm" className={cn("text-xs h-7", categoryFilter !== c.value && "bg-transparent")} onClick={() => setCategoryFilter(c.value)}>
                        {c.label}
                        {c.value !== "all" && <Badge variant="secondary" className="ml-1 text-xs h-4 px-1">{terms.filter(t => t.category === c.value).length}</Badge>}
                      </Button>
                    ))}
                  </div>
                  <div className="space-y-1.5 max-h-[calc(100vh-340px)] overflow-y-auto">
                    {filteredTerms.map(term => (
                      <button key={term.id} onClick={() => setSelectedTerm(term)} className={cn("w-full text-left p-3 rounded-lg border transition-colors", selectedTerm?.id === term.id ? "border-primary bg-primary/5" : "hover:bg-muted/50")}>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{term.term}</span>
                          {term.abbreviation && term.abbreviation !== term.term && <Badge variant="outline" className="text-xs">{term.abbreviation}</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{term.definition}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge variant="secondary" className="text-xs">{CATEGORIES.find(c => c.value === term.category)?.label || term.category}</Badge>
                          {term.unit && <span className="text-xs text-muted-foreground">{term.unit}</span>}
                        </div>
                      </button>
                    ))}
                    {filteredTerms.length === 0 && <div className="text-center py-8 text-muted-foreground text-sm">검색 결과가 없습니다</div>}
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
                              {selectedTerm.abbreviation && selectedTerm.abbreviation !== selectedTerm.term && <Badge variant="outline">{selectedTerm.abbreviation}</Badge>}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="secondary">{CATEGORIES.find(c => c.value === selectedTerm.category)?.label}</Badge>
                              {selectedTerm.unit && <Badge variant="outline" className="gap-1"><Factory className="h-3 w-3" />{selectedTerm.unit}</Badge>}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[10px]"><Info className="h-3 w-3 mr-1" />읽기 전용</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-5">
                        <div>
                          <Label className="text-xs text-muted-foreground font-medium">정의</Label>
                          <p className="text-sm leading-relaxed mt-1">{selectedTerm.definition}</p>
                        </div>
                        {selectedTerm.synonyms && selectedTerm.synonyms.length > 0 && (
                          <div>
                            <Label className="text-xs text-muted-foreground font-medium">동의어</Label>
                            <div className="flex gap-1.5 mt-1">{selectedTerm.synonyms.map(s => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}</div>
                          </div>
                        )}
                        {selectedTerm.relatedTerms && selectedTerm.relatedTerms.length > 0 && (
                          <div>
                            <Label className="text-xs text-muted-foreground font-medium">관련 용어</Label>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {selectedTerm.relatedTerms.map(rt => {
                                const linked = terms.find(t => t.term === rt || t.abbreviation === rt)
                                return linked ? (
                                  <button key={rt} onClick={() => setSelectedTerm(linked)} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-xs hover:bg-primary/20 transition-colors"><ChevronRight className="h-3 w-3" />{rt}</button>
                                ) : <Badge key={rt} variant="secondary" className="text-xs">{rt}</Badge>
                              })}
                            </div>
                          </div>
                        )}
                        <Separator />
                        {selectedTerm.ragNote && (
                          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2"><Sparkles className="h-4 w-4 text-amber-600" /><Label className="text-xs font-semibold text-amber-800">RAG 참고사항</Label></div>
                            <p className="text-sm text-amber-900 leading-relaxed">{selectedTerm.ragNote}</p>
                          </div>
                        )}
                        {selectedTerm.source && (
                          <div>
                            <Label className="text-xs text-muted-foreground font-medium">출처</Label>
                            <p className="text-sm mt-1 flex items-center gap-1.5"><FileText className="h-3.5 w-3.5 text-muted-foreground" />{selectedTerm.source}</p>
                          </div>
                        )}
                        <div className="grid grid-cols-3 gap-4 p-3 bg-muted/30 rounded-lg">
                          <div><Label className="text-xs text-muted-foreground">등록일</Label><p className="text-xs font-medium mt-0.5">{selectedTerm.createdDate}</p></div>
                          <div><Label className="text-xs text-muted-foreground">최종 수정</Label><p className="text-xs font-medium mt-0.5">{selectedTerm.updatedDate}</p></div>
                          <div><Label className="text-xs text-muted-foreground">등록자</Label><p className="text-xs font-medium mt-0.5">{selectedTerm.createdBy}</p></div>
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
                </div>
              </div>
            </TabsContent>

            {/* ============= 온톨로지 뷰 탭 ============= */}
            <TabsContent value="ontology" className="flex-1 overflow-auto p-6 mt-0">
              <div className="space-y-4">
                {/* Header info */}
                <div className="flex items-center gap-3">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="공정, 설비, 태그 ID 검색..." value={ontoSearch} onChange={e => setOntoSearch(e.target.value)} className="pl-9" />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground ml-auto">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500" /><span>공정</span></span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500" /><span>설비</span></span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-400" /><span>태그</span></span>
                  </div>
                  <Badge variant="outline" className="text-[10px] gap-1"><Eye className="h-3 w-3" />읽기 전용 (마스터 원장: Data & Admin)</Badge>
                </div>

                {/* Tree view */}
                <div className="grid grid-cols-1 gap-2">
                  {filteredOntology.map(proc => (
                    <Card key={proc.id} className="border overflow-hidden">
                      <button
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
                        onClick={() => setOntoExpandedProc(ontoExpandedProc === proc.id ? null : proc.id)}
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                          <Factory className="h-4 w-4 text-blue-700" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-semibold">{proc.label}</span>
                          <span className="text-xs text-muted-foreground ml-2">{proc.equipments.length}개 설비 / {proc.equipments.reduce((a, e) => a + e.tags.length, 0)}개 태그</span>
                        </div>
                        <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform", ontoExpandedProc === proc.id && "rotate-90")} />
                      </button>

                      {ontoExpandedProc === proc.id && (
                        <div className="px-4 pb-3 space-y-1.5 border-t bg-muted/10 pt-2">
                          {proc.equipments.map(eq => (
                            <div key={eq.id}>
                              <button
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-background transition-colors"
                                onClick={() => setOntoExpandedEquip(ontoExpandedEquip === eq.id ? null : eq.id)}
                              >
                                <div className="w-6 h-6 rounded bg-emerald-100 flex items-center justify-center shrink-0 ml-4">
                                  <Layers className="h-3 w-3 text-emerald-700" />
                                </div>
                                <span className="text-xs font-medium flex-1">{eq.id} - {eq.label}</span>
                                <Badge variant="secondary" className="text-[10px] h-4">{eq.tags.length} 태그</Badge>
                                <ChevronRight className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", ontoExpandedEquip === eq.id && "rotate-90")} />
                              </button>

                              {ontoExpandedEquip === eq.id && (
                                <div className="ml-16 mt-1 mb-2 grid grid-cols-2 gap-1.5">
                                  {eq.tags.map(tag => (
                                    <div key={tag.id} className="flex items-center gap-2 p-2 rounded border bg-background text-xs">
                                      <span className="font-mono font-medium text-muted-foreground w-16 shrink-0">{tag.id}</span>
                                      <span className="flex-1 truncate">{tag.label}</span>
                                      <Badge className={cn("text-[9px] h-4 shrink-0", TAG_TYPE_COLORS[tag.type] || "bg-muted")}>{tag.type}</Badge>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>

                {filteredOntology.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Network className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">검색 결과가 없습니다</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Add Term Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>용어 등록</DialogTitle>
            <DialogDescription>새로운 공정 용어를 등록합니다. RAG 참고사항은 AI가 이 용어를 올바르게 해석하는 데 활용됩니다.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">용어명 *</Label><Input value={newTerm.term} onChange={e => setNewTerm({ ...newTerm, term: e.target.value })} placeholder="예: WABT" /></div>
              <div className="space-y-1.5"><Label className="text-xs">약어</Label><Input value={newTerm.abbreviation} onChange={e => setNewTerm({ ...newTerm, abbreviation: e.target.value })} placeholder="예: WABT" /></div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">정의 *</Label><Textarea value={newTerm.definition} onChange={e => setNewTerm({ ...newTerm, definition: e.target.value })} placeholder="상세하게 작성하세요..." className="min-h-20" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">카테고리</Label><Select value={newTerm.category} onValueChange={v => setNewTerm({ ...newTerm, category: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.slice(1).map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5"><Label className="text-xs">관련 공정</Label><Input value={newTerm.unit} onChange={e => setNewTerm({ ...newTerm, unit: e.target.value })} placeholder="예: HCR, CDU" /></div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">출처</Label><Input value={newTerm.source} onChange={e => setNewTerm({ ...newTerm, source: e.target.value })} placeholder="예: License Manual" /></div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-amber-500" />RAG 참고사항</Label>
              <Textarea value={newTerm.ragNote} onChange={e => setNewTerm({ ...newTerm, ragNote: e.target.value })} placeholder="AI가 이 용어를 해석할 때 참고할 사항..." className="min-h-16" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>취소</Button>
            <Button onClick={handleAddTerm} disabled={!newTerm.term.trim() || !newTerm.definition.trim()}>등록</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
