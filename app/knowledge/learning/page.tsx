"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Search, BookOpen, Tag, ChevronRight, ChevronDown, Factory,
  Info, Layers, Thermometer, Gauge, Droplet, Activity, Zap, Box
} from "lucide-react"
import { cn } from "@/lib/utils"

// --- Term Dictionary ---
interface Term {
  id: string; term: string; abbreviation?: string; definition: string
  category: string; unit?: string; relatedTerms?: string[]; source?: string
  ragNote?: string
}

const CATEGORIES = [
  { value: "all", label: "전체" },
  { value: "process", label: "공정 용어" },
  { value: "equipment", label: "장치/설비" },
  { value: "catalyst", label: "촉매" },
  { value: "parameter", label: "운전 변수" },
  { value: "kpi", label: "KPI/지표" },
  { value: "safety", label: "안전/환경" },
  { value: "abbreviation", label: "약어" },
]

const TERMS: Term[] = [
  { id: "T-001", term: "WABT", abbreviation: "WABT", definition: "Weighted Average Bed Temperature. 촉매층의 가중 평균 온도로, 촉매 활성도와 반응 진행 정도를 나타내는 핵심 지표.", category: "parameter", unit: "HCR", relatedTerms: ["EOR","SOR","Deactivation Rate"], source: "License Manual", ragNote: "WABT는 촉매 bed별 온도 데이터와 연계하여 해석" },
  { id: "T-002", term: "EOR", abbreviation: "EOR", definition: "End of Run. 촉매 수명의 마지막 시점. WABT가 설계 상한 온도에 도달한 상태.", category: "parameter", unit: "HCR", relatedTerms: ["WABT","SOR","TA"] },
  { id: "T-003", term: "SOR", abbreviation: "SOR", definition: "Start of Run. 신규 촉매 장입 후 초기 운전 시점.", category: "parameter", unit: "HCR", relatedTerms: ["EOR","WABT"] },
  { id: "T-004", term: "Fouling Factor", definition: "열교환기의 오염도를 나타내는 계수. U값의 감소로 측정.", category: "parameter", relatedTerms: ["U값","CIP"], ragNote: "Normalized 기준으로 평가해야 정확" },
  { id: "T-005", term: "U값", definition: "총괄열전달계수 (Overall Heat Transfer Coefficient). 열교환기 성능 지표.", category: "parameter", unit: "W/m2K", relatedTerms: ["Fouling Factor","LMTD"] },
  { id: "T-006", term: "IOW", abbreviation: "IOW", definition: "Integrity Operating Window. 설비 건전성 유지를 위한 운전 범위.", category: "safety", relatedTerms: ["Corrosion","Nelson Curve"] },
  { id: "T-007", term: "Nelson Curve", definition: "고온 수소 환경에서 재질의 수소 침식 한계를 나타내는 곡선.", category: "safety", unit: "HCR", relatedTerms: ["IOW","HTHA"] },
  { id: "T-008", term: "Severity", definition: "반응 공정의 운전 강도. 온도, 공간속도, 수소비 등의 복합 지표.", category: "parameter", relatedTerms: ["Conversion","WABT"] },
  { id: "T-009", term: "Cat/Oil Ratio", definition: "촉매 대 원료유 비율. FCC 공정에서 전환율을 결정하는 핵심 변수.", category: "parameter", unit: "FCC", relatedTerms: ["Riser Temperature","Conversion"] },
  { id: "T-010", term: "Deactivation Rate", definition: "촉매 활성도 감소 속도. WABT 상승률(deg/month)로 측정.", category: "catalyst", relatedTerms: ["WABT","EOR","SOR"] },
  { id: "T-011", term: "LHSV", abbreviation: "LHSV", definition: "Liquid Hourly Space Velocity. 시간당 촉매 부피 대비 액체 공급 부피.", category: "parameter", relatedTerms: ["Severity","Conversion"] },
  { id: "T-012", term: "Claus Process", definition: "H2S로부터 원소 황(S)을 회수하는 공정. Thermal + Catalytic 반응 조합.", category: "process", unit: "SRU", relatedTerms: ["Tail Gas","H2S/SO2 Ratio"] },
  { id: "T-013", term: "Desalter", definition: "원유 중 염분/수분을 제거하는 장치. CDU 전단에 위치.", category: "equipment", unit: "CDU", relatedTerms: ["Overhead Corrosion","Chloride"] },
  { id: "T-014", term: "TA", abbreviation: "TA", definition: "Turnaround. 정기 보수를 위한 계획 정지. 촉매 교체, 설비 정비 수행.", category: "abbreviation", relatedTerms: ["EOR","Worklist","Scope"] },
  { id: "T-015", term: "TOB", abbreviation: "TOB", definition: "Turn Over Book. 교대 근무 시 인수인계 기록부.", category: "abbreviation", relatedTerms: ["Shift Handover"] },
]

