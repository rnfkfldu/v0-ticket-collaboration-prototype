"use client"

import { useState, useMemo } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { 
  Cpu, Activity, TrendingUp, Gauge, Search, ChevronRight, ArrowLeft,
  Info, RefreshCw, CheckCircle, XCircle, Settings, ExternalLink, Clock
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useUser } from "@/lib/user-context"

// --- Model data ---
const AI_ML_MODELS = [
  { id: "AIM-001", dept: "HOU부문", team: "HCR팀", desc: "[Quality Giveaway 최소화] HCR 공정 W600N Product VI Quality 예측 모델", mlops: "active" as const, accuracy: 94.2, optimization: 12.5, uptime: 98.1, lastTrain: "2026-02-20", process: "HCR", tags: ["TI-3001","TI-3002","PI-3001","FI-3001","FIC-2001"], target: "Product VI", unit: "VI" },
  { id: "AIM-002", dept: "HOU부문", team: "HCR팀", desc: "[운전 이상탐지] PE 공정 Emergency Shutdown 예측 모델", mlops: "active" as const, accuracy: 91.5, optimization: null, uptime: 97.3, lastTrain: "2026-02-18", process: "PE", tags: ["TI-2001","PI-2001","FI-2001"], target: "Shutdown Risk", unit: "%" },
  { id: "AIM-003", dept: "HOU부문", team: "HCR팀", desc: "[운전 최적화] PE 공정 Product MI Quality 예측 모델", mlops: "inactive" as const, accuracy: null, optimization: null, uptime: null, lastTrain: "2026-01-15", process: "PE", tags: [], target: "MI", unit: "g/10min" },
  { id: "AIM-004", dept: "HOU부문", team: "VGOFCC팀", desc: "[운전 최적화] InAlk 공정 Product Yield 예측 모델", mlops: "inactive" as const, accuracy: null, optimization: null, uptime: null, lastTrain: "2026-01-10", process: "InAlk", tags: [], target: "Yield", unit: "%" },
  { id: "AIM-005", dept: "HOU부문", team: "VGOFCC팀", desc: "[운전 최적화] MFC 공정 Furnace Effluent 조성 예측 모델", mlops: "active" as const, accuracy: 88.7, optimization: 8.3, uptime: 95.2, lastTrain: "2026-02-22", process: "MFC", tags: ["TI-4001","PI-4001","FI-4001"], target: "Effluent Comp", unit: "mol%" },
  { id: "AIM-006", dept: "HOU부문", team: "VGOFCC팀", desc: "[운전 이상탐지] PP 공정 Emergency Shutdown 예측 모델", mlops: "active" as const, accuracy: 89.3, optimization: null, uptime: 96.8, lastTrain: "2026-02-19", process: "PP", tags: ["TI-5001","PI-5001","FI-5001"], target: "Shutdown Risk", unit: "%" },
  { id: "AIM-007", dept: "HOU부문", team: "VGOFCC팀", desc: "[운전 최적화] PP 공정 Product MI Quality 예측 모델", mlops: "active" as const, accuracy: 90.1, optimization: 5.7, uptime: 94.5, lastTrain: "2026-02-21", process: "PP", tags: ["TI-5001","TI-5002","PI-5001"], target: "MI", unit: "g/10min" },
  { id: "AIM-008", dept: "HOU부문", team: "HCR팀", desc: "[Quality Giveaway 최소화] BOP 공정 150N/600N 모드 시 DW BTM Product Quality 예측 모델", mlops: "active" as const, accuracy: 92.4, optimization: 10.1, uptime: 97.0, lastTrain: "2026-02-17", process: "BOP", tags: ["TI-3001","TI-3002","PI-3001"], target: "Product Quality", unit: "ppm" },
  { id: "AIM-009", dept: "HOU부문", team: "HCR팀", desc: "[운전 최적화] BOP 공정 4cSt Mode 시 DW 반응기 초기온도 최적화 모델", mlops: "active" as const, accuracy: 93.1, optimization: 7.2, uptime: 96.3, lastTrain: "2026-02-16", process: "BOP", tags: ["TI-3001","PI-3001","FI-3001"], target: "Init Temp", unit: "\u00b0C" },
  { id: "AIM-010", dept: "HOU부문", team: "VDU팀", desc: "[운전 이상탐지] VDU 공정 Vacuum Break 예측 모델", mlops: "active" as const, accuracy: 87.9, optimization: null, uptime: 93.7, lastTrain: "2026-02-20", process: "VDU", tags: ["TI-2001","PI-2001","LI-2001"], target: "Vac Break Risk", unit: "%" },
  { id: "AIM-011", dept: "정유생산부문", team: "정유4팀", desc: "[운전 최적화] No.2 KD 공정 Feed Tank 온도 최적화 모델", mlops: "active" as const, accuracy: 90.8, optimization: 6.4, uptime: 95.1, lastTrain: "2026-02-15", process: "KD", tags: ["TI-1001","FI-1001"], target: "Feed Temp", unit: "\u00b0C" },
  { id: "AIM-012", dept: "HOU부문", team: "HCR팀", desc: "[Quality Giveaway 최소화] VRHCR 공정 HVGO D90% Quality 예측 모델", mlops: "active" as const, accuracy: 91.2, optimization: 9.8, uptime: 96.5, lastTrain: "2026-02-21", process: "VRHCR", tags: ["TI-3001","FI-3001","PI-3001"], target: "D90%", unit: "\u00b0C" },
  { id: "AIM-013", dept: "정유생산부문", team: "정유4팀", desc: "[운전 최적화] No.1 CCR/Platforming 공정 촉매 Coke 예측 모델", mlops: "active" as const, accuracy: 89.6, optimization: 4.3, uptime: 94.8, lastTrain: "2026-02-18", process: "CCR", tags: ["TI-4001","TI-4002","PI-4001"], target: "Coke", unit: "wt%" },
  { id: "AIM-014", dept: "정유생산부문", team: "정유4팀", desc: "[운전 최적화] No.2 CCR/Platforming 공정 촉매 Coke 예측 모델", mlops: "active" as const, accuracy: 88.4, optimization: 3.9, uptime: 93.2, lastTrain: "2026-02-19", process: "CCR", tags: ["TI-4001","PI-4001","FI-4001"], target: "Coke", unit: "wt%" },
  { id: "AIM-015", dept: "정유생산부문", team: "정유4팀", desc: "[Quality Giveaway 최소화] No.4 RR 공정 HSR IBP Quality 예측 모델", mlops: "active" as const, accuracy: 92.7, optimization: 11.2, uptime: 97.4, lastTrain: "2026-02-22", process: "RR", tags: ["TI-1001","TI-1002","FI-1001"], target: "IBP", unit: "\u00b0C" },
  { id: "AIM-016", dept: "정유생산부문", team: "정유탈황2팀", desc: "[Quality Giveaway 최소화] NSU 공정 HSR IBP Quality 예측 모델", mlops: "active" as const, accuracy: 91.9, optimization: 8.7, uptime: 96.1, lastTrain: "2026-02-20", process: "NSU", tags: ["TI-6001","FI-6001"], target: "IBP", unit: "\u00b0C" },
  { id: "AIM-017", dept: "정유생산부문", team: "정유3팀", desc: "[Quality Giveaway 최소화] Common RR 공정 HSR IBP Quality 예측 모델", mlops: "active" as const, accuracy: 90.3, optimization: 7.5, uptime: 95.8, lastTrain: "2026-02-21", process: "RR", tags: ["TI-1001","FI-1001","PI-1001"], target: "IBP", unit: "\u00b0C" },
  { id: "AIM-018", dept: "", team: "", desc: "[PROTOTYPE] SHU RON 예측 모델", mlops: "active" as const, accuracy: null, optimization: null, uptime: null, lastTrain: "2026-02-10", process: "SHU", tags: ["TI-6001"], target: "RON", unit: "" },
]

