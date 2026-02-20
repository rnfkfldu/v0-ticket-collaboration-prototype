"use client"

import React, { useState, useMemo, useCallback, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { AVAILABLE_TAGS, DCS_GRAPHICS } from "@/lib/process-data"
import { cn } from "@/lib/utils"
import {
  Plus, Search, ChevronRight, ChevronLeft, Upload, X, Trash2,
  Send, Link2, CheckCircle, Clock, AlertTriangle, Play,
  ArrowUpRight, ArrowDownRight, FileSpreadsheet, Monitor,
  LayoutGrid, Database, Cpu, Beaker, Eye, TrendingUp,
  BarChart3, CircleDot, ExternalLink, FlaskConical
} from "lucide-react"

// --- Types ---
type ModelStatus = "draft" | "data-ready" | "modeling" | "endpoint-registered" | "config-requested" | "configured" | "testing" | "production" | "dropped"

interface ModelEntry {
  id: string
  name: string
  purpose: string
  unit: string
  equipment: string
  description: string
  status: ModelStatus
  currentStep: number
  createdDate: string
  creator: string
  endpointUrl: string
  dataSource: "tag-grid" | "dcs-select" | "csv" | ""
  selectedTags: string[]
  trainingPeriod: { from: string; to: string }
  csvFiles: string[]
  accuracy: { rmse: number; mae: number; r2: number; mape: number } | null
  dropReason: string
}

// --- Constants ---
const STATUS_CONFIG: Record<ModelStatus, { label: string; color: string; icon: React.ElementType; step: number }> = {
  draft:               { label: "초안",          color: "bg-gray-100 text-gray-700",   icon: Clock,         step: 1 },
  "data-ready":        { label: "데이터 준비",   color: "bg-blue-100 text-blue-700",    icon: Database,      step: 2 },
  modeling:            { label: "외부 모델링 중", color: "bg-purple-100 text-purple-700", icon: Cpu,           step: 3 },
  "endpoint-registered": { label: "End Point 등록", color: "bg-indigo-100 text-indigo-700", icon: Link2,       step: 4 },
  "config-requested":  { label: "구성 요청 완료", color: "bg-orange-100 text-orange-700", icon: Send,          step: 5 },
  configured:          { label: "구성 완료",     color: "bg-teal-100 text-teal-700",    icon: CheckCircle,   step: 6 },
  testing:             { label: "운영 테스트",   color: "bg-cyan-100 text-cyan-700",    icon: Beaker,        step: 6 },
  production:          { label: "Production",    color: "bg-green-100 text-green-700",  icon: Play,          step: 7 },
  dropped:             { label: "Drop",          color: "bg-red-100 text-red-700",      icon: AlertTriangle, step: 0 },
}

const PIPELINE_STEPS = [
  { step: 1, label: "기본 정보" },
  { step: 2, label: "데이터 준비" },
  { step: 3, label: "외부 모델링" },
  { step: 4, label: "End Point 등록" },
  { step: 5, label: "구성 요청" },
  { step: 6, label: "운영 테스트" },
  { step: 7, label: "Production" },
]

const PURPOSE_OPTIONS = [
  "공정 최적화", "이상 감지", "품질 예측", "에너지 절감", "촉매 성능 예측", "수율 예측", "기타"
]

const UNITS = ["CDU", "VDU", "HCR", "CCR", "DHT", "NHT", "Utilities"]

// --- Mock data ---
const INITIAL_MODELS: ModelEntry[] = [
  {
    id: "MDL-001", name: "HCR Reactor Outlet Temp 예측 모델", purpose: "공정 최적화",
    unit: "HCR", equipment: "R-3001", description: "HCR Reactor Outlet Temperature를 Feed 조건과 운전 변수 기반으로 예측",
    status: "testing", currentStep: 6, createdDate: "2025-12-15", creator: "김지수",
    endpointUrl: "https://runtime.sagemaker.ap-northeast-2.amazonaws.com/endpoints/hcr-reactor-temp-v2",
    dataSource: "dcs-select", selectedTags: ["TI-3001", "TI-3002", "PI-3001", "FI-3001", "FI-3002"],
    trainingPeriod: { from: "2024-01-01", to: "2025-06-30" }, csvFiles: [],
    accuracy: { rmse: 2.34, mae: 1.87, r2: 0.94, mape: 1.2 }, dropReason: "",
  },
  {
    id: "MDL-002", name: "CCR Catalyst Deactivation Rate 예측", purpose: "촉매 성능 예측",
    unit: "CCR", equipment: "Reactor Train", description: "CCR 촉매 비활성화율 예측을 통한 촉매 교체 주기 최적화",
    status: "configured", currentStep: 6, createdDate: "2025-11-20", creator: "박영호",
    endpointUrl: "https://runtime.sagemaker.ap-northeast-2.amazonaws.com/endpoints/ccr-catalyst-v1",
    dataSource: "tag-grid", selectedTags: ["TI-4001", "TI-4002", "PI-4001", "FI-4001"],
    trainingPeriod: { from: "2024-03-01", to: "2025-09-30" }, csvFiles: [],
    accuracy: { rmse: 0.05, mae: 0.03, r2: 0.91, mape: 3.8 }, dropReason: "",
  },
  {
    id: "MDL-003", name: "VDU HVGO Yield 예측", purpose: "수율 예측",
    unit: "VDU", equipment: "Vacuum Column", description: "VDU HVGO 수율을 Feed 특성 및 운전 조건 기반 예측",
    status: "modeling", currentStep: 3, createdDate: "2026-01-10", creator: "이수진",
    endpointUrl: "", dataSource: "csv", selectedTags: [],
    trainingPeriod: { from: "2024-06-01", to: "2025-12-31" }, csvFiles: ["vdu_feed_data_2024.csv", "vdu_product_data_2024.csv"],
    accuracy: null, dropReason: "",
  },
  {
    id: "MDL-004", name: "CDU Energy Consumption 예측", purpose: "에너지 절감",
    unit: "CDU", equipment: "Furnace F-1001", description: "CDU Furnace 에너지 소비 예측을 통한 에너지 절감 기회 발굴",
    status: "draft", currentStep: 1, createdDate: "2026-02-05", creator: "김지수",
    endpointUrl: "", dataSource: "", selectedTags: [],
    trainingPeriod: { from: "", to: "" }, csvFiles: [],
    accuracy: null, dropReason: "",
  },
  {
    id: "MDL-005", name: "DHT Desulfurization Efficiency 예측", purpose: "품질 예측",
    unit: "DHT", equipment: "R-5001", description: "DHT 탈황효율 예측 모델 - 정확도 부족으로 Drop",
    status: "dropped", currentStep: 0, createdDate: "2025-08-01", creator: "이수진",
    endpointUrl: "https://runtime.sagemaker.ap-northeast-2.amazonaws.com/endpoints/dht-desulf-v1",
    dataSource: "tag-grid", selectedTags: ["TI-5001", "PI-5001", "FI-5001"],
    trainingPeriod: { from: "2024-01-01", to: "2025-03-31" }, csvFiles: [],
    accuracy: { rmse: 5.12, mae: 4.01, r2: 0.72, mape: 8.5 }, dropReason: "MAPE 8.5%로 목표 정확도(3% 이하) 미달. Feed 품질 변동성이 커 모델 재설계 필요",
  },
]

// --- Helper: generate mock prediction vs actual data ---
function generateValidationData(model: ModelEntry) {
  const seed = model.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
  const rand = (s: number) => ((Math.sin(s) * 10000) % 1 + 1) % 1
  const base = model.unit === "HCR" ? 420 : model.unit === "CCR" ? 0.85 : model.unit === "VDU" ? 67 : 350
  const scale = model.unit === "CCR" ? 0.15 : model.unit === "VDU" ? 8 : 30
  const unitLabel = model.unit === "CCR" ? "Activity Index" : model.unit === "VDU" ? "Yield %" : "deg.C"
  return Array.from({ length: 30 }, (_, i) => {
    const actual = base + (rand(seed + i * 7) - 0.5) * scale
    const noise = (rand(seed + i * 13) - 0.5) * scale * (model.accuracy ? (1 - model.accuracy.r2) * 3 : 0.5)
    return {
      day: `D-${30 - i}`,
      actual: +actual.toFixed(2),
      predicted: +(actual + noise).toFixed(2),
      deviation: +noise.toFixed(2),
    }
  })
}

export default function ModelLabPage() {
  const searchParams = useSearchParams()
  const [workspace, setWorkspace] = useState<"build" | "validate">(
    searchParams.get("tab") === "validate" ? "validate" : "build"
  )

  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab === "validate") setWorkspace("validate")
  }, [searchParams])
  const [models, setModels] = useState<ModelEntry[]>(INITIAL_MODELS)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedModel, setSelectedModel] = useState<ModelEntry | null>(null)
  const [showModelDetail, setShowModelDetail] = useState(false)
  const [showConfigRequest, setShowConfigRequest] = useState(false)
  const [showDropDialog, setShowDropDialog] = useState(false)
  const [dropReason, setDropReason] = useState("")
  const [validationPeriod, setValidationPeriod] = useState("30d")

  // --- New model form ---
  const [newModel, setNewModel] = useState({
    name: "", purpose: "", unit: "HCR", equipment: "", description: "",
  })

  // --- Data selection state ---
  const [dataTab, setDataTab] = useState<"tag-grid" | "dcs-select" | "csv">("tag-grid")
  const [tagGridRows, setTagGridRows] = useState<{ tag: string; from: string; to: string }[]>([{ tag: "", from: "", to: "" }])
  const [dcsUnit, setDcsUnit] = useState("HCR")
  const [dcsGraphic, setDcsGraphic] = useState("")
  const [dcsSelectedTags, setDcsSelectedTags] = useState<string[]>([])
  const [dcsPeriod, setDcsPeriod] = useState({ from: "", to: "" })
  const [csvFiles, setCsvFiles] = useState<{ name: string; rows: number }[]>([])

  // --- Filter logic ---
  const buildModels = useMemo(() => models.filter(m => m.status !== "dropped" || statusFilter === "dropped"), [models, statusFilter])
  const validateModels = useMemo(() => models.filter(m =>
    ["configured", "testing", "production", "dropped"].includes(m.status)
  ), [models])

  const filteredBuildModels = useMemo(() => {
    return buildModels.filter(m => {
      const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.unit.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === "all" || m.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [buildModels, search, statusFilter])

  // --- Handlers ---
  const handleCreateModel = useCallback(() => {
    const id = `MDL-${String(models.length + 1).padStart(3, "0")}`
    const entry: ModelEntry = {
      id, ...newModel, status: "draft", currentStep: 1,
      createdDate: new Date().toISOString().split("T")[0], creator: "김철수",
      endpointUrl: "", dataSource: "", selectedTags: [],
      trainingPeriod: { from: "", to: "" }, csvFiles: [], accuracy: null, dropReason: "",
    }
    setModels(prev => [entry, ...prev])
    setShowCreateDialog(false)
    setNewModel({ name: "", purpose: "", unit: "HCR", equipment: "", description: "" })
  }, [newModel, models.length])

  const advanceStep = useCallback((modelId: string, nextStatus: ModelStatus, updates?: Partial<ModelEntry>) => {
    setModels(prev => prev.map(m => m.id === modelId ? {
      ...m, status: nextStatus, currentStep: STATUS_CONFIG[nextStatus].step, ...updates,
    } : m))
    if (selectedModel?.id === modelId) {
      setSelectedModel(prev => prev ? { ...prev, status: nextStatus, currentStep: STATUS_CONFIG[nextStatus].step, ...updates } : null)
    }
  }, [selectedModel])

  const handleDrop = useCallback(() => {
    if (!selectedModel || !dropReason.trim()) return
    advanceStep(selectedModel.id, "dropped", { dropReason: dropReason.trim() })
    setShowDropDialog(false)
    setDropReason("")
  }, [selectedModel, dropReason, advanceStep])

  // --- Counts ---
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: models.length }
    models.forEach(m => { counts[m.status] = (counts[m.status] || 0) + 1 })
    return counts
  }, [models])

  // --- Tag autocomplete ---
  const allTags = useMemo(() => Object.values(AVAILABLE_TAGS).flat(), [])

  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-primary" />
                모델 실험실
              </h1>
              <p className="text-sm text-muted-foreground mt-1">AI 모델 구축부터 운영 검증까지의 전체 파이프라인을 관리합니다</p>
            </div>
          </div>
          {/* Workspace Tabs */}
          <div className="px-6">
            <div className="flex gap-1">
              {[
                { id: "build" as const, label: "모델 구축", icon: Cpu, count: buildModels.length },
                { id: "validate" as const, label: "운영 검증", icon: Eye, count: validateModels.length },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setWorkspace(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer",
                    workspace === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                  <Badge variant="secondary" className="text-xs ml-1">{tab.count}</Badge>
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* ========== WORKSPACE 1: 모델 구축 ========== */}
        {workspace === "build" && (
          <main className="p-6 space-y-6">
            {/* Toolbar */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="모델명 또는 공정으로 검색..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {(["all", "draft", "data-ready", "modeling", "endpoint-registered", "config-requested", "configured", "testing", "production", "dropped"] as const).map(s => (
                  <Button
                    key={s}
                    variant={statusFilter === s ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter(s)}
                    className={cn("text-xs", statusFilter !== s && "bg-transparent")}
                  >
                    {s === "all" ? "전체" : STATUS_CONFIG[s].label}
                    {statusCounts[s] ? ` (${s === "all" ? statusCounts.all : statusCounts[s]})` : ""}
                  </Button>
                ))}
              </div>
              <Button className="gap-2 ml-auto shrink-0" onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4" />
                새 모델
              </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {PIPELINE_STEPS.map(ps => {
                const count = models.filter(m => m.currentStep === ps.step && m.status !== "dropped").length
                return (
                  <Card key={ps.step} className="relative overflow-hidden">
                    <CardContent className="py-3 px-4">
                      <div className="text-lg font-bold">{count}</div>
                      <p className="text-xs text-muted-foreground truncate">{ps.label}</p>
                    </CardContent>
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary/20">
                      <div className="h-full bg-primary transition-all" style={{ width: `${(ps.step / 7) * 100}%` }} />
                    </div>
                  </Card>
                )
              })}
            </div>

            {/* Model List */}
            <div className="space-y-3">
              {filteredBuildModels.length === 0 && (
                <Card className="py-12">
                  <CardContent className="flex flex-col items-center gap-3 text-center">
                    <FlaskConical className="h-10 w-10 text-muted-foreground/40" />
                    <p className="text-muted-foreground">해당 조건의 모델이 없습니다</p>
                    <Button variant="outline" size="sm" onClick={() => setShowCreateDialog(true)} className="gap-1.5 bg-transparent">
                      <Plus className="h-3.5 w-3.5" />
                      새 모델 만들기
                    </Button>
                  </CardContent>
                </Card>
              )}
              {filteredBuildModels.map(model => {
                const cfg = STATUS_CONFIG[model.status]
                const Icon = cfg.icon
                return (
                  <Card
                    key={model.id}
                    className={cn(
                      "hover:border-primary/30 transition-colors cursor-pointer",
                      model.status === "dropped" && "opacity-60"
                    )}
                    onClick={() => { setSelectedModel(model); setShowModelDetail(true) }}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-center gap-4">
                        {/* Step indicator */}
                        <div className="flex flex-col items-center gap-1 w-12 shrink-0">
                          <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold",
                            model.status === "dropped" ? "bg-red-100 text-red-600" :
                            model.status === "production" ? "bg-green-100 text-green-600" : "bg-primary/10 text-primary"
                          )}>
                            {model.status === "dropped" ? "X" : model.status === "production" ? "P" : model.currentStep}
                          </div>
                          <span className="text-[10px] text-muted-foreground text-center leading-tight">{cfg.label}</span>
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-medium truncate">{model.name}</h3>
                            <Badge variant="outline" className={cn("text-xs shrink-0", cfg.color)}>
                              <Icon className="h-3 w-3 mr-1" />{cfg.label}
                            </Badge>
                            <Badge variant="secondary" className="text-xs shrink-0">{model.unit}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{model.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>{model.purpose}</span>
                            <span>{model.equipment}</span>
                            <span>{model.creator}</span>
                            <span>{model.createdDate}</span>
                            {model.accuracy && (
                              <span className={cn("font-medium", model.accuracy.r2 >= 0.9 ? "text-green-600" : model.accuracy.r2 >= 0.8 ? "text-orange-600" : "text-red-600")}>
                                R2: {model.accuracy.r2}
                              </span>
                            )}
                          </div>
                        </div>
                        {/* Step progress bar */}
                        <div className="hidden lg:flex items-center gap-0.5 shrink-0">
                          {PIPELINE_STEPS.map(ps => (
                            <div
                              key={ps.step}
                              className={cn("w-6 h-1.5 rounded-full transition-colors",
                                model.status === "dropped" ? "bg-red-200" :
                                ps.step < model.currentStep ? "bg-primary" :
                                ps.step === model.currentStep ? "bg-primary/60" : "bg-muted"
                              )}
                              title={ps.label}
                            />
                          ))}
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </main>
        )}

        {/* ========== WORKSPACE 2: 운영 검증 ========== */}
        {workspace === "validate" && (
          <main className="p-6 space-y-6">
            {/* Model selector + period */}
            <div className="flex items-center gap-4 flex-wrap">
              <Select
                value={selectedModel?.id || ""}
                onValueChange={v => setSelectedModel(validateModels.find(m => m.id === v) || null)}
              >
                <SelectTrigger className="w-80">
                  <SelectValue placeholder="검증할 모델을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {validateModels.map(m => (
                    <SelectItem key={m.id} value={m.id}>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn("text-[10px] px-1", STATUS_CONFIG[m.status].color)}>
                          {STATUS_CONFIG[m.status].label}
                        </Badge>
                        {m.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-1.5">
                {[
                  { id: "7d", label: "7일" }, { id: "30d", label: "30일" }, { id: "90d", label: "90일" },
                ].map(p => (
                  <Button key={p.id} variant={validationPeriod === p.id ? "default" : "outline"} size="sm"
                    onClick={() => setValidationPeriod(p.id)} className={validationPeriod !== p.id ? "bg-transparent" : ""}>
                    {p.label}
                  </Button>
                ))}
              </div>
              {selectedModel && selectedModel.status !== "dropped" && selectedModel.status !== "production" && (
                <div className="ml-auto flex gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 bg-transparent"
                    onClick={() => setShowDropDialog(true)}>
                    <X className="h-3.5 w-3.5" />Drop
                  </Button>
                  <Button size="sm" className="gap-1.5"
                    onClick={() => { if (selectedModel) advanceStep(selectedModel.id, "production") }}>
                    <ArrowUpRight className="h-3.5 w-3.5" />Production 승격
                  </Button>
                </div>
              )}
            </div>

            {!selectedModel ? (
              <Card className="py-16"><CardContent className="flex flex-col items-center gap-3 text-center">
                <Eye className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-muted-foreground">검증할 모델을 선택하세요</p>
                <p className="text-xs text-muted-foreground">구성 완료 이상 단계의 모델만 검증이 가능합니다</p>
              </CardContent></Card>
            ) : (() => {
              const data = generateValidationData(selectedModel)
              const sliceLen = validationPeriod === "7d" ? 7 : validationPeriod === "90d" ? 30 : 30
              const sliced = data.slice(0, sliceLen)
              const acc = selectedModel.accuracy
              const W = 700, H = 220, pad = { t: 20, b: 30, l: 50, r: 20 }
              const cw = W - pad.l - pad.r, ch = H - pad.t - pad.b
              const allVals = sliced.flatMap(d => [d.actual, d.predicted])
              const maxV = Math.max(...allVals) * 1.02, minV = Math.min(...allVals) * 0.98
              const range = maxV - minV || 1
              const toX = (i: number) => pad.l + (i / (sliced.length - 1)) * cw
              const toY = (v: number) => pad.t + (1 - (v - minV) / range) * ch
              const makePath = (vals: number[]) => vals.reduce((acc, v, i) => {
                const x = toX(i), y = toY(v)
                return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`
              }, "")
              const actualPath = makePath(sliced.map(d => d.actual))
              const predPath = makePath(sliced.map(d => d.predicted))

              return (
                <div className="space-y-6">
                  {/* Model info banner */}
                  <Card className="border-l-4 border-l-primary">
                    <CardContent className="py-3 flex items-center gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium">{selectedModel.name}</h3>
                        <p className="text-sm text-muted-foreground">{selectedModel.unit} / {selectedModel.equipment} / {selectedModel.purpose}</p>
                      </div>
                      <Badge variant="outline" className={cn("shrink-0", STATUS_CONFIG[selectedModel.status].color)}>
                        {STATUS_CONFIG[selectedModel.status].label}
                      </Badge>
                      {selectedModel.status === "dropped" && (
                        <div className="w-full mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                          Drop 사유: {selectedModel.dropReason}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* KPI Cards */}
                  {acc && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: "RMSE", value: acc.rmse, unit: "", good: acc.rmse < 3, desc: "Root Mean Square Error" },
                        { label: "MAE", value: acc.mae, unit: "", good: acc.mae < 2, desc: "Mean Absolute Error" },
                        { label: "R\u00B2", value: acc.r2, unit: "", good: acc.r2 >= 0.9, desc: "Coefficient of Determination" },
                        { label: "MAPE", value: acc.mape, unit: "%", good: acc.mape < 3, desc: "Mean Absolute % Error" },
                      ].map(kpi => (
                        <Card key={kpi.label}>
                          <CardContent className="py-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">{kpi.label}</span>
                              {kpi.good ? (
                                <Badge className="text-[10px] bg-green-100 text-green-700 hover:bg-green-100">양호</Badge>
                              ) : (
                                <Badge className="text-[10px] bg-orange-100 text-orange-700 hover:bg-orange-100">주의</Badge>
                              )}
                            </div>
                            <div className="text-2xl font-bold mt-1">{kpi.value}{kpi.unit}</div>
                            <p className="text-xs text-muted-foreground mt-0.5">{kpi.desc}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Prediction vs Actual chart */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          예측값 vs 실측값 비교
                        </div>
                        <div className="flex items-center gap-4 text-xs font-normal text-muted-foreground">
                          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-emerald-500 inline-block rounded" />실측값</span>
                          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-blue-500 inline-block rounded" />예측값</span>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-56" preserveAspectRatio="xMidYMid meet">
                        {/* Grid */}
                        {[0, 0.25, 0.5, 0.75, 1].map(frac => {
                          const y = pad.t + frac * ch
                          const val = maxV - frac * range
                          return (
                            <g key={frac}>
                              <line x1={pad.l} y1={y} x2={W - pad.r} y2={y} stroke="currentColor" strokeOpacity={0.06} />
                              <text x={pad.l - 6} y={y + 3} fontSize="9" fill="currentColor" fillOpacity={0.4} textAnchor="end">{val.toFixed(1)}</text>
                            </g>
                          )
                        })}
                        {/* X labels */}
                        {sliced.filter((_, i) => i % Math.max(1, Math.floor(sliced.length / 6)) === 0).map((d, i, arr) => {
                          const idx = sliced.indexOf(d)
                          return <text key={d.day} x={toX(idx)} y={H - 5} fontSize="8" fill="currentColor" fillOpacity={0.4} textAnchor="middle">{d.day}</text>
                        })}
                        {/* Area between */}
                        <path d={`${actualPath} ${makePath(sliced.map(d => d.predicted).reverse()).replace("M", "L")} Z`} fill="currentColor" opacity="0.03" />
                        {/* Lines */}
                        <path d={actualPath} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
                        <path d={predPath} fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="6 3" strokeLinecap="round" />
                        {/* Points */}
                        {sliced.map((d, i) => (
                          <g key={i}>
                            <circle cx={toX(i)} cy={toY(d.actual)} r={2} fill="#10b981" />
                            <circle cx={toX(i)} cy={toY(d.predicted)} r={2} fill="#3b82f6" />
                          </g>
                        ))}
                      </svg>
                    </CardContent>
                  </Card>

                  {/* Deviation histogram */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        예측 편차 분포
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-end gap-1 h-32 justify-center">
                        {(() => {
                          const devs = sliced.map(d => d.deviation)
                          const absMax = Math.max(...devs.map(Math.abs), 1)
                          const bins = 10
                          const binW = (absMax * 2) / bins
                          const binCounts = Array(bins).fill(0)
                          devs.forEach(d => {
                            const idx = Math.min(bins - 1, Math.max(0, Math.floor((d + absMax) / binW)))
                            binCounts[idx]++
                          })
                          const maxCount = Math.max(...binCounts, 1)
                          return binCounts.map((c, i) => {
                            const center = -absMax + (i + 0.5) * binW
                            const isCenter = Math.abs(center) < binW
                            return (
                              <div key={i} className="flex flex-col items-center gap-1" style={{ width: `${100 / bins}%` }}>
                                <div
                                  className={cn("w-full rounded-t transition-all", isCenter ? "bg-green-400" : Math.abs(center) > absMax * 0.6 ? "bg-red-300" : "bg-blue-300")}
                                  style={{ height: `${(c / maxCount) * 100}%`, minHeight: c > 0 ? 4 : 0 }}
                                />
                                <span className="text-[8px] text-muted-foreground">{center.toFixed(1)}</span>
                              </div>
                            )
                          })
                        })()}
                      </div>
                      <p className="text-xs text-muted-foreground text-center mt-2">편차 = 예측값 - 실측값 (0에 가까울수록 정확)</p>
                    </CardContent>
                  </Card>
                </div>
              )
            })()}
          </main>
        )}

        {/* ========== DIALOGS ========== */}

        {/* 새 모델 생성 */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Plus className="h-5 w-5" />새 모델 생성</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label className="flex items-center gap-1"><span className="text-destructive">*</span>모델명</Label>
                  <Input placeholder="예: HCR Reactor Outlet Temp 예측 모델" value={newModel.name} onChange={e => setNewModel({ ...newModel, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><span className="text-destructive">*</span>예측 목적</Label>
                  <Select value={newModel.purpose} onValueChange={v => setNewModel({ ...newModel, purpose: v })}>
                    <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                    <SelectContent>{PURPOSE_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><span className="text-destructive">*</span>관련 공정</Label>
                  <Select value={newModel.unit} onValueChange={v => setNewModel({ ...newModel, unit: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>대상 설비</Label>
                  <Input placeholder="예: R-3001, Furnace F-1001" value={newModel.equipment} onChange={e => setNewModel({ ...newModel, equipment: e.target.value })} />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>설명</Label>
                  <Textarea placeholder="모델에 대한 설명을 입력하세요..." value={newModel.description} onChange={e => setNewModel({ ...newModel, description: e.target.value })} rows={3} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>취소</Button>
              <Button onClick={handleCreateModel} disabled={!newModel.name.trim() || !newModel.purpose}>생성</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 모델 상세 / 파이프라인 관리 */}
        <Dialog open={showModelDetail} onOpenChange={v => { setShowModelDetail(v); if (!v) setSelectedModel(null) }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {selectedModel && (() => {
              const m = selectedModel
              const cfg = STATUS_CONFIG[m.status]
              return (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <FlaskConical className="h-5 w-5 text-primary" />
                      {m.name}
                      <Badge variant="outline" className={cn("text-xs ml-2", cfg.color)}>{cfg.label}</Badge>
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground">{m.unit} / {m.equipment} / {m.purpose}</p>
                  </DialogHeader>

                  {/* Pipeline progress */}
                  <div className="flex items-center gap-1 py-3">
                    {PIPELINE_STEPS.map((ps, i) => {
                      const isDone = m.status !== "dropped" && ps.step < m.currentStep
                      const isCurrent = m.status !== "dropped" && ps.step === m.currentStep
                      return (
                        <React.Fragment key={ps.step}>
                          <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors",
                            isDone ? "bg-primary/10 text-primary" :
                            isCurrent ? "bg-primary text-primary-foreground" :
                            "bg-muted text-muted-foreground"
                          )}>
                            {isDone ? <CheckCircle className="h-3 w-3" /> : <span className="w-4 text-center">{ps.step}</span>}
                            <span className="hidden md:inline">{ps.label}</span>
                          </div>
                          {i < PIPELINE_STEPS.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />}
                        </React.Fragment>
                      )
                    })}
                  </div>

                  <ScrollArea className="flex-1 -mx-6 px-6">
                    <div className="space-y-6 pb-4">
                      {/* Step 1 - 기본 정보 */}
                      <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm">Step 1. 기본 정보</CardTitle></CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div><span className="text-muted-foreground">모델명:</span> <span className="font-medium">{m.name}</span></div>
                            <div><span className="text-muted-foreground">예측 목적:</span> <span className="font-medium">{m.purpose}</span></div>
                            <div><span className="text-muted-foreground">관련 공정:</span> <span className="font-medium">{m.unit}</span></div>
                            <div><span className="text-muted-foreground">대상 설비:</span> <span className="font-medium">{m.equipment || "-"}</span></div>
                            <div className="col-span-2"><span className="text-muted-foreground">설명:</span> <span className="font-medium">{m.description || "-"}</span></div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Step 2 - 데이터 준비 */}
                      <Card className={cn(m.currentStep < 2 && "opacity-50")}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center justify-between">
                            Step 2. 데이터 선정
                            {m.status === "draft" && (
                              <Badge variant="outline" className="text-xs">작업 필요</Badge>
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {m.dataSource ? (
                            <div className="space-y-2">
                              <Badge variant="secondary" className="text-xs">
                                {m.dataSource === "tag-grid" ? "태그 그리드" : m.dataSource === "dcs-select" ? "DCS 화면 선택" : "CSV 업로드"}
                              </Badge>
                              {m.selectedTags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  {m.selectedTags.map(t => <Badge key={t} variant="outline" className="text-xs font-mono">{t}</Badge>)}
                                </div>
                              )}
                              {m.trainingPeriod.from && (
                                <p className="text-xs text-muted-foreground mt-1">학습 기간: {m.trainingPeriod.from} ~ {m.trainingPeriod.to}</p>
                              )}
                              {m.csvFiles.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {m.csvFiles.map(f => (
                                    <div key={f} className="flex items-center gap-2 text-xs"><FileSpreadsheet className="h-3 w-3" />{f}</div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : m.status === "draft" ? (
                            /* Data selection UI for draft models */
                            <Tabs value={dataTab} onValueChange={v => setDataTab(v as typeof dataTab)} className="mt-2">
                              <TabsList className="w-full">
                                <TabsTrigger value="tag-grid" className="flex-1 gap-1.5 text-xs"><LayoutGrid className="h-3 w-3" />태그 그리드</TabsTrigger>
                                <TabsTrigger value="dcs-select" className="flex-1 gap-1.5 text-xs"><Monitor className="h-3 w-3" />DCS 화면 선택</TabsTrigger>
                                <TabsTrigger value="csv" className="flex-1 gap-1.5 text-xs"><Upload className="h-3 w-3" />CSV 업로드</TabsTrigger>
                              </TabsList>

                              {/* Option 1: Tag Grid */}
                              <TabsContent value="tag-grid" className="space-y-3 mt-3">
                                <div className="border rounded-lg overflow-hidden">
                                  <div className="grid grid-cols-[1fr_140px_140px_40px] gap-0 bg-muted/50 text-xs font-medium px-3 py-2 border-b">
                                    <span>태그명</span><span>시작일</span><span>종료일</span><span />
                                  </div>
                                  {tagGridRows.map((row, i) => (
                                    <div key={i} className="grid grid-cols-[1fr_140px_140px_40px] gap-2 px-3 py-1.5 border-b last:border-0 items-center">
                                      <Input
                                        placeholder="태그 입력 (예: TI-3001)"
                                        value={row.tag} className="h-8 text-xs font-mono"
                                        onChange={e => setTagGridRows(prev => prev.map((r, j) => j === i ? { ...r, tag: e.target.value } : r))}
                                        list="tag-suggestions"
                                      />
                                      <Input type="date" value={row.from} className="h-8 text-xs"
                                        onChange={e => setTagGridRows(prev => prev.map((r, j) => j === i ? { ...r, from: e.target.value } : r))} />
                                      <Input type="date" value={row.to} className="h-8 text-xs"
                                        onChange={e => setTagGridRows(prev => prev.map((r, j) => j === i ? { ...r, to: e.target.value } : r))} />
                                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0"
                                        onClick={() => tagGridRows.length > 1 && setTagGridRows(prev => prev.filter((_, j) => j !== i))}>
                                        <X className="h-3 w-3 text-muted-foreground" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                                <datalist id="tag-suggestions">{allTags.map(t => <option key={t} value={t} />)}</datalist>
                                <Button variant="outline" size="sm" className="gap-1 text-xs bg-transparent" onClick={() => setTagGridRows(prev => [...prev, { tag: "", from: "", to: "" }])}>
                                  <Plus className="h-3 w-3" />행 추가
                                </Button>
                                <Button size="sm" className="ml-2 text-xs" onClick={() => {
                                  const tags = tagGridRows.filter(r => r.tag.trim()).map(r => r.tag.trim())
                                  const from = tagGridRows.find(r => r.from)?.from || ""
                                  const to = tagGridRows.find(r => r.to)?.to || ""
                                  if (tags.length > 0) {
                                    advanceStep(m.id, "data-ready", { dataSource: "tag-grid", selectedTags: tags, trainingPeriod: { from, to } })
                                  }
                                }}>데이터 확정</Button>
                              </TabsContent>

                              {/* Option 2: DCS Screen Select */}
                              <TabsContent value="dcs-select" className="space-y-3 mt-3">
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1.5">
                                    <Label className="text-xs">공정 선택</Label>
                                    <Select value={dcsUnit} onValueChange={v => { setDcsUnit(v); setDcsGraphic(""); setDcsSelectedTags([]) }}>
                                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                      <SelectContent>{UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-1.5">
                                    <Label className="text-xs">DCS 화면</Label>
                                    <Select value={dcsGraphic} onValueChange={setDcsGraphic}>
                                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="선택" /></SelectTrigger>
                                      <SelectContent>
                                        {(DCS_GRAPHICS[dcsUnit] || []).map(g => (
                                          <SelectItem key={g.number} value={g.number}>{g.number} - {g.name}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                {dcsGraphic && (
                                  <>
                                    <div className="space-y-2">
                                      <Label className="text-xs">태그 선택 (다중 선택 가능)</Label>
                                      <div className="grid grid-cols-2 gap-1.5 p-3 border rounded-lg bg-muted/30 max-h-40 overflow-y-auto">
                                        {(AVAILABLE_TAGS[dcsUnit] || []).map(tag => (
                                          <label key={tag} className="flex items-center gap-2 text-xs cursor-pointer p-1 rounded hover:bg-muted/50">
                                            <Checkbox
                                              checked={dcsSelectedTags.includes(tag)}
                                              onCheckedChange={checked => {
                                                setDcsSelectedTags(prev => checked ? [...prev, tag] : prev.filter(t => t !== tag))
                                              }}
                                            />
                                            <span className="font-mono">{tag}</span>
                                          </label>
                                        ))}
                                      </div>
                                    </div>
                                    {dcsSelectedTags.length > 0 && (
                                      <div className="space-y-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
                                        <Label className="text-xs font-medium">태그 덱 ({dcsSelectedTags.length}개 선택)</Label>
                                        <div className="flex flex-wrap gap-1">
                                          {dcsSelectedTags.map(t => (
                                            <Badge key={t} variant="secondary" className="text-xs font-mono gap-1">
                                              {t}
                                              <button onClick={() => setDcsSelectedTags(prev => prev.filter(x => x !== t))} className="ml-0.5 hover:bg-muted rounded-full"><X className="h-2.5 w-2.5" /></button>
                                            </Badge>
                                          ))}
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                          <div className="space-y-1">
                                            <Label className="text-[10px]">학습 시작일</Label>
                                            <Input type="date" className="h-8 text-xs" value={dcsPeriod.from} onChange={e => setDcsPeriod(p => ({ ...p, from: e.target.value }))} />
                                          </div>
                                          <div className="space-y-1">
                                            <Label className="text-[10px]">학습 종료일</Label>
                                            <Input type="date" className="h-8 text-xs" value={dcsPeriod.to} onChange={e => setDcsPeriod(p => ({ ...p, to: e.target.value }))} />
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                    <Button size="sm" className="text-xs" disabled={dcsSelectedTags.length === 0} onClick={() => {
                                      advanceStep(m.id, "data-ready", { dataSource: "dcs-select", selectedTags: dcsSelectedTags, trainingPeriod: dcsPeriod })
                                    }}>데이터 확정</Button>
                                  </>
                                )}
                              </TabsContent>

                              {/* Option 3: CSV Upload */}
                              <TabsContent value="csv" className="space-y-3 mt-3">
                                <div
                                  className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                                  onClick={() => {
                                    const fakeFile = `upload_${Date.now().toString(36)}.csv`
                                    setCsvFiles(prev => [...prev, { name: fakeFile, rows: Math.floor(Math.random() * 5000) + 500 }])
                                  }}
                                >
                                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                  <p className="text-sm text-muted-foreground">클릭하여 CSV 파일을 업로드하세요</p>
                                  <p className="text-xs text-muted-foreground mt-1">또는 파일을 여기에 드래그앤드롭</p>
                                </div>
                                {csvFiles.length > 0 && (
                                  <div className="space-y-2">
                                    {csvFiles.map((f, i) => (
                                      <div key={i} className="flex items-center justify-between p-2 border rounded bg-muted/30">
                                        <div className="flex items-center gap-2 text-xs">
                                          <FileSpreadsheet className="h-4 w-4 text-green-600" />
                                          <span className="font-mono">{f.name}</span>
                                          <Badge variant="secondary" className="text-[10px]">{f.rows.toLocaleString()} rows</Badge>
                                        </div>
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setCsvFiles(prev => prev.filter((_, j) => j !== i))}>
                                          <Trash2 className="h-3 w-3 text-destructive" />
                                        </Button>
                                      </div>
                                    ))}
                                    <Button size="sm" className="text-xs" onClick={() => {
                                      advanceStep(m.id, "data-ready", { dataSource: "csv", csvFiles: csvFiles.map(f => f.name), trainingPeriod: { from: "", to: "" } })
                                    }}>데이터 확정</Button>
                                  </div>
                                )}
                              </TabsContent>
                            </Tabs>
                          ) : (
                            <p className="text-sm text-muted-foreground">데이터가 아직 설정되지 않았습니다</p>
                          )}
                        </CardContent>
                      </Card>

                      {/* Step 3 - AWS CANVAS 전송 */}
                      <Card className={cn(m.currentStep < 2 && "opacity-50")}>
                        <CardHeader className="pb-2"><CardTitle className="text-sm">Step 3. AWS CANVAS 전송</CardTitle></CardHeader>
                        <CardContent>
                          {m.status === "data-ready" ? (
                            <div className="flex items-center gap-3">
                              <Button size="sm" className="gap-1.5" onClick={() => advanceStep(m.id, "modeling")}>
                                <Send className="h-3.5 w-3.5" />AWS CANVAS로 전송
                              </Button>
                              <p className="text-xs text-muted-foreground">준비된 데이터를 AWS CANVAS로 전송하여 모델링을 시작합니다</p>
                            </div>
                          ) : m.currentStep >= 3 ? (
                            <div className="flex items-center gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="text-green-700 font-medium">전송 완료</span>
                              <span className="text-muted-foreground text-xs ml-2">AWS CANVAS에서 모델링 진행 중</span>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">데이터 준비가 완료되면 전송할 수 있습니다</p>
                          )}
                        </CardContent>
                      </Card>

                      {/* Step 4 - End Point 등록 */}
                      <Card className={cn(m.currentStep < 3 && "opacity-50")}>
                        <CardHeader className="pb-2"><CardTitle className="text-sm">Step 4. End Point 등록</CardTitle></CardHeader>
                        <CardContent>
                          {m.endpointUrl ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded border font-mono text-xs break-all">
                                <Link2 className="h-4 w-4 shrink-0 text-primary" />
                                {m.endpointUrl}
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="text-sm text-green-700 font-medium">등록 완료</span>
                              </div>
                            </div>
                          ) : m.status === "modeling" ? (
                            <div className="space-y-2">
                              <Label className="text-xs">AWS CANVAS End Point URL</Label>
                              <div className="flex gap-2">
                                <Input placeholder="https://runtime.sagemaker...." className="text-xs font-mono flex-1"
                                  onKeyDown={e => {
                                    if (e.key === "Enter" && (e.target as HTMLInputElement).value.trim()) {
                                      advanceStep(m.id, "endpoint-registered", { endpointUrl: (e.target as HTMLInputElement).value.trim() })
                                    }
                                  }}
                                />
                                <Button size="sm" variant="outline" className="text-xs shrink-0 bg-transparent gap-1">
                                  <ExternalLink className="h-3 w-3" />연결 테스트
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground">AWS CANVAS에서 모델링 완료 후 End Point URL을 입력하세요</p>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">외부 모델링이 완료되면 End Point를 등록할 수 있습니다</p>
                          )}
                        </CardContent>
                      </Card>

                      {/* Step 5 - 모델 구성 요청 */}
                      <Card className={cn(m.currentStep < 4 && "opacity-50")}>
                        <CardHeader className="pb-2"><CardTitle className="text-sm">Step 5. 모델 구성 요청</CardTitle></CardHeader>
                        <CardContent>
                          {m.status === "endpoint-registered" ? (
                            <Button size="sm" className="gap-1.5" onClick={() => setShowConfigRequest(true)}>
                              <Send className="h-3.5 w-3.5" />모델 구성 요청
                            </Button>
                          ) : m.currentStep >= 5 ? (
                            <div className="flex items-center gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="text-green-700 font-medium">구성 요청 전송 완료</span>
                              <span className="text-xs text-muted-foreground ml-2">DX팀에서 구성 진행 중</span>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">End Point 등록 후 구성 요청을 진행할 수 있습니다</p>
                          )}
                        </CardContent>
                      </Card>

                      {/* Step 6 / 7 - 상태 정보 */}
                      {m.currentStep >= 6 && (
                        <Card className="border-l-4 border-l-teal-500">
                          <CardContent className="py-4">
                            <div className="flex items-center gap-3">
                              {m.status === "configured" || m.status === "testing" ? (
                                <>
                                  <Beaker className="h-5 w-5 text-teal-600" />
                                  <div>
                                    <p className="text-sm font-medium">운영 검증 대기</p>
                                    <p className="text-xs text-muted-foreground">운영 검증 탭에서 예측 정확도를 확인하고 Production 승격 여부를 결정하세요</p>
                                  </div>
                                  <Button size="sm" variant="outline" className="ml-auto gap-1.5 bg-transparent" onClick={() => {
                                    setShowModelDetail(false)
                                    setWorkspace("validate")
                                    setSelectedModel(m)
                                  }}>
                                    <Eye className="h-3.5 w-3.5" />검증하기
                                  </Button>
                                </>
                              ) : m.status === "production" ? (
                                <>
                                  <Play className="h-5 w-5 text-green-600" />
                                  <div>
                                    <p className="text-sm font-medium text-green-700">Production 등록 완료</p>
                                    <p className="text-xs text-muted-foreground">모델 기반 최적화의 정규 모델로 운영 중입니다</p>
                                  </div>
                                </>
                              ) : null}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Drop 정보 */}
                      {m.status === "dropped" && (
                        <Card className="border-l-4 border-l-red-400">
                          <CardContent className="py-4">
                            <div className="flex items-center gap-3">
                              <AlertTriangle className="h-5 w-5 text-red-500" />
                              <div>
                                <p className="text-sm font-medium text-red-700">Drop 처리됨</p>
                                <p className="text-xs text-muted-foreground mt-0.5">사유: {m.dropReason}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </ScrollArea>
                </>
              )
            })()}
          </DialogContent>
        </Dialog>

        {/* 모델 구성 요청 Dialog */}
        <Dialog open={showConfigRequest} onOpenChange={setShowConfigRequest}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Send className="h-5 w-5" />모델 구성 요청</DialogTitle>
            </DialogHeader>
            {selectedModel && (
              <div className="space-y-4 py-2">
                <div className="p-3 bg-muted/50 rounded-lg space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">모델명</span><span className="font-medium">{selectedModel.name}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">관련 공정</span><span className="font-medium">{selectedModel.unit}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">End Point</span><span className="font-mono text-xs truncate max-w-[250px]">{selectedModel.endpointUrl}</span></div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">수신팀</Label>
                  <Input value="DX추진팀" readOnly className="bg-muted/50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">요청 내용</Label>
                  <Textarea placeholder="모델 구성에 필요한 추가 요청사항을 입력하세요..." rows={3} />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfigRequest(false)}>취소</Button>
              <Button onClick={() => {
                if (selectedModel) advanceStep(selectedModel.id, "config-requested")
                setShowConfigRequest(false)
              }} className="gap-1.5">
                <Send className="h-3.5 w-3.5" />요청 전송
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Drop 사유 Dialog */}
        <Dialog open={showDropDialog} onOpenChange={setShowDropDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600"><AlertTriangle className="h-5 w-5" />모델 Drop</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">Drop된 모델은 더 이상 운영되지 않지만, 이력은 보존됩니다.</p>
              </div>
              {selectedModel && (
                <p className="text-sm"><span className="text-muted-foreground">대상 모델: </span><span className="font-medium">{selectedModel.name}</span></p>
              )}
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><span className="text-destructive">*</span>Drop 사유</Label>
                <Textarea
                  placeholder="예: MAPE 8.5%로 목표 정확도 미달, Feed 조건 변동이 커 모델 재설계 필요"
                  value={dropReason}
                  onChange={e => setDropReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowDropDialog(false); setDropReason("") }}>취소</Button>
              <Button variant="destructive" onClick={handleDrop} disabled={!dropReason.trim()} className="gap-1.5">
                <X className="h-3.5 w-3.5" />Drop 처리
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  )
}