// --- Ontology Map ---
interface OntologyNode {
  id: string; name: string; type: "process" | "unit" | "equipment" | "tag"
  children?: OntologyNode[]; tagType?: string
}

const ONTOLOGY: OntologyNode[] = [
  { id: "CDU", name: "CDU (Crude Distillation Unit)", type: "process", children: [
    { id: "CDU-COL", name: "Atmospheric Column", type: "unit", children: [
      { id: "TI-1001", name: "TI-1001 Column Top Temp", type: "tag", tagType: "temperature" },
      { id: "TI-1002", name: "TI-1002 Column Bottom Temp", type: "tag", tagType: "temperature" },
      { id: "FI-1004", name: "FI-1004 Feed Flow", type: "tag", tagType: "flow" },
      { id: "FRC-1003", name: "FRC-1003 Reflux Ratio", type: "tag", tagType: "flow" },
      { id: "PI-1010", name: "PI-1010 Column Pressure", type: "tag", tagType: "pressure" },
    ]},
    { id: "CDU-DSL", name: "Desalter", type: "unit", children: [
      { id: "AI-1101", name: "AI-1101 Overhead pH", type: "tag", tagType: "analyzer" },
      { id: "AI-1102", name: "AI-1102 Chloride Content", type: "tag", tagType: "analyzer" },
      { id: "TI-1100", name: "TI-1100 Desalter Temp", type: "tag", tagType: "temperature" },
    ]},
    { id: "CDU-PHT", name: "Preheat Train", type: "unit", children: [
      { id: "TI-1201", name: "TI-1201 PHT Outlet Temp", type: "tag", tagType: "temperature" },
      { id: "PDI-1202", name: "PDI-1202 PHT dP", type: "tag", tagType: "dp" },
    ]},
  ]},
  { id: "HCR", name: "HCR (Hydrocracker)", type: "process", children: [
    { id: "HCR-RX", name: "Reactor Section", type: "unit", children: [
      { id: "TI-2101", name: "TI-2101 Reactor Inlet Temp", type: "tag", tagType: "temperature" },
      { id: "TI-2104", name: "TI-2104 WABT", type: "tag", tagType: "temperature" },
      { id: "PDI-2103", name: "PDI-2103 Reactor dP", type: "tag", tagType: "dp" },
      { id: "FRC-2102", name: "FRC-2102 H2/Oil Ratio", type: "tag", tagType: "flow" },
      { id: "FI-2105", name: "FI-2105 Quench Gas Flow", type: "tag", tagType: "flow" },
      { id: "TI-2201", name: "TI-2201 Reactor Wall Temp", type: "tag", tagType: "temperature" },
      { id: "PI-2202", name: "PI-2202 H2 Partial Pressure", type: "tag", tagType: "pressure" },
    ]},
    { id: "HCR-HEX", name: "Heat Exchanger Train", type: "unit", children: [
      { id: "TI-2931", name: "TI-2931 F-E102A U값 Index", type: "tag", tagType: "performance" },
      { id: "PDI-2001", name: "PDI-2001 Shell dP", type: "tag", tagType: "dp" },
      { id: "FI-2001", name: "FI-2001 Feed Flow", type: "tag", tagType: "flow" },
    ]},
  ]},
  { id: "FCC", name: "FCC (Fluid Catalytic Cracker)", type: "process", children: [
    { id: "FCC-RS", name: "Riser/Reactor", type: "unit", children: [
      { id: "TI-3001", name: "TI-3001 Riser Outlet Temp", type: "tag", tagType: "temperature" },
      { id: "CALC-3002", name: "CALC-3002 Cat/Oil Ratio", type: "tag", tagType: "performance" },
    ]},
    { id: "FCC-RG", name: "Regenerator", type: "unit", children: [
      { id: "TI-3003", name: "TI-3003 Regenerator Temp", type: "tag", tagType: "temperature" },
      { id: "PDI-3101", name: "PDI-3101 Cyclone dP", type: "tag", tagType: "dp" },
      { id: "AI-3102", name: "AI-3102 Stack Opacity", type: "tag", tagType: "analyzer" },
    ]},
  ]},
  { id: "VDU", name: "VDU (Vacuum Distillation)", type: "process", children: [
    { id: "VDU-COL", name: "Vacuum Column", type: "unit", children: [
      { id: "PI-4001", name: "PI-4001 Top Vacuum", type: "tag", tagType: "pressure" },
      { id: "TI-4002", name: "TI-4002 Flash Zone Temp", type: "tag", tagType: "temperature" },
      { id: "FI-4003", name: "FI-4003 Slop Wax Flow", type: "tag", tagType: "flow" },
    ]},
  ]},
  { id: "SRU", name: "SRU (Sulfur Recovery)", type: "process", children: [
    { id: "SRU-CL", name: "Claus Reactor", type: "unit", children: [
      { id: "TI-5001", name: "TI-5001 Reaction Furnace Temp", type: "tag", tagType: "temperature" },
      { id: "AI-5002", name: "AI-5002 H2S/SO2 Ratio", type: "tag", tagType: "analyzer" },
      { id: "AI-5003", name: "AI-5003 Tail Gas H2S", type: "tag", tagType: "analyzer" },
    ]},
  ]},
]