// --- Generate mock time series ---
function generateTrendData(baseValue: number, variance: number, count: number) {
  const data = []
  let v = baseValue
  for (let i = 0; i < count; i++) {
    v += (Math.random() - 0.5) * variance
    const predicted = v + (Math.random() - 0.5) * variance * 0.3
    const target = baseValue
    const d = new Date(2026, 1, 18)
    d.setHours(d.getHours() + i * 4)
    data.push({ time: `${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:00`, actual: +v.toFixed(1), predicted: +predicted.toFixed(1), target: +target.toFixed(1) })
  }
  return data
}

function generateAccuracyBars() {
  return ["2025-10","2025-11","2025-12","2026-01","2026-02"].map(m => ({
    month: m,
    accuracy: 75 + Math.random() * 20,
  }))
}

export default function AIMLModelsPage() {
  const { currentUser } = useUser()
  
  // 페이지 로컬 스코프 토글 (담당공정/전체공정)
  const [showMyProcessesOnly, setShowMyProcessesOnly] = useState(true)
  const myProcessIds = currentUser.assignedProcessIds
  
  const [view, setView] = useState<"list" | "detail">("list")
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [deptFilter, setDeptFilter] = useState("all")
  const [teamFilter, setTeamFilter] = useState("all")
  const [processFilter, setProcessFilter] = useState("all")
  const [myOnly, setMyOnly] = useState(false)
  // Detail view state
  const [detailTab, setDetailTab] = useState("prediction")
  const [detailPeriodFrom] = useState("2026-02-18")
  const [detailPeriodTo] = useState("2026-02-25")

  const filteredModels = useMemo(() => {
    return AI_ML_MODELS.filter(m => {
      // 담당공정 필터링
      if (showMyProcessesOnly && !myProcessIds.includes(m.process)) return false
      if (searchQuery && !m.desc.toLowerCase().includes(searchQuery.toLowerCase()) && !m.id.toLowerCase().includes(searchQuery.toLowerCase())) return false
      if (deptFilter !== "all" && m.dept !== deptFilter) return false
      if (teamFilter !== "all" && m.team !== teamFilter) return false
      if (processFilter !== "all" && m.process !== processFilter) return false
      return true
    })
  }, [searchQuery, deptFilter, teamFilter, processFilter, showMyProcessesOnly, myProcessIds])

  const activeCount = AI_ML_MODELS.filter(m => m.mlops === "active").length
  const avgAccuracy = AI_ML_MODELS.filter(m => m.accuracy).reduce((s, m) => s + (m.accuracy || 0), 0) / (AI_ML_MODELS.filter(m => m.accuracy).length || 1)

  const selectedModel = AI_ML_MODELS.find(m => m.id === selectedModelId)

  const openDetail = (model: typeof AI_ML_MODELS[0]) => {
    setSelectedModelId(model.id)
    setView("detail")
    setDetailTab("prediction")
  }

  // Unique filter options
  const departments = [...new Set(AI_ML_MODELS.map(m => m.dept).filter(Boolean))]
  const teams = [...new Set(AI_ML_MODELS.map(m => m.team).filter(Boolean))]
  const processes = [...new Set(AI_ML_MODELS.map(m => m.process).filter(Boolean))]

  return (
    <AppShell>
      {view === "list" ? (
  <div className="p-6 space-y-5">
  {/* Header */}
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <h1 className="text-xl font-bold">AI/ML 모델</h1>
      <Info className="h-4 w-4 text-muted-foreground" />
    </div>
    {/* Scope Toggle - 담당공정/전체공정 */}
    <div className="flex items-center gap-3 bg-muted/50 rounded-lg px-3 py-1.5">
      <Label htmlFor="aiml-scope-toggle" className="text-xs text-muted-foreground cursor-pointer">
        전체공정
      </Label>
      <Switch 
        id="aiml-scope-toggle"
        checked={showMyProcessesOnly}
        onCheckedChange={setShowMyProcessesOnly}
      />
      <Label htmlFor="aiml-scope-toggle" className="text-xs cursor-pointer">
        <span className={showMyProcessesOnly ? "text-primary font-medium" : "text-muted-foreground"}>
          담당공정 ({myProcessIds.length})
        </span>
      </Label>
    </div>
  </div>

          {/* Filters */}
          <Card>
            <CardContent className="py-3">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 border rounded-md overflow-hidden text-sm">
                  {["D","W","M","Y"].map((p,i) => (
                    <button key={p} className={cn("px-3 py-1.5 text-xs font-medium transition-colors", i === 1 ? "bg-foreground text-background" : "hover:bg-muted")}>{p}</button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                  <Input type="date" defaultValue="2026-02-18" className="h-8 w-36 text-xs" />
                  <span className="text-muted-foreground">-</span>
                  <Input type="date" defaultValue="2026-02-25" className="h-8 w-36 text-xs" />
                </div>
                <Separator orientation="vertical" className="h-6" />
                <span className="text-xs text-muted-foreground">부문</span>
                <Select value={deptFilter} onValueChange={setDeptFilter}>
                  <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{[{v:"all",l:"전체 선택"},...departments.map(d=>({v:d,l:d}))].map(o=><SelectItem key={o.v} value={o.v} className="text-xs">{o.l}</SelectItem>)}</SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground">팀</span>
                <Select value={teamFilter} onValueChange={setTeamFilter}>
                  <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{[{v:"all",l:"전체 선택"},...teams.map(d=>({v:d,l:d}))].map(o=><SelectItem key={o.v} value={o.v} className="text-xs">{o.l}</SelectItem>)}</SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground">공정</span>
                <Select value={processFilter} onValueChange={setProcessFilter}>
                  <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{[{v:"all",l:"전체 선택"},...processes.map(d=>({v:d,l:d}))].map(o=><SelectItem key={o.v} value={o.v} className="text-xs">{o.l}</SelectItem>)}</SelectContent>
                </Select>
                <label className="flex items-center gap-1.5 text-xs ml-auto cursor-pointer">
                  <input type="checkbox" checked={myOnly} onChange={e => setMyOnly(e.target.checked)} className="rounded" />
                  내 담당 보기
                </label>
                <Button variant="outline" size="sm" className="h-8 gap-1.5"><RefreshCw className="h-3 w-3" /></Button>
                <Button size="sm" className="h-8 bg-teal-600 hover:bg-teal-700 text-white">조회</Button>
              </div>
            </CardContent>
          </Card>

          {/* KPI Summary */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="bg-teal-600 text-white">
              <CardContent className="py-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center"><Settings className="h-5 w-5" /></div>
                <div>
                  <p className="text-sm opacity-80">가동 모델 수</p>
                  <p className="text-xl font-bold">{activeCount} <span className="text-sm font-normal opacity-70">/ {AI_ML_MODELS.length}</span></p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center"><TrendingUp className="h-5 w-5 text-amber-600" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">모델 정확도</p>
                  <p className="text-xl font-bold">{avgAccuracy.toFixed(0)} <span className="text-sm font-normal text-muted-foreground">/ 90 (%)</span></p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center"><Gauge className="h-5 w-5 text-blue-600" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">운영 최적화 비율</p>
                  <p className="text-xl font-bold">0 <span className="text-sm font-normal text-muted-foreground">/ 50 (%)</span></p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center"><Activity className="h-5 w-5 text-green-600" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">모델 가동률</p>
                  <p className="text-xl font-bold">0 <span className="text-sm font-normal text-muted-foreground">/ 60 (%)</span></p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Model list table */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-base font-semibold">모델 리스트</h2>
              <Info className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">부문</th>
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">팀</th>
                      <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Model Description</th>
                      <th className="text-center px-4 py-2.5 font-medium text-muted-foreground text-xs">모델 정보</th>
                      <th className="text-center px-4 py-2.5 font-medium text-muted-foreground text-xs">MLOps 가동 여부</th>
                      <th className="text-center px-4 py-2.5 font-medium text-muted-foreground text-xs">정확도 (%)</th>
                      <th className="text-center px-4 py-2.5 font-medium text-muted-foreground text-xs">최적화 (%)</th>
                      <th className="text-center px-4 py-2.5 font-medium text-muted-foreground text-xs">가동률 (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredModels.map(model => (
                      <tr key={model.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => openDetail(model)}>
                        <td className="px-4 py-2.5 text-xs">{model.dept || "-"}</td>
                        <td className="px-4 py-2.5 text-xs">{model.team || "-"}</td>
                        <td className="px-4 py-2.5 text-xs text-teal-700 hover:underline font-medium max-w-[400px]">{model.desc}</td>
                        <td className="px-4 py-2.5 text-center"><Info className="h-3.5 w-3.5 text-blue-500 inline-block" /></td>
                        <td className="px-4 py-2.5 text-center">
                          <Badge variant="outline" className={cn("text-[10px]", model.mlops === "active" ? "bg-teal-50 text-teal-700 border-teal-200" : "bg-red-50 text-red-600 border-red-200")}>
                            {model.mlops === "active" ? "가동중" : "비가동"}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5 text-center text-xs">{model.accuracy ? `${model.accuracy}` : "No Data"}</td>
                        <td className="px-4 py-2.5 text-center text-xs">{model.optimization ? `${model.optimization}` : "(-)"}</td>
                        <td className="px-4 py-2.5 text-center text-xs">{model.uptime ? `${model.uptime}` : "No Data"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              <div className="flex items-center justify-center gap-3 py-3 border-t text-xs text-muted-foreground">
                <span>총 {filteredModels.length}건</span>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" className="h-7 w-7 p-0 text-xs">1</Button>
                </div>
                <Select defaultValue="30">
                  <SelectTrigger className="h-7 w-16 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="30" className="text-xs">30</SelectItem><SelectItem value="50" className="text-xs">50</SelectItem></SelectContent>
                </Select>
                <span>/page</span>
              </div>
            </Card>
          </div>
        </div>
      ) : selectedModel ? (
        /* ============== DETAIL VIEW (Image 2 style) ============== */
        <div className="p-6 space-y-5">
          {/* Breadcrumb + title */}
          <div className="space-y-3">
            <Button variant="ghost" size="sm" className="gap-1.5 -ml-2" onClick={() => setView("list")}>
              <ArrowLeft className="h-4 w-4" /> AI/ML 모델 목록
            </Button>
            <h1 className="text-lg font-bold">{selectedModel.desc}</h1>
            {/* Filter bar */}
            <Card>
              <CardContent className="py-2.5">
                <div className="flex items-center gap-3 flex-wrap text-xs">
                  <span className="text-muted-foreground">부문</span>
                  <Input readOnly value={selectedModel.dept || "-"} className="h-7 w-32 text-xs bg-muted/30" />
                  <span className="text-muted-foreground">팀</span>
                  <Input readOnly value={selectedModel.team || "-"} className="h-7 w-32 text-xs bg-muted/30" />
                  <span className="text-muted-foreground">공정</span>
                  <Input readOnly value={selectedModel.process} className="h-7 w-20 text-xs bg-muted/30" />
                  <span className="text-muted-foreground">모델</span>
                  <Input readOnly value={selectedModel.desc} className="h-7 flex-1 min-w-[200px] text-xs bg-muted/30" />
                  <Button variant="outline" size="sm" className="h-7"><RefreshCw className="h-3 w-3" /></Button>
                  <Button size="sm" className="h-7 bg-teal-600 hover:bg-teal-700 text-white">조회</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sub-tabs */}
          <div className="flex gap-6 border-b">
            {[
              { id: "prediction", label: "예측값 모니터링" },
              { id: "optimization", label: "최적화 모니터링" },
              { id: "uptime", label: "가동률 모니터링" },
            ].map(tab => (
              <button key={tab.id}
                className={cn("pb-2 text-sm font-medium border-b-2 transition-colors cursor-pointer", detailTab === tab.id ? "border-teal-600 text-teal-700" : "border-transparent text-muted-foreground hover:text-foreground")}
                onClick={() => setDetailTab(tab.id)}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Overview section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Overview</h2>
              <div className="flex items-center gap-2 text-xs">
                <Input type="date" defaultValue={detailPeriodFrom} className="h-7 w-32 text-xs" />
                <span className="text-muted-foreground">-</span>
                <Input type="date" defaultValue={detailPeriodTo} className="h-7 w-32 text-xs" />
                <div className="flex border rounded-md overflow-hidden ml-2">
                  {["D","W","M","Y"].map((p,i) => (
                    <button key={p} className={cn("px-2.5 py-1 text-xs font-medium transition-colors", i === 0 ? "bg-foreground text-background" : "hover:bg-muted")}>{p}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-5">
              {/* Summary sidebar */}
              <Card className="w-72 shrink-0 bg-[#2d3748] text-white">
                <CardContent className="py-4 space-y-4">
                  <div>
                    <h3 className="font-semibold text-sm">Summary</h3>
                    <p className="text-xs text-white/60 mt-0.5">Model Accuracy (%)</p>
                    {/* Donut chart placeholder */}
                    <div className="flex items-center justify-center my-4">
                      <div className="relative">
                        <svg width="120" height="120" viewBox="0 0 120 120">
                          <circle cx="60" cy="60" r="50" fill="none" stroke="#4a5568" strokeWidth="10" />
                          {selectedModel.accuracy && (
                            <circle cx="60" cy="60" r="50" fill="none" stroke="#38b2ac"
                              strokeWidth="10" strokeLinecap="round"
                              strokeDasharray={`${(selectedModel.accuracy / 100) * 314} 314`}
                              transform="rotate(-90 60 60)" />
                          )}
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl font-bold">{selectedModel.accuracy ? `${selectedModel.accuracy}%` : "N/A"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-white/60">평균 오차</p>
                    <div className="flex items-center gap-2 bg-white/10 rounded px-2.5 py-1.5 text-sm">
                      <div className="h-2 w-2 rounded-full bg-teal-400" />
                      {selectedModel.accuracy ? `${(100 - selectedModel.accuracy).toFixed(1)}%` : "N/A"}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-white/60">최근 학습 시점</p>
                    <div className="flex items-center gap-2 bg-white/10 rounded px-2.5 py-1.5 text-sm">
                      <Clock className="h-3.5 w-3.5 text-teal-400" />
                      {selectedModel.lastTrain}
                    </div>
                  </div>
                  <Separator className="bg-white/20" />
                  <div>
                    <p className="text-xs font-semibold mb-2">Quick Link</p>
                    <Button variant="outline" size="sm" className="w-full text-xs border-white/30 text-white hover:bg-white/10 bg-transparent">
                      모델 개선 요청
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Trend chart */}
              <Card className="flex-1">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold">AI/ML 모델 예측값, 실측값 Trend</h3>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1"><span className="h-0.5 w-4 bg-green-500 inline-block" /> Actual</span>
                      <span className="flex items-center gap-1"><span className="h-0.5 w-4 bg-orange-400 inline-block" /> Predict</span>
                      <span className="flex items-center gap-1"><span className="h-0.5 w-4 bg-teal-700 inline-block" /> Target</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{selectedModel.unit}</p>
                  {(() => {
                    const trendData = generateTrendData(selectedModel.accuracy ? 115 + (selectedModel.accuracy - 90) : 100, 3, 42)
                    const W = 700, H = 250, pad = { t: 15, b: 35, l: 45, r: 15 }
                    const cw = W - pad.l - pad.r, ch = H - pad.t - pad.b
                    const allV = trendData.flatMap(d => [d.actual, d.predicted, d.target])
                    const maxV = Math.max(...allV) * 1.005, minV = Math.min(...allV) * 0.995
                    const range = maxV - minV || 1
                    const toX = (i: number) => pad.l + (i / (trendData.length - 1)) * cw
                    const toY = (v: number) => pad.t + (1 - (v - minV) / range) * ch
                    const mkPath = (vals: number[]) => vals.map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(v)}`).join(" ")
                    // Y-axis labels
                    const ySteps = 5
                    return (
                      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 250 }}>
                        {/* Y-axis */}
                        {Array.from({ length: ySteps + 1 }).map((_, i) => {
                          const v = minV + (range / ySteps) * i
                          const y = toY(v)
                          return (<g key={i}>
                            <line x1={pad.l} y1={y} x2={W - pad.r} y2={y} stroke="#e5e7eb" strokeWidth="0.5" />
                            <text x={pad.l - 5} y={y + 3} textAnchor="end" fontSize="8" fill="#9ca3af">{v.toFixed(1)}</text>
                          </g>)
                        })}
                        {/* X-axis labels */}
                        {trendData.filter((_, i) => i % 6 === 0).map((d, i) => (
                          <text key={i} x={toX(i * 6)} y={H - 5} textAnchor="middle" fontSize="7" fill="#9ca3af">{d.time}</text>
                        ))}
                        {/* Target line */}
                        <path d={mkPath(trendData.map(d => d.target))} fill="none" stroke="#0d9488" strokeWidth="1.5" />
                        {/* Actual line */}
                        <path d={mkPath(trendData.map(d => d.actual))} fill="none" stroke="#22c55e" strokeWidth="1.2" />
                        {/* Predicted line */}
                        <path d={mkPath(trendData.map(d => d.predicted))} fill="none" stroke="#f97316" strokeWidth="1.2" strokeDasharray="4 2" />
                      </svg>
                    )
                  })()}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Analyze section */}
          <div className="space-y-3">
            <h2 className="font-semibold">Analyze</h2>
            <div className="grid grid-cols-2 gap-5">
              {/* Accuracy bar chart */}
              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold">기간 별 정확도 Target/Actual</h3>
                    <div className="flex items-center gap-2 text-xs">
                      <Select defaultValue="3m">
                        <SelectTrigger className="h-7 w-24 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3m" className="text-xs">3 Months</SelectItem>
                          <SelectItem value="6m" className="text-xs">6 Months</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex border rounded overflow-hidden">
                        <button className="px-2 py-0.5 text-[10px] hover:bg-muted">W</button>
                        <button className="px-2 py-0.5 text-[10px] bg-teal-600 text-white">M</button>
                      </div>
                    </div>
                  </div>
                  {(() => {
                    const bars = generateAccuracyBars()
                    const W = 350, H = 160, pad = { t: 10, b: 25, l: 30, r: 10 }
                    const bw = (W - pad.l - pad.r) / bars.length * 0.6
                    const gap = (W - pad.l - pad.r) / bars.length
                    return (
                      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 160 }}>
                        {/* Target line at 90 */}
                        <line x1={pad.l} y1={pad.t + (1 - 90/100) * (H - pad.t - pad.b)} x2={W - pad.r} y2={pad.t + (1 - 90/100) * (H - pad.t - pad.b)} stroke="#ef4444" strokeWidth="1" strokeDasharray="4 2" />
                        <text x={W - pad.r + 2} y={pad.t + (1 - 90/100) * (H - pad.t - pad.b) + 3} fontSize="7" fill="#ef4444">Target: 90</text>
                        {/* Y-axis */}
                        {[50, 75, 100].map(v => {
                          const y = pad.t + (1 - v/100) * (H - pad.t - pad.b)
                          return <text key={v} x={pad.l - 3} y={y + 3} textAnchor="end" fontSize="7" fill="#9ca3af">{v}</text>
                        })}
                        {/* Bars */}
                        {bars.map((b, i) => {
                          const x = pad.l + i * gap + gap * 0.2
                          const h = (b.accuracy / 100) * (H - pad.t - pad.b)
                          const y = H - pad.b - h
                          return (<g key={i}>
                            <rect x={x} y={y} width={bw} height={h} fill="#2dd4bf" rx="2" />
                            <text x={x + bw/2} y={H - 8} textAnchor="middle" fontSize="7" fill="#6b7280">{b.month}</text>
                          </g>)
                        })}
                      </svg>
                    )
                  })()}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                    <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-teal-400 inline-block" /> Actual</span>
                  </div>
                </CardContent>
              </Card>

              {/* Feature boxplot */}
              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold">주요 X Feature</h3>
                    <div className="flex border rounded overflow-hidden">
                      {["D","W","M"].map((p,i) => (
                        <button key={p} className={cn("px-2 py-0.5 text-[10px] font-medium", i === 0 ? "bg-teal-600 text-white" : "hover:bg-muted")}>{p}</button>
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mb-3 flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Boxplot 데이터 기간: 2026-01-01 ~ 2026-02-24 (모델 학습에 이용된 데이터 중 구간)
                  </p>
                  {(() => {
                    const features = (selectedModel.tags || []).slice(0, 5)
                    if (features.length === 0) return <p className="text-xs text-muted-foreground text-center py-8">태그 데이터가 없습니다</p>
                    const W = 350, H = 140, pad = { t: 5, b: 20, l: 10, r: 10 }
                    const gap = (W - pad.l - pad.r) / features.length
                    return (
                      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 140 }}>
                        {features.map((f, i) => {
                          const cx = pad.l + i * gap + gap / 2
                          const q1 = 40 + Math.random() * 20
                          const q3 = q1 + 15 + Math.random() * 15
                          const med = (q1 + q3) / 2
                          const lo = q1 - 10 - Math.random() * 10
                          const hi = q3 + 10 + Math.random() * 10
                          const scale = (v: number) => pad.t + (1 - v/120) * (H - pad.t - pad.b)
                          return (<g key={f}>
                            {/* Whiskers */}
                            <line x1={cx} y1={scale(hi)} x2={cx} y2={scale(q3)} stroke="#2dd4bf" strokeWidth="1" />
                            <line x1={cx} y1={scale(q1)} x2={cx} y2={scale(lo)} stroke="#2dd4bf" strokeWidth="1" />
                            <line x1={cx-10} y1={scale(hi)} x2={cx+10} y2={scale(hi)} stroke="#2dd4bf" strokeWidth="1" />
                            <line x1={cx-10} y1={scale(lo)} x2={cx+10} y2={scale(lo)} stroke="#2dd4bf" strokeWidth="1" />
                            {/* Box */}
                            <rect x={cx-15} y={scale(q3)} width={30} height={scale(q1)-scale(q3)} fill="#ccfbf1" stroke="#2dd4bf" strokeWidth="1" rx="1" />
                            {/* Median */}
                            <line x1={cx-15} y1={scale(med)} x2={cx+15} y2={scale(med)} stroke="#0d9488" strokeWidth="2" />
                            {/* Label */}
                            <text x={cx} y={H - 5} textAnchor="middle" fontSize="7" fill="#6b7280">{f}</text>
                          </g>)
                        })}
                      </svg>
                    )
                  })()}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  )
}