const tagTypeColors: Record<string, string> = {
  temperature: "bg-red-100 text-red-700",
  pressure: "bg-blue-100 text-blue-700",
  flow: "bg-emerald-100 text-emerald-700",
  dp: "bg-amber-100 text-amber-700",
  analyzer: "bg-purple-100 text-purple-700",
  performance: "bg-indigo-100 text-indigo-700",
}
const tagTypeLabels: Record<string, string> = {
  temperature: "온도", pressure: "압력", flow: "유량", dp: "차압", analyzer: "분석", performance: "성능",
}

function OntologyTree({ nodes, level = 0, searchTerm }: { nodes: OntologyNode[]; level?: number; searchTerm: string }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    nodes.forEach(n => { init[n.id] = true })
    return init
  })

  const filtered = nodes.filter(n => {
    if (!searchTerm) return true
    const s = searchTerm.toLowerCase()
    if (n.name.toLowerCase().includes(s) || n.id.toLowerCase().includes(s)) return true
    if (n.children?.some(c => c.name.toLowerCase().includes(s) || c.id.toLowerCase().includes(s) ||
      c.children?.some(cc => cc.name.toLowerCase().includes(s) || cc.id.toLowerCase().includes(s))
    )) return true
    return false
  })

  return (
    <div className={cn("space-y-1", level > 0 && "ml-5 pl-3 border-l border-muted")}>
      {filtered.map(node => {
        const hasChildren = node.children && node.children.length > 0
        const isExpanded = expanded[node.id]

        return (
          <div key={node.id}>
            <button
              type="button"
              className={cn(
                "flex items-center gap-2 w-full text-left p-1.5 rounded hover:bg-muted/50 transition-colors text-sm",
                node.type === "process" && "font-semibold",
                node.type === "tag" && "font-mono text-xs",
              )}
              onClick={() => hasChildren && setExpanded(p => ({ ...p, [node.id]: !p[node.id] }))}
            >
              {hasChildren ? (
                isExpanded ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              ) : <span className="w-3.5 shrink-0" />}

              {node.type === "process" && <Factory className="h-4 w-4 text-blue-600 shrink-0" />}
              {node.type === "unit" && <Box className="h-3.5 w-3.5 text-slate-500 shrink-0" />}
              {node.type === "tag" && node.tagType && (
                <Badge className={cn("text-[9px] h-4 px-1 border-0 shrink-0", tagTypeColors[node.tagType] || "bg-muted")}>
                  {tagTypeLabels[node.tagType] || node.tagType}
                </Badge>
              )}

              <span className="truncate">{node.name}</span>

              {hasChildren && (
                <span className="ml-auto text-[10px] text-muted-foreground shrink-0">{node.children!.length}</span>
              )}
            </button>
            {hasChildren && isExpanded && (
              <OntologyTree nodes={node.children!} level={level + 1} searchTerm={searchTerm} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function LearningPage() {
  const [activeTab, setActiveTab] = useState("dictionary")
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [selectedTerm, setSelectedTerm] = useState<Term | null>(null)
  const [ontologySearch, setOntologySearch] = useState("")

  const filteredTerms = TERMS.filter(t => {
    if (categoryFilter !== "all" && t.category !== categoryFilter) return false
    if (search && !t.term.toLowerCase().includes(search.toLowerCase()) && !t.definition.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">학습/용어</h1>
          <p className="text-sm text-muted-foreground mt-1">용어 사전, 태그/설비/공정 온톨로지 맵을 확인할 수 있습니다. 마스터 원장은 데이터/설정에서 관리됩니다.</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="dictionary">용어 사전 ({TERMS.length})</TabsTrigger>
            <TabsTrigger value="ontology">온톨로지 뷰 (공정/설비/태그 맵)</TabsTrigger>
          </TabsList>

          {/* Dictionary Tab */}
          <TabsContent value="dictionary" className="mt-4 space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="용어 검색..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {filteredTerms.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">검색 결과가 없습니다.</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredTerms.map(t => (
                <Card key={t.id} className="cursor-pointer hover:ring-1 hover:ring-primary/30 transition-all" onClick={() => setSelectedTerm(t)}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{t.term}</span>
                          {t.abbreviation && <Badge variant="outline" className="text-[10px] h-4">{t.abbreviation}</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{t.definition}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge variant="secondary" className="text-[10px] h-4">{CATEGORIES.find(c => c.value === t.category)?.label}</Badge>
                          {t.unit && <span className="text-[10px] text-muted-foreground">{t.unit}</span>}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Ontology Tab */}
          <TabsContent value="ontology" className="mt-4 space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="공정/설비/태그 검색..." value={ontologySearch} onChange={e => setOntologySearch(e.target.value)} className="pl-9 h-9" />
              </div>
              <div className="flex items-center gap-2 flex-wrap text-xs">
                {Object.entries(tagTypeLabels).map(([k, v]) => (
                  <Badge key={k} className={cn("text-[10px] border-0", tagTypeColors[k])}>{v}</Badge>
                ))}
              </div>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Factory className="h-4 w-4" />
                  공정 {'>'} 설비 {'>'} 태그 계층 구조
                  <span className="text-xs font-normal text-muted-foreground ml-2">(읽기 전용)</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <OntologyTree nodes={ONTOLOGY} searchTerm={ontologySearch} />
              </CardContent>
            </Card>

            <div className="p-3 rounded-lg bg-muted/50 border text-xs text-muted-foreground">
              태그/설비/공정 마스터 원장은 데이터/설정 메뉴에서 관리됩니다. 이 화면은 참조용 읽기 전용 뷰입니다.
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Term Detail Dialog */}
      <Dialog open={!!selectedTerm} onOpenChange={() => setSelectedTerm(null)}>
        <DialogContent className="max-w-lg">
          {selectedTerm && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  {selectedTerm.term}
                  {selectedTerm.abbreviation && <Badge variant="outline" className="text-xs">{selectedTerm.abbreviation}</Badge>}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary" className="text-[10px]">{CATEGORIES.find(c => c.value === selectedTerm.category)?.label}</Badge>
                  {selectedTerm.unit && <span>공정: {selectedTerm.unit}</span>}
                  {selectedTerm.source && <span>출처: {selectedTerm.source}</span>}
                </div>
                <p className="text-sm leading-relaxed">{selectedTerm.definition}</p>
                {selectedTerm.ragNote && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-100 text-xs text-amber-800">
                    <span className="font-semibold">RAG 참고:</span> {selectedTerm.ragNote}
                  </div>
                )}
                {selectedTerm.relatedTerms && selectedTerm.relatedTerms.length > 0 && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-semibold text-muted-foreground">관련 용어</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedTerm.relatedTerms.map(rt => (
                        <Badge key={rt} variant="outline" className="text-xs cursor-pointer hover:bg-muted"
                          onClick={() => {
                            const found = TERMS.find(t => t.term === rt || t.abbreviation === rt)
                            if (found) setSelectedTerm(found)
                          }}
                        >{rt}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
